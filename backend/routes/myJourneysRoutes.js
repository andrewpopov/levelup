import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Get user's active journeys
router.get('/', authenticateToken, (req, res) => {
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

// Get tasks for a specific journey
router.get('/:journeyId/tasks', authenticateToken, (req, res) => {
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

export default router;
