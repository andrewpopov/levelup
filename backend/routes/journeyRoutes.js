import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../auth.js';
import journeyConfigService from '../services/journeyConfigService.js';

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

// Get all available journeys
router.get('/', authenticateToken, (req, res) => {
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
router.get('/:id', authenticateToken, (req, res) => {
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
router.post('/:id/enroll', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const startDate = req.body.startDate || new Date().toISOString().split('T')[0];

  db.get(
    'SELECT * FROM journeys WHERE id = ? AND is_active = 1',
    [id],
    (err, journey) => {
      if (err || !journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }

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

          db.all(
            'SELECT * FROM journey_tasks WHERE journey_id = ? ORDER BY task_order',
            [id],
            (err, tasks) => {
              if (err) {
                return res.status(500).json({ error: 'Error creating task progress' });
              }

              const insertPromises = tasks.map((task, index) => {
                return new Promise((resolve, reject) => {
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

// Get story slots for a journey
router.get('/:journeyId/story-slots', authenticateToken, async (req, res) => {
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
router.get('/:journeyId/story-slots/progress', authenticateToken, async (req, res) => {
  try {
    const { journeyId } = req.params;
    const userId = req.user.userId;

    const stories = await journeyConfigService.getUserStories(userId, journeyId);
    const slots = await journeyConfigService.getStorySlots(journeyId);

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

// Get user's stories for a journey
router.get('/:journeyId/stories', authenticateToken, async (req, res) => {
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

// Get signal coverage for journey
router.get('/:journeyId/signal-coverage', authenticateToken, async (req, res) => {
  try {
    const { journeyId } = req.params;
    const userId = req.user.userId;
    const coverage = await journeyConfigService.getSignalCoverage(userId, journeyId);

    const signals = await journeyConfigService.loadSignals();
    const signalList = signals.signals.map(s => s.id);

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

export default router;
