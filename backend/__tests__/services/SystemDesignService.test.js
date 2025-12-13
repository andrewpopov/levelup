import SystemDesignService from '../../services/SystemDesignService.js';
import db from '../../database.js';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

describe('SystemDesignService', () => {
  let testUserId = 1;
  let testJourneyId;
  let testSessionId;
  let testQuestionId;

  beforeAll(() => {
    // Create a test user if needed
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO users (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)',
        [testUserId, 'test@example.com', 'hash', 'Test User'],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  afterAll(() => {
    // Clean up test data
    return new Promise((resolve) => {
      db.serialize(() => {
        db.run('DELETE FROM user_system_design_responses WHERE user_id = ?', [testUserId]);
        db.run('DELETE FROM system_design_question_bank_state WHERE user_id = ?', [testUserId]);
        db.run('DELETE FROM user_flashcard_sessions WHERE user_id = ?', [testUserId]);
        db.run('DELETE FROM flashcard_journeys WHERE created_by = ?', [testUserId], () => {
          resolve();
        });
      });
    });
  });

  describe('loadSystemDesignQuestions', () => {
    it('should load questions from JSON template', async () => {
      const questions = await SystemDesignService.loadSystemDesignQuestions();
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toHaveProperty('question_key');
      expect(questions[0]).toHaveProperty('title');
      expect(questions[0]).toHaveProperty('prompt');
      expect(questions[0]).toHaveProperty('guided_answer');
    });

    it('should have all required fields in questions', async () => {
      const questions = await SystemDesignService.loadSystemDesignQuestions();
      questions.forEach((q) => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('question_key');
        expect(q).toHaveProperty('title');
        expect(q).toHaveProperty('prompt');
        expect(q).toHaveProperty('guided_answer');
        expect(q).toHaveProperty('category');
        expect(q).toHaveProperty('difficulty');
      });
    });
  });

  describe('seedSystemDesignQuestions', () => {
    it('should seed questions into the database', async () => {
      const count = await SystemDesignService.seedSystemDesignQuestions();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);

      // Verify questions were inserted
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM system_design_questions',
          (err, row) => {
            if (err) reject(err);
            expect(row.count).toBeGreaterThan(0);
            resolve();
          }
        );
      });
    });
  });

  describe('createFlashcardJourney', () => {
    it('should create a new flashcard journey', async () => {
      testJourneyId = await SystemDesignService.createFlashcardJourney(
        testUserId,
        'Test Journey',
        'Test Description'
      );
      expect(typeof testJourneyId).toBe('number');
      expect(testJourneyId).toBeGreaterThan(0);
    });

    it('should retrieve created journey', async () => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM flashcard_journeys WHERE id = ?',
          [testJourneyId],
          (err, journey) => {
            if (err) reject(err);
            expect(journey).toBeDefined();
            expect(journey.title).toBe('Test Journey');
            expect(journey.created_by).toBe(testUserId);
            resolve();
          }
        );
      });
    });
  });

  describe('startFlashcardSession', () => {
    it('should start a new session', async () => {
      testSessionId = await SystemDesignService.startFlashcardSession(testUserId, testJourneyId);
      expect(typeof testSessionId).toBe('number');
      expect(testSessionId).toBeGreaterThan(0);
    });

    it('should initialize question bank state', async () => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM system_design_question_bank_state WHERE user_id = ? AND flashcard_journey_id = ?',
          [testUserId, testJourneyId],
          (err, row) => {
            if (err) reject(err);
            expect(row.count).toBeGreaterThan(0);
            resolve();
          }
        );
      });
    });
  });

  describe('getNextQuestion', () => {
    it('should return an unanswered question', async () => {
      const question = await SystemDesignService.getNextQuestion(testUserId, testJourneyId);
      expect(question).toBeDefined();
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('title');
      expect(question).toHaveProperty('prompt');
      testQuestionId = question.id;
    });

    it('should not include guided_answer in initial question', async () => {
      const question = await SystemDesignService.getNextQuestion(testUserId, testJourneyId);
      expect(question).not.toHaveProperty('guided_answer');
    });
  });

  describe('submitAnswer', () => {
    it('should submit an answer to a question', async () => {
      const responseId = await SystemDesignService.submitAnswer(
        testUserId,
        testSessionId,
        testQuestionId,
        'This is my answer to the system design question.'
      );
      expect(typeof responseId).toBe('number');
      expect(responseId).toBeGreaterThan(0);
    });

    it('should mark question as answered in bank state', async () => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT is_answered FROM system_design_question_bank_state WHERE user_id = ? AND question_id = ?',
          [testUserId, testQuestionId],
          (err, row) => {
            if (err) reject(err);
            expect(row.is_answered).toBe(1);
            resolve();
          }
        );
      });
    });

    it('should increment answer count', async () => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT answer_count FROM system_design_question_bank_state WHERE user_id = ? AND question_id = ?',
          [testUserId, testQuestionId],
          (err, row) => {
            if (err) reject(err);
            expect(row.answer_count).toBe(1);
            resolve();
          }
        );
      });
    });
  });

  describe('getGuidedAnswer', () => {
    it('should return the guided answer', async () => {
      const answer = await SystemDesignService.getGuidedAnswer(testUserId, testSessionId, testQuestionId);
      expect(typeof answer).toBe('string');
      expect(answer.length).toBeGreaterThan(0);
    });

    it('should mark guided answer as viewed', async () => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT viewed_guided_answer FROM user_system_design_responses WHERE user_id = ? AND session_id = ? AND question_id = ?',
          [testUserId, testSessionId, testQuestionId],
          (err, row) => {
            if (err) reject(err);
            expect(row.viewed_guided_answer).toBe(1);
            resolve();
          }
        );
      });
    });
  });

  describe('getUserResponse', () => {
    it('should retrieve user response', async () => {
      const response = await SystemDesignService.getUserResponse(testUserId, testSessionId, testQuestionId);
      expect(response).toBeDefined();
      expect(response.user_answer).toBe('This is my answer to the system design question.');
      expect(response.viewed_guided_answer).toBe(1);
    });

    it('should return null for non-existent response', async () => {
      const response = await SystemDesignService.getUserResponse(
        testUserId,
        testSessionId,
        9999
      );
      expect(response).toBeUndefined();
    });
  });

  describe('getSessionProgress', () => {
    it('should return progress object', async () => {
      const progress = await SystemDesignService.getSessionProgress(testUserId, testJourneyId);
      expect(progress).toBeDefined();
      expect(progress).toHaveProperty('total_questions');
      expect(progress).toHaveProperty('answered_questions');
      expect(progress).toHaveProperty('unanswered_questions');
      expect(progress).toHaveProperty('attempted_questions');
    });

    it('should show correct progress counts', async () => {
      const progress = await SystemDesignService.getSessionProgress(testUserId, testJourneyId);
      expect(progress.answered_questions).toBeGreaterThan(0);
      expect(progress.total_questions).toBeGreaterThan(progress.answered_questions);
      expect(progress.unanswered_questions).toBe(progress.total_questions - progress.answered_questions);
    });
  });

  describe('resetQuestionBankState', () => {
    it('should reset all questions to unanswered', async () => {
      await SystemDesignService.resetQuestionBankState(testUserId, testJourneyId);

      return new Promise((resolve, reject) => {
        db.get(
          'SELECT is_answered FROM system_design_question_bank_state WHERE user_id = ? AND question_id = ?',
          [testUserId, testQuestionId],
          (err, row) => {
            if (err) reject(err);
            expect(row.is_answered).toBe(0);
            resolve();
          }
        );
      });
    });

    it('should reset answer count to zero', async () => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT answer_count FROM system_design_question_bank_state WHERE user_id = ? AND question_id = ?',
          [testUserId, testQuestionId],
          (err, row) => {
            if (err) reject(err);
            expect(row.answer_count).toBe(0);
            resolve();
          }
        );
      });
    });
  });

  describe('endSession', () => {
    it('should end a session', async () => {
      await SystemDesignService.endSession(testSessionId);

      return new Promise((resolve, reject) => {
        db.get(
          'SELECT status FROM user_flashcard_sessions WHERE id = ?',
          [testSessionId],
          (err, row) => {
            if (err) reject(err);
            expect(row.status).toBe('completed');
            resolve();
          }
        );
      });
    });
  });

  describe('getUserFlashcardJourneys', () => {
    it('should return user journeys', async () => {
      const journeys = await SystemDesignService.getUserFlashcardJourneys(testUserId);
      expect(Array.isArray(journeys)).toBe(true);
      expect(journeys.length).toBeGreaterThan(0);
      expect(journeys[0]).toHaveProperty('id');
      expect(journeys[0]).toHaveProperty('title');
    });
  });

  describe('getSessionDetails', () => {
    it('should return session details with progress', async () => {
      // Create a new session for this test
      const newSessionId = await SystemDesignService.startFlashcardSession(testUserId, testJourneyId);
      const details = await SystemDesignService.getSessionDetails(testUserId, newSessionId);

      expect(details).toBeDefined();
      expect(details).toHaveProperty('id');
      expect(details).toHaveProperty('journey_title');
      expect(details).toHaveProperty('progress');
      expect(details.progress).toHaveProperty('total_questions');
    });
  });

  describe('Endless journey behavior', () => {
    it('should cycle through all questions', async () => {
      // Create a fresh journey for this test
      const journeyId = await SystemDesignService.createFlashcardJourney(testUserId);
      const sessionId = await SystemDesignService.startFlashcardSession(testUserId, journeyId);

      // Get and answer first question
      const q1 = await SystemDesignService.getNextQuestion(testUserId, journeyId);
      expect(q1).toBeDefined();
      await SystemDesignService.submitAnswer(testUserId, sessionId, q1.id, 'Answer 1');

      // Get progress
      let progress = await SystemDesignService.getSessionProgress(testUserId, journeyId);
      const totalQuestions = progress.total_questions;

      // Simulate answering multiple questions
      for (let i = 1; i < Math.min(5, totalQuestions); i++) {
        const question = await SystemDesignService.getNextQuestion(testUserId, journeyId);
        expect(question).toBeDefined();
        expect(question.id).not.toBe(q1.id); // Should be different
        await SystemDesignService.submitAnswer(testUserId, sessionId, question.id, `Answer ${i + 1}`);
      }

      // Check that we've answered multiple different questions
      progress = await SystemDesignService.getSessionProgress(testUserId, journeyId);
      expect(progress.answered_questions).toBeGreaterThan(1);
    });
  });
});
