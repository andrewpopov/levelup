import express from 'express';
import { authenticateToken } from '../auth.js';
import journeyConfigService from '../services/journeyConfigService.js';

const router = express.Router();

// Get SPARC micro-prompts by section
router.get('/:section', authenticateToken, async (req, res) => {
  try {
    const { section } = req.params;
    const prompts = await journeyConfigService.getMicroPrompts(section);
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Error fetching prompts' });
  }
});

export default router;
