import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';
import db, { initializeDatabase } from './database.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken
} from './auth.js';
import journeyConfigService from './services/journeyConfigService.js';
import systemDesignRoutes from './routes/systemDesignRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDistPath));
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = join(__dirname, 'uploads');
    await mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============= AUTH ROUTES =============

app.post('/api/auth/register', (req, res) => {
  const { username, password, displayName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  // Auto-generate displayName from email if not provided
  const finalDisplayName = displayName || username.split('@')[0];

  const passwordHash = hashPassword(password);

  db.run(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
    [username, passwordHash, finalDisplayName],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'This email is already registered' });
        }
        return res.status(500).json({ error: 'Error creating account' });
      }

      const token = generateToken(this.lastID, username);
      res.json({
        token,
        user: { id: this.lastID, username, displayName: finalDisplayName }
      });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user || !comparePassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id, user.username);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name
        }
      });
    }
  );
});

// ============= JOURNAL ENTRIES ROUTES =============

app.get('/api/journal-entries', authenticateToken, (req, res) => {
  const { startDate, endDate } = req.query;

  let query = 'SELECT * FROM journal_entries WHERE user_id = ?';
  const params = [req.user.userId];

  if (startDate && endDate) {
    query += ' AND entry_date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY entry_date DESC';

  db.all(query, params, (err, entries) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching entries' });
    }
    res.json(entries);
  });
});

app.post('/api/journal-entries', authenticateToken, (req, res) => {
  const { title, content, entryDate } = req.body;

  if (!content || !entryDate) {
    return res.status(400).json({ error: 'Content and entry date required' });
  }

  db.run(
    'INSERT INTO journal_entries (user_id, title, content, entry_date) VALUES (?, ?, ?, ?)',
    [req.user.userId, title, content, entryDate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating entry' });
      }
      res.json({ id: this.lastID, title, content, entryDate });
    }
  );
});

app.put('/api/journal-entries/:id', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  const { id } = req.params;

  db.run(
    'UPDATE journal_entries SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [title, content, id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating entry' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json({ message: 'Entry updated successfully' });
    }
  );
});

app.delete('/api/journal-entries/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
    [id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting entry' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json({ message: 'Entry deleted successfully' });
    }
  );
});

// ============= MEMORIES ROUTES =============

app.get('/api/memories', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM memories ORDER BY memory_date DESC, created_at DESC',
    (err, memories) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching memories' });
      }
      res.json(memories);
    }
  );
});

app.post('/api/memories', authenticateToken, upload.single('photo'), (req, res) => {
  const { title, description, memoryDate } = req.body;
  const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    'INSERT INTO memories (user_id, title, description, photo_path, memory_date) VALUES (?, ?, ?, ?, ?)',
    [req.user.userId, title, description, photoPath, memoryDate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating memory' });
      }
      res.json({
        id: this.lastID,
        title,
        description,
        photoPath,
        memoryDate
      });
    }
  );
});

app.delete('/api/memories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM memories WHERE id = ? AND user_id = ?',
    [id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting memory' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Memory not found' });
      }
      res.json({ message: 'Memory deleted successfully' });
    }
  );
});

// ============= GRATITUDE ENTRIES ROUTES =============

app.get('/api/gratitude', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM gratitude_entries ORDER BY entry_date DESC',
    (err, entries) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching gratitude entries' });
      }
      res.json(entries);
    }
  );
});

app.post('/api/gratitude', authenticateToken, (req, res) => {
  const { content, entryDate } = req.body;

  if (!content || !entryDate) {
    return res.status(400).json({ error: 'Content and entry date required' });
  }

  db.run(
    'INSERT INTO gratitude_entries (user_id, content, entry_date) VALUES (?, ?, ?)',
    [req.user.userId, content, entryDate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating gratitude entry' });
      }
      res.json({ id: this.lastID, content, entryDate });
    }
  );
});

app.delete('/api/gratitude/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM gratitude_entries WHERE id = ? AND user_id = ?',
    [id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting gratitude entry' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json({ message: 'Entry deleted successfully' });
    }
  );
});

// ============= GOALS ROUTES =============

app.get('/api/goals', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM goals ORDER BY created_at DESC',
    (err, goals) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching goals' });
      }
      res.json(goals);
    }
  );
});

app.post('/api/goals', authenticateToken, (req, res) => {
  const { title, description, targetDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    'INSERT INTO goals (title, description, target_date, created_by) VALUES (?, ?, ?, ?)',
    [title, description, targetDate, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating goal' });
      }
      res.json({
        id: this.lastID,
        title,
        description,
        targetDate,
        status: 'active'
      });
    }
  );
});

app.put('/api/goals/:id', authenticateToken, (req, res) => {
  const { title, description, targetDate, status } = req.body;
  const { id } = req.params;

  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  db.run(
    'UPDATE goals SET title = ?, description = ?, target_date = ?, status = ?, completed_at = ? WHERE id = ?',
    [title, description, targetDate, status, completedAt, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating goal' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      res.json({ message: 'Goal updated successfully' });
    }
  );
});

app.delete('/api/goals/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM goals WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting goal' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      res.json({ message: 'Goal deleted successfully' });
    }
  );
});

// ============= QUESTION BANK ROUTES =============

// Get all categories
app.get('/api/questions/categories', authenticateToken, (req, res) => {
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

// Get all questions with their categories and details
app.get('/api/questions', authenticateToken, (req, res) => {
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

    // Get details for each question
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
app.get('/api/questions/category/:categoryId', authenticateToken, (req, res) => {
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

// Get a specific question by week number with details
app.get('/api/questions/week/:weekNumber', authenticateToken, (req, res) => {
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

    // Get question details
    db.all(
      'SELECT id, detail_text, display_order FROM question_details WHERE question_id = ? ORDER BY display_order',
      [question.id],
      (err, details) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching question details' });
        }

        res.json({
          ...question,
          details: details
        });
      }
    );
  });
});

// Get a specific question by ID with details and responses
app.get('/api/questions/:id', authenticateToken, (req, res) => {
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

    // Get question details
    db.all(
      'SELECT id, detail_text, display_order FROM question_details WHERE question_id = ? ORDER BY display_order',
      [question.id],
      (err, details) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching question details' });
        }

        // Get responses
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

            res.json({
              ...question,
              details: details,
              responses: responses
            });
          }
        );
      }
    );
  });
});

// Save or update a response to a question
app.post('/api/questions/:id/response', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { response_text } = req.body;
  const userId = req.user.userId;

  if (!response_text) {
    return res.status(400).json({ error: 'Response text is required' });
  }

  // Check if response already exists
  db.get(
    'SELECT id FROM question_responses WHERE question_id = ? AND user_id = ?',
    [id, userId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing) {
        // Update existing response
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
        // Create new response
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
app.delete('/api/questions/:questionId/response', authenticateToken, (req, res) => {
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

// Get question status for two-person workflow (who answered, discussion status)
app.get('/api/questions/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Get response count and user info
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

      // Get discussion status
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
            totalUsers: 2, // For MVP, assuming 2 users
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
app.post('/api/questions/:id/discuss', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { jointNotes, markAsDiscussed } = req.body;
  const userId = req.user.userId;

  // Check if discussion record exists
  db.get(
    'SELECT id FROM question_discussions WHERE question_id = ?',
    [id],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const discussedAt = markAsDiscussed ? new Date().toISOString() : null;

      if (existing) {
        // Update existing discussion
        db.run(
          `UPDATE question_discussions
           SET joint_notes = ?, discussed_at = ?, updated_at = CURRENT_TIMESTAMP
           WHERE question_id = ?`,
          [jointNotes || null, discussedAt, id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error updating discussion' });
            }

            // If marked as discussed, also mark the task as completed
            if (markAsDiscussed) {
              markTaskAsCompleted(id, userId);
            }

            res.json({ message: 'Discussion updated successfully' });
          }
        );
      } else {
        // Create new discussion record
        db.run(
          `INSERT INTO question_discussions (question_id, joint_notes, discussed_at)
           VALUES (?, ?, ?)`,
          [id, jointNotes || null, discussedAt],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error saving discussion' });
            }

            // If marked as discussed, also mark the task as completed
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

// Helper function to mark a question's task as completed
function markTaskAsCompleted(questionId, userId) {
  // Find the task associated with this question
  db.get(
    `SELECT jt.id as task_id, utp.id as utp_id, utp.user_journey_id
     FROM journey_tasks jt
     JOIN user_task_progress utp ON jt.id = utp.task_id
     WHERE jt.question_id = ? AND utp.user_id = ?`,
    [questionId, userId],
    (err, task) => {
      if (err) {
        console.error('Error finding task:', err);
        return;
      }

      if (!task) {
        return; // No task found for this question
      }

      // Mark task as completed
      db.run(
        'UPDATE user_task_progress SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['completed', task.utp_id],
        (err) => {
          if (!err) {
            // Update journey progress after marking task complete
            updateJourneyProgress(task.user_journey_id);
          }
        }
      );
    }
  );
}

// Get today's suggested prompt (based on current week cycling through 32 weeks)
app.get('/api/questions/today', authenticateToken, (req, res) => {
  // Calculate week of year and cycle through 1-32
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const weekOfYear = Math.ceil(dayOfYear / 7);
  const targetWeek = ((weekOfYear - 1) % 32) + 1; // Cycle through weeks 1-32

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
      // If no question for this week, return a random one
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

// ============= JOURNEY BOOK ROUTES =============

// Get all available journeys
app.get('/api/journeys', authenticateToken, (req, res) => {
  db.all(
    `SELECT j.*, COUNT(jt.id) as task_count
     FROM journeys j
     LEFT JOIN journey_tasks jt ON j.id = jt.journey_id
     WHERE j.is_active = 1
     GROUP BY j.id
     ORDER BY j.is_default DESC, j.created_at DESC`,
    (err, journeys) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching journeys' });
      }
      res.json(journeys);
    }
  );
});

// Get journey details with tasks
app.get('/api/journeys/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM journeys WHERE id = ? AND is_active = 1',
    [id],
    (err, journey) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching journey' });
      }
      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }

      // Get all tasks for this journey
      db.all(
        `SELECT jt.*, q.title as question_title, q.main_prompt
         FROM journey_tasks jt
         LEFT JOIN questions q ON jt.question_id = q.id
         WHERE jt.journey_id = ?
         ORDER BY jt.task_order`,
        [id],
        (err, tasks) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching journey tasks' });
          }
          res.json({ ...journey, tasks });
        }
      );
    }
  );
});

// Enroll in a journey
app.post('/api/journeys/:id/enroll', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const startDate = req.body.startDate || new Date().toISOString().split('T')[0];

  // Check if journey exists
  db.get(
    'SELECT * FROM journeys WHERE id = ? AND is_active = 1',
    [id],
    (err, journey) => {
      if (err || !journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }

      // Enroll user
      db.run(
        `INSERT INTO user_journeys (user_id, journey_id, start_date, status)
         VALUES (?, ?, ?, 'active')`,
        [userId, id, startDate],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Already enrolled in this journey' });
            }
            return res.status(500).json({ error: 'Error enrolling in journey' });
          }

          const userJourneyId = this.lastID;

          // Create task progress entries for all tasks
          db.all(
            'SELECT * FROM journey_tasks WHERE journey_id = ? ORDER BY task_order',
            [id],
            (err, tasks) => {
              if (err) {
                return res.status(500).json({ error: 'Error creating task progress' });
              }

              const insertPromises = tasks.map((task, index) => {
                return new Promise((resolve, reject) => {
                  // Calculate due date based on cadence
                  const start = new Date(startDate);
                  let daysToAdd = 0;

                  switch(journey.cadence) {
                    case 'daily':
                      daysToAdd = index;
                      break;
                    case 'weekly':
                      daysToAdd = index * 7;
                      break;
                    case 'biweekly':
                      daysToAdd = index * 14;
                      break;
                    case 'monthly':
                      daysToAdd = index * 30;
                      break;
                  }

                  const dueDate = new Date(start);
                  dueDate.setDate(dueDate.getDate() + daysToAdd);

                  db.run(
                    `INSERT INTO user_task_progress (user_journey_id, task_id, user_id, status, due_date)
                     VALUES (?, ?, ?, 'pending', ?)`,
                    [userJourneyId, task.id, userId, dueDate.toISOString().split('T')[0]],
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                });
              });

              Promise.all(insertPromises)
                .then(() => {
                  res.json({
                    message: 'Successfully enrolled in journey',
                    userJourneyId
                  });
                })
                .catch(() => {
                  res.status(500).json({ error: 'Error creating task progress' });
                });
            }
          );
        }
      );
    }
  );
});

// Get user's active journeys
app.get('/api/my-journeys', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT uj.*, j.title, j.description, j.cover_image_url, j.duration_weeks, j.cadence,
            COUNT(CASE WHEN utp.status = 'completed' THEN 1 END) as completed_tasks,
            COUNT(utp.id) as total_tasks
     FROM user_journeys uj
     JOIN journeys j ON uj.journey_id = j.id
     LEFT JOIN user_task_progress utp ON uj.id = utp.user_journey_id
     WHERE uj.user_id = ? AND uj.status = 'active'
     GROUP BY uj.id
     ORDER BY uj.enrolled_at DESC`,
    [userId],
    (err, journeys) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching journeys' });
      }

      // Calculate completion percentage
      const journeysWithProgress = journeys.map(j => ({
        ...j,
        completion_percentage: j.total_tasks > 0
          ? Math.round((j.completed_tasks / j.total_tasks) * 100)
          : 0
      }));

      res.json(journeysWithProgress);
    }
  );
});

// Get current tasks across all journeys
app.get('/api/tasks/current', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const today = new Date().toISOString().split('T')[0];

  db.all(
    `SELECT utp.*, jt.title, jt.description, jt.task_type, jt.page_number,
            j.title as journey_title, j.id as journey_id, uj.id as user_journey_id
     FROM user_task_progress utp
     JOIN journey_tasks jt ON utp.task_id = jt.id
     JOIN user_journeys uj ON utp.user_journey_id = uj.id
     JOIN journeys j ON uj.journey_id = j.id
     WHERE utp.user_id = ? AND utp.status IN ('pending', 'in_progress')
           AND utp.due_date <= date('now', '+7 days')
     ORDER BY utp.due_date ASC, utp.is_overdue DESC`,
    [userId],
    (err, tasks) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching current tasks' });
      }

      // Mark overdue tasks
      const tasksWithOverdue = tasks.map(task => ({
        ...task,
        is_overdue: task.due_date < today && task.status !== 'completed'
      }));

      res.json(tasksWithOverdue);
    }
  );
});

// Get tasks for a specific journey
app.get('/api/my-journeys/:journeyId/tasks', authenticateToken, (req, res) => {
  const { journeyId } = req.params;
  const userId = req.user.userId;

  db.all(
    `SELECT utp.*, jt.title, jt.description, jt.task_type, jt.page_number,
            jt.chapter_name, jt.estimated_time_minutes, jt.question_id
     FROM user_task_progress utp
     JOIN journey_tasks jt ON utp.task_id = jt.id
     JOIN user_journeys uj ON utp.user_journey_id = uj.id
     WHERE uj.journey_id = ? AND utp.user_id = ?
     ORDER BY jt.task_order`,
    [journeyId, userId],
    (err, tasks) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching journey tasks' });
      }
      res.json(tasks);
    }
  );
});

// Mark task as started
app.post('/api/tasks/:taskId/start', authenticateToken, (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.userId;

  db.run(
    `UPDATE user_task_progress
     SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
     WHERE task_id = ? AND user_id = ? AND status = 'pending'`,
    [taskId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error starting task' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found or already started' });
      }
      res.json({ message: 'Task started' });
    }
  );
});

// Mark task as completed
app.post('/api/tasks/:taskId/complete', authenticateToken, (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.userId;

  db.run(
    `UPDATE user_task_progress
     SET status = 'completed', completed_at = CURRENT_TIMESTAMP
     WHERE task_id = ? AND user_id = ?`,
    [taskId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error completing task' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Update journey progress percentage
      db.get(
        'SELECT user_journey_id FROM user_task_progress WHERE task_id = ? AND user_id = ?',
        [taskId, userId],
        (err, row) => {
          if (!err && row) {
            updateJourneyProgress(row.user_journey_id);
          }
        }
      );

      res.json({ message: 'Task completed' });
    }
  );
});

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

// ============= STORY SLOTS ROUTES (BEHAVIORAL INTERVIEW) =============

// Get story slots for a journey
app.get('/api/journeys/:journeyId/story-slots', authenticateToken, async (req, res) => {
  try {
    const { journeyId } = req.params;
    const slots = await journeyConfigService.getStorySlots(journeyId);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching story slots:', error);
    res.status(500).json({ error: 'Error fetching story slots' });
  }
});

// Get user's progress on story slots
app.get('/api/journeys/:journeyId/story-slots/progress', authenticateToken, async (req, res) => {
  try {
    const { journeyId } = req.params;
    const userId = req.user.userId;

    const stories = await journeyConfigService.getUserStories(userId, journeyId);
    const slots = await journeyConfigService.getStorySlots(journeyId);

    // Map stories to slots with progress
    const slotProgress = slots.map(slot => ({
      ...slot,
      userStory: stories.find(s => s.slot_id === slot.id) || null,
      isComplete: stories.some(s => s.slot_id === slot.id && s.is_complete)
    }));

    res.json(slotProgress);
  } catch (error) {
    console.error('Error fetching story progress:', error);
    res.status(500).json({ error: 'Error fetching story progress' });
  }
});

// ============= USER STORIES ROUTES =============

// Get user's stories for a journey
app.get('/api/journeys/:journeyId/stories', authenticateToken, async (req, res) => {
  try {
    const { journeyId } = req.params;
    const userId = req.user.userId;
    const stories = await journeyConfigService.getUserStories(userId, journeyId);
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Error fetching stories' });
  }
});

// Get specific story
app.get('/api/stories/:storyId', authenticateToken, (req, res) => {
  const { storyId } = req.params;
  const userId = req.user.userId;

  db.get(
    'SELECT * FROM user_stories WHERE id = ? AND user_id = ?',
    [storyId, userId],
    (err, story) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching story' });
      }
      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }
      res.json(story);
    }
  );
});

// Create a new user story
app.post('/api/stories', authenticateToken, (req, res) => {
  const { journeyId, slotId, storyTitle, year, stakeholders, stakes } = req.body;
  const userId = req.user.userId;

  if (!journeyId || !slotId || !storyTitle) {
    return res.status(400).json({ error: 'Journey ID, slot ID, and story title required' });
  }

  db.run(
    `INSERT INTO user_stories (
      user_id, journey_id, slot_id, story_title, year, stakeholders, stakes, framework
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SPARC')`,
    [userId, journeyId, slotId, storyTitle, year, stakeholders, stakes],
    function(err) {
      if (err) {
        console.error('Error creating story:', err);
        return res.status(500).json({ error: 'Error creating story' });
      }
      res.json({ id: this.lastID, message: 'Story created' });
    }
  );
});

// Update story SPARC section
app.put('/api/stories/:storyId/sparc/:section', authenticateToken, (req, res) => {
  const { storyId, section } = req.params;
  const { content } = req.body;
  const userId = req.user.userId;

  const validSections = ['situation', 'problem', 'actions', 'results', 'coda'];
  if (!validSections.includes(section)) {
    return res.status(400).json({ error: 'Invalid SPARC section' });
  }

  db.run(
    `UPDATE user_stories SET ${section} = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [content, storyId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating story' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Story not found' });
      }
      res.json({ message: 'Story section updated' });
    }
  );
});

// Mark story as complete
app.put('/api/stories/:storyId/complete', authenticateToken, (req, res) => {
  const { storyId } = req.params;
  const userId = req.user.userId;

  db.run(
    `UPDATE user_stories SET is_complete = 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [storyId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error completing story' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Story not found' });
      }
      res.json({ message: 'Story marked as complete' });
    }
  );
});

// ============= SIGNAL TRACKING ROUTES =============

// Tag story with signals
app.post('/api/stories/:storyId/signals', authenticateToken, (req, res) => {
  const { storyId } = req.params;
  const { signals } = req.body; // Array of {signalName, strength}
  const userId = req.user.userId;

  if (!signals || !Array.isArray(signals)) {
    return res.status(400).json({ error: 'Signals array required' });
  }

  // Verify story belongs to user
  db.get(
    'SELECT id FROM user_stories WHERE id = ? AND user_id = ?',
    [storyId, userId],
    (err, story) => {
      if (err || !story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      // Delete existing signals
      db.run(
        'DELETE FROM story_signals WHERE story_id = ?',
        [storyId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error updating signals' });
          }

          // Insert new signals
          let inserted = 0;
          if (signals.length === 0) {
            return res.json({ message: 'Signals cleared' });
          }

          signals.forEach(signal => {
            db.run(
              'INSERT INTO story_signals (story_id, signal_name, strength) VALUES (?, ?, ?)',
              [storyId, signal.signalName, signal.strength || 1],
              (err) => {
                inserted++;
                if (inserted === signals.length) {
                  res.json({ message: `${signals.length} signals tagged` });
                }
              }
            );
          });
        }
      );
    }
  );
});

// Get signal coverage for journey
app.get('/api/journeys/:journeyId/signal-coverage', authenticateToken, async (req, res) => {
  try {
    const { journeyId } = req.params;
    const userId = req.user.userId;
    const coverage = await journeyConfigService.getSignalCoverage(userId, journeyId);

    // Get all possible signals
    const signals = await journeyConfigService.loadSignals();
    const signalList = signals.signals.map(s => s.id);

    // Create coverage map
    const coverageMap = {};
    signalList.forEach(signal => {
      const found = coverage.find(c => c.signal_name === signal);
      coverageMap[signal] = {
        count: found ? found.count : 0,
        strength: found ? found.avg_strength : 0,
        covered: found ? true : false
      };
    });

    res.json(coverageMap);
  } catch (error) {
    console.error('Error fetching signal coverage:', error);
    res.status(500).json({ error: 'Error fetching signal coverage' });
  }
});

// Get SPARC micro-prompts
app.get('/api/sparc-prompts/:section', authenticateToken, async (req, res) => {
  try {
    const { section } = req.params;
    const prompts = await journeyConfigService.getMicroPrompts(section);
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Error fetching prompts' });
  }
});

// ============= SYSTEM DESIGN PRACTICE ROUTES =============

app.use('/api/system-design', systemDesignRoutes);

// ============= HEALTH CHECK =============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Level Up Journal API is running' });
});

// Serve frontend for all non-API routes (SPA fallback) in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

// Export app for testing
export default app;

// Initialize database and start server (only when run directly, not during testing)
const isRunDirectly = import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));
if (isRunDirectly) {
  console.log('Starting server initialization...');
  initializeDatabase()
    .then(() => {
      console.log('Database initialized, starting server...');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}
