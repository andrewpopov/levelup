import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Get all gratitude entries
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM gratitude_entries WHERE user_id = ? ORDER BY entry_date DESC',
    [req.user.userId],
    (err, entries) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching gratitude entries' });
      }
      res.json(entries);
    }
  );
});

// Create gratitude entry
router.post('/', authenticateToken, (req, res) => {
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

// Delete gratitude entry
router.delete('/:id', authenticateToken, (req, res) => {
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

export default router;
