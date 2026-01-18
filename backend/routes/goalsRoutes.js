import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Get all goals
router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM goals WHERE created_by = ? ORDER BY created_at DESC',
    [req.user.userId],
    (err, goals) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching goals' });
      }
      res.json(goals);
    }
  );
});

// Create goal
router.post('/', authenticateToken, (req, res) => {
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

// Update goal
router.put('/:id', authenticateToken, (req, res) => {
  const { title, description, targetDate, status } = req.body;
  const { id } = req.params;

  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  db.run(
    'UPDATE goals SET title = ?, description = ?, target_date = ?, status = ?, completed_at = ? WHERE id = ? AND created_by = ?',
    [title, description, targetDate, status, completedAt, id, req.user.userId],
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

// Delete goal
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM goals WHERE id = ? AND created_by = ?',
    [id, req.user.userId],
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

export default router;
