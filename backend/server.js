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

  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const passwordHash = hashPassword(password);

  db.run(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
    [username, passwordHash, displayName],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Error creating user' });
      }

      const token = generateToken(this.lastID, username);
      res.json({
        token,
        user: { id: this.lastID, username, displayName }
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

// ============= HEALTH CHECK =============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Relationship Journal API is running' });
});

// Serve frontend for all non-API routes (SPA fallback) in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
