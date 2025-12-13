import request from 'supertest';
import app from '../../server.js';
import db from '../../database.js';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import SystemDesignService from '../../services/SystemDesignService.js';

describe('System Design Routes', () => {
  const testUserId = 999; // Use unique ID to avoid conflicts
  let journeyId;
  let sessionId;
  let questionId;

  beforeAll(async () => {
    // Create test user
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO users (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)',
        [testUserId, 'sdtest@example.com', 'hash', 'SD Test User'],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Seed questions
    try {
      await SystemDesignService.seedSystemDesignQuestions();
    } catch (e) {
      // Questions might already be seeded
      console.log('Questions already seeded or seed error:', e.message);
    }
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

  describe('POST /api/system-design/journeys', () => {
    it('should create a new flashcard journey', async () => {
      const res = await request(app)
        .post('/api/system-design/journeys')
        .send({ userId: testUserId })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('journeyId');
      expect(typeof res.body.journeyId).toBe('number');
      journeyId = res.body.journeyId;
    });

    it('should return 400 if userId is missing', async () => {
      const res = await request(app)
        .post('/api/system-design/journeys')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/system-design/journeys/:journeyId/sessions', () => {
    it('should start a new flashcard session', async () => {
      const res = await request(app)
        .post(`/api/system-design/journeys/${journeyId}/sessions`)
        .send({ userId: testUserId })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('sessionId');
      expect(typeof res.body.sessionId).toBe('number');
      sessionId = res.body.sessionId;
    });

    it('should return 400 if userId is missing', async () => {
      const res = await request(app)
        .post(`/api/system-design/journeys/${journeyId}/sessions`)
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/system-design/sessions/:sessionId/next-question', () => {
    it('should return the next unanswered question', async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/next-question`)
        .query({ userId: testUserId, journeyId })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('question');
      expect(res.body.question).toHaveProperty('id');
      expect(res.body.question).toHaveProperty('title');
      expect(res.body.question).toHaveProperty('prompt');
      expect(res.body.question).toHaveProperty('difficulty');
      expect(res.body.question).not.toHaveProperty('guided_answer');
      questionId = res.body.question.id;
    });

    it('should return different questions on repeated calls', async () => {
      // Submit answer to first question
      await request(app)
        .post(`/api/system-design/sessions/${sessionId}/submit-answer`)
        .send({ userId: testUserId, sessionId, questionId, answer: 'Test answer' })
        .expect(200);

      // Get next question
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/next-question`)
        .query({ userId: testUserId, journeyId })
        .expect(200);

      expect(res.body.question.id).not.toBe(questionId);
    });

    it('should return 400 if required params are missing', async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/next-question`)
        .query({ userId: testUserId })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/system-design/sessions/:sessionId/submit-answer', () => {
    let testQuestionId;

    beforeAll(async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/next-question`)
        .query({ userId: testUserId, journeyId });
      testQuestionId = res.body.question.id;
    });

    it('should submit an answer successfully', async () => {
      const res = await request(app)
        .post(`/api/system-design/sessions/${sessionId}/submit-answer`)
        .send({
          userId: testUserId,
          sessionId,
          questionId: testQuestionId,
          answer: 'Design a URL shortener with caching and load balancing...'
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('responseId');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post(`/api/system-design/sessions/${sessionId}/submit-answer`)
        .send({ userId: testUserId })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/system-design/sessions/:sessionId/questions/:questionId/guided-answer', () => {
    let testQuestionId;

    beforeAll(async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/next-question`)
        .query({ userId: testUserId, journeyId });
      testQuestionId = res.body.question.id;

      // Submit answer
      await request(app)
        .post(`/api/system-design/sessions/${sessionId}/submit-answer`)
        .send({
          userId: testUserId,
          sessionId,
          questionId: testQuestionId,
          answer: 'My answer'
        });
    });

    it('should return the guided answer', async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/questions/${testQuestionId}/guided-answer`)
        .query({ userId: testUserId, sessionId })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('guidedAnswer');
      expect(typeof res.body.guidedAnswer).toBe('string');
      expect(res.body.guidedAnswer.length).toBeGreaterThan(0);
    });

    it('should return 400 if userId is missing', async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/questions/${testQuestionId}/guided-answer`)
        .query({ sessionId })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/system-design/sessions/:sessionId/questions/:questionId/response', () => {
    let testQuestionId;

    beforeAll(async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/next-question`)
        .query({ userId: testUserId, journeyId });
      testQuestionId = res.body.question.id;

      // Submit answer
      await request(app)
        .post(`/api/system-design/sessions/${sessionId}/submit-answer`)
        .send({
          userId: testUserId,
          sessionId,
          questionId: testQuestionId,
          answer: 'My saved answer for testing'
        });
    });

    it('should retrieve user response', async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/questions/${testQuestionId}/response`)
        .query({ userId: testUserId })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('response');
      expect(res.body.response).toHaveProperty('user_answer');
      expect(res.body.response.user_answer).toBe('My saved answer for testing');
    });

    it('should return null for non-existent response', async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/questions/99999/response`)
        .query({ userId: testUserId })
        .expect(200);

      expect(res.body.response).toBeNull();
    });
  });

  describe('GET /api/system-design/journeys/:journeyId/progress', () => {
    it('should return journey progress', async () => {
      const res = await request(app)
        .get(`/api/system-design/journeys/${journeyId}/progress`)
        .query({ userId: testUserId })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('progress');
      expect(res.body.progress).toHaveProperty('total_questions');
      expect(res.body.progress).toHaveProperty('answered_questions');
      expect(res.body.progress).toHaveProperty('unanswered_questions');
      expect(res.body.progress).toHaveProperty('attempted_questions');
    });

    it('should show correct progress values', async () => {
      const res = await request(app)
        .get(`/api/system-design/journeys/${journeyId}/progress`)
        .query({ userId: testUserId })
        .expect(200);

      const { progress } = res.body;
      expect(progress.total_questions).toBeGreaterThan(0);
      expect(progress.answered_questions).toBeGreaterThanOrEqual(0);
      expect(progress.answered_questions).toBeLessThanOrEqual(progress.total_questions);
    });
  });

  describe('POST /api/system-design/journeys/:journeyId/reset', () => {
    it('should reset question bank', async () => {
      const res = await request(app)
        .post(`/api/system-design/journeys/${journeyId}/reset`)
        .send({ userId: testUserId })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
    });

    it('should reset answered questions to unanswered', async () => {
      // Check progress before reset
      const beforeReset = await request(app)
        .get(`/api/system-design/journeys/${journeyId}/progress`)
        .query({ userId: testUserId });

      // Reset
      await request(app)
        .post(`/api/system-design/journeys/${journeyId}/reset`)
        .send({ userId: testUserId });

      // Check progress after reset
      const afterReset = await request(app)
        .get(`/api/system-design/journeys/${journeyId}/progress`)
        .query({ userId: testUserId });

      expect(afterReset.body.progress.answered_questions).toBe(0);
      expect(afterReset.body.progress.unanswered_questions).toBe(
        afterReset.body.progress.total_questions
      );
    });
  });

  describe('POST /api/system-design/sessions/:sessionId/end', () => {
    let endSessionId;

    beforeAll(async () => {
      const res = await request(app)
        .post(`/api/system-design/journeys/${journeyId}/sessions`)
        .send({ userId: testUserId });
      endSessionId = res.body.sessionId;
    });

    it('should end a session', async () => {
      const res = await request(app)
        .post(`/api/system-design/sessions/${endSessionId}/end`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/system-design/user/:userId/journeys', () => {
    it('should return user journeys', async () => {
      const res = await request(app)
        .get(`/api/system-design/user/${testUserId}/journeys`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('journeys');
      expect(Array.isArray(res.body.journeys)).toBe(true);
      expect(res.body.journeys.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/system-design/user/:userId/sessions', () => {
    it('should return user active sessions', async () => {
      const res = await request(app)
        .get(`/api/system-design/user/${testUserId}/sessions`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('sessions');
      expect(Array.isArray(res.body.sessions)).toBe(true);
    });
  });

  describe('GET /api/system-design/sessions/:sessionId/details', () => {
    it('should return session details with progress', async () => {
      const res = await request(app)
        .get(`/api/system-design/sessions/${sessionId}/details`)
        .query({ userId: testUserId })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('session');
      expect(res.body.session).toHaveProperty('id');
      expect(res.body.session).toHaveProperty('journey_title');
      expect(res.body.session).toHaveProperty('progress');
    });
  });
});
