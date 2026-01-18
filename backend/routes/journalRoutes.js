import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Get all journal entries
router.get('/', authenticateToken, (req, res) => {
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

// Create journal entry
router.post('/', authenticateToken, (req, res) => {
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

// Update journal entry
router.put('/:id', authenticateToken, (req, res) => {
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

// Delete journal entry
router.delete('/:id', authenticateToken, (req, res) => {
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

export default router;
