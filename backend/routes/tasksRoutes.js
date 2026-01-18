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

// Get current tasks across all journeys
router.get('/current', authenticateToken, (req, res) => {
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

      const tasksWithOverdue = tasks.map(task => ({
        ...task,
        is_overdue: task.due_date < today && task.status !== 'completed'
      }));

      res.json(tasksWithOverdue);
    }
  );
});

// Mark task as started
router.post('/:taskId/start', authenticateToken, (req, res) => {
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
router.post('/:taskId/complete', authenticateToken, (req, res) => {
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

export default router;
