import db from '../database.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

class SystemDesignService {
  /**
   * Load system design questions from JSON template
   */
  async loadSystemDesignQuestions() {
    return new Promise((resolve, reject) => {
      const templatePath = join(__dirname, '../journeys/templates/system-design-questions.json');
      try {
        const content = readFileSync(templatePath, 'utf-8');
        const data = JSON.parse(content);
        resolve(data.questions);
      } catch (err) {
        reject(new Error(`Failed to load system design questions: ${err.message}`));
      }
    });
  }

  /**
   * Seed system design questions into the database
   */
  async seedSystemDesignQuestions() {
    return new Promise(async (resolve, reject) => {
      try {
        const questions = await this.loadSystemDesignQuestions();

        db.serialize(() => {
          db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              reject(err);
              return;
            }

            let inserted = 0;

            questions.forEach((question, index) => {
              db.run(
                `INSERT OR REPLACE INTO system_design_questions
                 (question_key, title, prompt, guided_answer, category, difficulty)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  question.question_key,
                  question.title,
                  question.prompt,
                  question.guided_answer,
                  question.category,
                  question.difficulty
                ],
                (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  inserted++;

                  if (inserted === questions.length) {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        reject(err);
                      } else {
                        console.log(`Seeded ${inserted} system design questions`);
                        resolve(inserted);
                      }
                    });
                  }
                }
              );
            });
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Create a flashcard journey for system design practice
   */
  async createFlashcardJourney(userId, title = 'System Design Practice', description = null) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO flashcard_journeys (title, description, question_category, created_by)
         VALUES (?, ?, ?, ?)`,
        [title, description || 'Endless system design practice with guided answers', 'system-design', userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Start a new flashcard session for a user
   */
  async startFlashcardSession(userId, flashcardJourneyId) {
    return new Promise((resolve, reject) => {
      const self = this;
      db.run(
        `INSERT INTO user_flashcard_sessions (user_id, flashcard_journey_id, status)
         VALUES (?, ?, 'active')`,
        [userId, flashcardJourneyId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            const sessionId = this.lastID;

            // Initialize question bank state for this user/journey
            self.initializeQuestionBankState(userId, flashcardJourneyId)
              .then(() => resolve(sessionId))
              .catch(reject);
          }
        }
      );
    });
  }

  /**
   * Initialize the question bank state (mark all questions as unanswered)
   */
  async initializeQuestionBankState(userId, flashcardJourneyId) {
    return new Promise((resolve, reject) => {
      // Get all system design questions
      db.all(
        `SELECT id FROM system_design_questions WHERE category = 'system-design'`,
        (err, questions) => {
          if (err) {
            reject(err);
            return;
          }

          if (questions.length === 0) {
            resolve();
            return;
          }

          db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              reject(err);
              return;
            }

            let inserted = 0;

            questions.forEach((q) => {
              db.run(
                `INSERT OR IGNORE INTO system_design_question_bank_state
                 (user_id, flashcard_journey_id, question_id, is_answered)
                 VALUES (?, ?, ?, 0)`,
                [userId, flashcardJourneyId, q.id],
                (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  inserted++;

                  if (inserted === questions.length) {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve();
                      }
                    });
                  }
                }
              );
            });
          });
        }
      );
    });
  }

  /**
   * Get next unanswered question for endless journey
   * Prioritizes unseen questions, randomizes from remaining
   */
  async getNextQuestion(userId, flashcardJourneyId) {
    return new Promise((resolve, reject) => {
      const self = this;
      // Get all unanswered questions, prefer unseen ones
      db.get(
        `SELECT q.id, q.title, q.prompt, q.category, q.difficulty
         FROM system_design_questions q
         WHERE NOT EXISTS (
           SELECT 1 FROM system_design_question_bank_state s
           WHERE s.user_id = ?
           AND s.flashcard_journey_id = ?
           AND s.question_id = q.id
           AND s.is_answered = 1
         )
         AND q.category = 'system-design'
         ORDER BY RANDOM()
         LIMIT 1`,
        [userId, flashcardJourneyId],
        (err, question) => {
          if (err) {
            reject(err);
          } else if (!question) {
            // All questions answered, reset and start over
            self.resetQuestionBankState(userId, flashcardJourneyId)
              .then(() => self.getNextQuestion(userId, flashcardJourneyId))
              .then(resolve)
              .catch(reject);
          } else {
            resolve(question);
          }
        }
      );
    });
  }

  /**
   * Submit an answer to a system design question
   */
  async submitAnswer(userId, sessionId, questionId, userAnswer) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO user_system_design_responses
         (user_id, question_id, session_id, user_answer, is_answered)
         VALUES (?, ?, ?, ?, 1)
         ON CONFLICT(session_id, question_id, user_id)
         DO UPDATE SET user_answer = ?, answered_at = CURRENT_TIMESTAMP`,
        [userId, questionId, sessionId, userAnswer, userAnswer],
        function(err) {
          if (err) {
            reject(err);
          } else {
            const responseId = this.lastID;
            // Update question bank state to marked as answered
            db.get(
              `SELECT flashcard_journey_id FROM user_flashcard_sessions WHERE id = ?`,
              [sessionId],
              (err, session) => {
                if (err) {
                  reject(err);
                  return;
                }

                db.run(
                  `UPDATE system_design_question_bank_state
                   SET is_answered = 1, answer_count = answer_count + 1, last_answered_at = CURRENT_TIMESTAMP
                   WHERE user_id = ? AND flashcard_journey_id = ? AND question_id = ?`,
                  [userId, session.flashcard_journey_id, questionId],
                  (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(responseId);
                    }
                  }
                );
              }
            );
          }
        }
      );
    });
  }

  /**
   * Get the guided answer for a question
   * Marks it as viewed in the response
   */
  async getGuidedAnswer(userId, sessionId, questionId) {
    return new Promise((resolve, reject) => {
      // Get the answer
      db.get(
        `SELECT id, guided_answer FROM system_design_questions WHERE id = ?`,
        [questionId],
        (err, question) => {
          if (err) {
            reject(err);
          } else if (!question) {
            reject(new Error('Question not found'));
          } else {
            // Mark as viewed
            db.run(
              `UPDATE user_system_design_responses
               SET viewed_guided_answer = 1, viewed_at = CURRENT_TIMESTAMP
               WHERE user_id = ? AND session_id = ? AND question_id = ?`,
              [userId, sessionId, questionId],
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(question.guided_answer);
                }
              }
            );
          }
        }
      );
    });
  }

  /**
   * Get user's response for a question
   */
  async getUserResponse(userId, sessionId, questionId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM user_system_design_responses
         WHERE user_id = ? AND session_id = ? AND question_id = ?`,
        [userId, sessionId, questionId],
        (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Get session progress (answered vs total questions)
   */
  async getSessionProgress(userId, flashcardJourneyId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT
          COUNT(*) as total_questions,
          SUM(CASE WHEN is_answered = 1 THEN 1 ELSE 0 END) as answered_questions,
          SUM(CASE WHEN answer_count > 0 THEN 1 ELSE 0 END) as attempted_questions
         FROM system_design_question_bank_state
         WHERE user_id = ? AND flashcard_journey_id = ?`,
        [userId, flashcardJourneyId],
        (err, progress) => {
          if (err) {
            reject(err);
          } else {
            const unanswered = (progress.total_questions || 0) - (progress.answered_questions || 0);
            resolve({
              total_questions: progress.total_questions || 0,
              answered_questions: progress.answered_questions || 0,
              unanswered_questions: unanswered,
              attempted_questions: progress.attempted_questions || 0
            });
          }
        }
      );
    });
  }

  /**
   * Reset question bank state (mark all as unanswered)
   */
  async resetQuestionBankState(userId, flashcardJourneyId) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE system_design_question_bank_state
         SET is_answered = 0, answer_count = 0
         WHERE user_id = ? AND flashcard_journey_id = ?`,
        [userId, flashcardJourneyId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * End a flashcard session
   */
  async endSession(sessionId) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE user_flashcard_sessions
         SET session_end = CURRENT_TIMESTAMP, status = 'completed'
         WHERE id = ?`,
        [sessionId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Get all flashcard journeys for a user
   */
  async getUserFlashcardJourneys(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM flashcard_journeys WHERE created_by = ?`,
        [userId],
        (err, journeys) => {
          if (err) {
            reject(err);
          } else {
            resolve(journeys || []);
          }
        }
      );
    });
  }

  /**
   * Get all active sessions for a user
   */
  async getUserActiveSessions(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.*, j.title as journey_title
         FROM user_flashcard_sessions s
         JOIN flashcard_journeys j ON s.flashcard_journey_id = j.id
         WHERE s.user_id = ? AND s.status = 'active'
         ORDER BY s.session_start DESC`,
        [userId],
        (err, sessions) => {
          if (err) {
            reject(err);
          } else {
            resolve(sessions || []);
          }
        }
      );
    });
  }

  /**
   * Get session details with progress
   */
  async getSessionDetails(userId, sessionId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT s.*, j.title as journey_title, j.description, j.question_category
         FROM user_flashcard_sessions s
         JOIN flashcard_journeys j ON s.flashcard_journey_id = j.id
         WHERE s.id = ? AND s.user_id = ?`,
        [sessionId, userId],
        async (err, session) => {
          if (err) {
            reject(err);
          } else if (!session) {
            reject(new Error('Session not found'));
          } else {
            try {
              const progress = await this.getSessionProgress(userId, session.flashcard_journey_id);
              resolve({
                ...session,
                progress
              });
            } catch (e) {
              reject(e);
            }
          }
        }
      );
    });
  }
}

export default new SystemDesignService();
