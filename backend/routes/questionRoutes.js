import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Helper function to update journey progress
function updateJourneyProgress(userJourneyId) {
  db.all(
    `SELECT COUNT(*) as total,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
     FROM user_task_progress
     WHERE user_journey_id = ?`,
    [userJourneyId],
    (err, result) => {
      if (!err && result && result[0]) {
        const percentage = (result[0].completed / result[0].total) * 100;
        db.run(
          'UPDATE user_journeys SET completion_percentage = ? WHERE id = ?',
          [percentage, userJourneyId]
        );
      }
    }
  );
}

// Helper function to mark a question's task as completed
function markTaskAsCompleted(questionId, userId) {
  db.get(
    `SELECT jt.id as task_id, utp.id as utp_id, utp.user_journey_id
     FROM journey_tasks jt
     JOIN user_task_progress utp ON jt.id = utp.task_id
     WHERE jt.question_id = ? AND utp.user_id = ?`,
    [questionId, userId],
    (err, task) => {
      if (err || !task) return;

      db.run(
        'UPDATE user_task_progress SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', task.utp_id],
        (err) => {
          if (!err) {
            updateJourneyProgress(task.user_journey_id);
          }
        }
      );
    }
  );
}

// Get all categories
router.get('/categories', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM question_categories ORDER BY display_order',
    (err, categories) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching categories' });
      }
      res.json(categories);
    }
  );
});

// Get today's suggested prompt
router.get('/today', authenticateToken, (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const weekOfYear = Math.ceil(dayOfYear / 7);
  const targetWeek = ((weekOfYear - 1) % 32) + 1;

  const query = `
    SELECT
      q.id, q.week_number, q.title, q.main_prompt,
      c.id as category_id, c.name as category_name
    FROM questions q
    JOIN question_categories c ON q.category_id = c.id
    WHERE q.week_number = ?
    LIMIT 1
  `;

  db.get(query, [targetWeek], (err, question) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching today\'s prompt' });
    }
    if (!question) {
      db.get(
        `SELECT
          q.id, q.week_number, q.title, q.main_prompt,
          c.id as category_id, c.name as category_name
        FROM questions q
        JOIN question_categories c ON q.category_id = c.id
        ORDER BY RANDOM()
        LIMIT 1`,
        (err, randomQuestion) => {
          if (err || !randomQuestion) {
            return res.status(500).json({ error: 'Error fetching prompt' });
          }
          res.json(randomQuestion);
        }
      );
    } else {
      res.json(question);
    }
  });
});

// Get all questions with their categories and details
router.get('/', authenticateToken, (req, res) => {
  const query = `
    SELECT
      q.id, q.week_number, q.title, q.main_prompt, q.created_at,
      c.id as category_id, c.name as category_name, c.description as category_description
    FROM questions q
    JOIN question_categories c ON q.category_id = c.id
    ORDER BY q.week_number
  `;

  db.all(query, (err, questions) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching questions' });
    }

    const questionsWithDetails = [];
    let processed = 0;

    if (questions.length === 0) {
      return res.json([]);
    }

    questions.forEach((question) => {
      db.all(
        'SELECT id, detail_text, display_order FROM question_details WHERE question_id = ? ORDER BY display_order',
        [question.id],
        (err, details) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching question details' });
          }

          questionsWithDetails.push({
            ...question,
            details: details
          });

          processed++;
          if (processed === questions.length) {
            res.json(questionsWithDetails);
          }
        }
      );
    });
  });
});

// Get questions by category
router.get('/category/:categoryId', authenticateToken, (req, res) => {
  const { categoryId } = req.params;

  const query = `
    SELECT
      q.id, q.week_number, q.title, q.main_prompt, q.created_at,
      c.id as category_id, c.name as category_name
    FROM questions q
    JOIN question_categories c ON q.category_id = c.id
    WHERE c.id = ?
    ORDER BY q.week_number
  `;

  db.all(query, [categoryId], (err, questions) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching questions' });
    }
    res.json(questions);
  });
});

// Get a specific question by week number
router.get('/week/:weekNumber', authenticateToken, (req, res) => {
  const { weekNumber } = req.params;

  const query = `
    SELECT
      q.id, q.week_number, q.title, q.main_prompt, q.created_at,
      c.id as category_id, c.name as category_name, c.description as category_description
    FROM questions q
    JOIN question_categories c ON q.category_id = c.id
    WHERE q.week_number = ?
  `;

  db.get(query, [weekNumber], (err, question) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching question' });
    }
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    db.all(
      'SELECT id, detail_text, display_order FROM question_details WHERE question_id = ? ORDER BY display_order',
      [question.id],
      (err, details) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching question details' });
        }
        res.json({ ...question, details: details });
      }
    );
  });
});

// Get a specific question by ID with details and responses
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT
      q.id, q.week_number, q.title, q.main_prompt, q.created_at,
      c.id as category_id, c.name as category_name, c.description as category_description
    FROM questions q
    JOIN question_categories c ON q.category_id = c.id
    WHERE q.id = ?
  `;

  db.get(query, [id], (err, question) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching question' });
    }
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    db.all(
      'SELECT id, detail_text, display_order FROM question_details WHERE question_id = ? ORDER BY display_order',
      [question.id],
      (err, details) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching question details' });
        }

        db.all(
          `SELECT qr.id, qr.response_text, qr.created_at, qr.updated_at,
                  u.id as user_id, u.username, u.display_name
           FROM question_responses qr
           JOIN users u ON qr.user_id = u.id
           WHERE qr.question_id = ?`,
          [question.id],
          (err, responses) => {
            if (err) {
              return res.status(500).json({ error: 'Error fetching responses' });
            }
            res.json({ ...question, details: details, responses: responses });
          }
        );
      }
    );
  });
});

// Save or update a response to a question
router.post('/:id/response', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { response_text } = req.body;
  const userId = req.user.userId;

  if (!response_text) {
    return res.status(400).json({ error: 'Response text is required' });
  }

  db.get(
    'SELECT id FROM question_responses WHERE question_id = ? AND user_id = ?',
    [id, userId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing) {
        db.run(
          'UPDATE question_responses SET response_text = ?, updated_at = CURRENT_TIMESTAMP WHERE question_id = ? AND user_id = ?',
          [response_text, id, userId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error updating response' });
            }
            res.json({ id: existing.id, message: 'Response updated successfully' });
          }
        );
      } else {
        db.run(
          'INSERT INTO question_responses (question_id, user_id, response_text) VALUES (?, ?, ?)',
          [id, userId, response_text],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error creating response' });
            }
            res.json({ id: this.lastID, message: 'Response saved successfully' });
          }
        );
      }
    }
  );
});

// Delete a response
router.delete('/:questionId/response', authenticateToken, (req, res) => {
  const { questionId } = req.params;
  const userId = req.user.userId;

  db.run(
    'DELETE FROM question_responses WHERE question_id = ? AND user_id = ?',
    [questionId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting response' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Response not found' });
      }
      res.json({ message: 'Response deleted successfully' });
    }
  );
});

// Get question status for two-person workflow
router.get('/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.all(
    `SELECT qr.user_id, u.display_name, qr.updated_at
     FROM question_responses qr
     JOIN users u ON qr.user_id = u.id
     WHERE qr.question_id = ?`,
    [id],
    (err, responses) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching question status' });
      }

      db.get(
        'SELECT * FROM question_discussions WHERE question_id = ?',
        [id],
        (err, discussion) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching discussion status' });
          }

          const answeredCount = responses.length;
          const partnerResponse = responses.find(r => r.user_id !== req.user.userId);
          const userResponse = responses.find(r => r.user_id === req.user.userId);

          res.json({
            answeredCount,
            totalUsers: 2,
            userAnswered: !!userResponse,
            partnerAnswered: !!partnerResponse,
            partnerName: partnerResponse?.display_name,
            bothAnswered: answeredCount === 2,
            isDiscussed: !!discussion?.discussed_at,
            discussedAt: discussion?.discussed_at,
            jointNotes: discussion?.joint_notes
          });
        }
      );
    }
  );
});

// Mark question as discussed and save joint notes
router.post('/:id/discuss', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { jointNotes, markAsDiscussed } = req.body;
  const userId = req.user.userId;

  db.get(
    'SELECT id FROM question_discussions WHERE question_id = ?',
    [id],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const discussedAt = markAsDiscussed ? new Date().toISOString() : null;

      if (existing) {
        db.run(
          `UPDATE question_discussions
           SET joint_notes = ?, discussed_at = ?, updated_at = CURRENT_TIMESTAMP
           WHERE question_id = ?`,
          [jointNotes || null, discussedAt, id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error updating discussion' });
            }
            if (markAsDiscussed) {
              markTaskAsCompleted(id, userId);
            }
            res.json({ message: 'Discussion updated successfully' });
          }
        );
      } else {
        db.run(
          `INSERT INTO question_discussions (question_id, joint_notes, discussed_at)
           VALUES (?, ?, ?)`,
          [id, jointNotes || null, discussedAt],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error saving discussion' });
            }
            if (markAsDiscussed) {
              markTaskAsCompleted(id, userId);
            }
            res.json({ id: this.lastID, message: 'Discussion saved successfully' });
          }
        );
      }
    }
  );
});

export default router;
