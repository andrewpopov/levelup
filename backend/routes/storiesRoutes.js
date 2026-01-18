import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../auth.js';
import journeyConfigService from '../services/journeyConfigService.js';

const router = express.Router();

// Get specific story
router.get('/:storyId', authenticateToken, (req, res) => {
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
router.post('/', authenticateToken, (req, res) => {
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
router.put('/:storyId/sparc/:section', authenticateToken, (req, res) => {
  const { storyId, section } = req.params;
  const { content } = req.body;
  const userId = req.user.userId;

  // Whitelist map for valid column names - prevents SQL injection
  const sectionColumns = {
    situation: 'situation',
    problem: 'problem',
    actions: 'actions',
    results: 'results',
    coda: 'coda'
  };

  const columnName = sectionColumns[section];
  if (!columnName) {
    return res.status(400).json({ error: 'Invalid SPARC section' });
  }

  db.run(
    `UPDATE user_stories SET ${columnName} = ?, updated_at = CURRENT_TIMESTAMP
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
router.put('/:storyId/complete', authenticateToken, (req, res) => {
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

// Tag story with signals
router.post('/:storyId/signals', authenticateToken, (req, res) => {
  const { storyId } = req.params;
  const { signals } = req.body;
  const userId = req.user.userId;

  if (!signals || !Array.isArray(signals)) {
    return res.status(400).json({ error: 'Signals array required' });
  }

  db.get(
    'SELECT id FROM user_stories WHERE id = ? AND user_id = ?',
    [storyId, userId],
    (err, story) => {
      if (err || !story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      db.run(
        'DELETE FROM story_signals WHERE story_id = ?',
        [storyId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error updating signals' });
          }

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

export default router;
