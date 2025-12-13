import express from 'express';
import SystemDesignService from '../services/SystemDesignService.js';

const router = express.Router();

/**
 * POST /api/system-design/journeys
 * Create a new flashcard journey for system design practice
 */
router.post('/journeys', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const journeyId = await SystemDesignService.createFlashcardJourney(userId);
    res.json({ success: true, journeyId });
  } catch (err) {
    console.error('Error creating flashcard journey:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/system-design/journeys/:journeyId/sessions
 * Start a new flashcard session
 */
router.post('/journeys/:journeyId/sessions', async (req, res) => {
  try {
    const { userId } = req.body;
    const { journeyId } = req.params;

    if (!userId || !journeyId) {
      return res.status(400).json({ error: 'userId and journeyId are required' });
    }

    const sessionId = await SystemDesignService.startFlashcardSession(userId, journeyId);
    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('Error starting flashcard session:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/system-design/sessions/:sessionId/next-question
 * Get the next unanswered question from the question bank
 */
router.get('/sessions/:sessionId/next-question', async (req, res) => {
  try {
    const { userId, journeyId } = req.query;
    const { sessionId } = req.params;

    if (!userId || !journeyId || !sessionId) {
      return res.status(400).json({ error: 'userId, journeyId, and sessionId are required' });
    }

    const question = await SystemDesignService.getNextQuestion(userId, journeyId);
    if (!question) {
      return res.status(404).json({ error: 'No more questions available' });
    }

    res.json({
      success: true,
      question: {
        id: question.id,
        title: question.title,
        prompt: question.prompt,
        difficulty: question.difficulty
        // Do NOT send guided_answer yet
      }
    });
  } catch (err) {
    console.error('Error getting next question:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/system-design/sessions/:sessionId/submit-answer
 * Submit the user's answer to a question
 */
router.post('/sessions/:sessionId/submit-answer', async (req, res) => {
  try {
    const { userId, questionId, answer } = req.body;
    const { sessionId } = req.params;

    if (!userId || !sessionId || !questionId || !answer) {
      return res.status(400).json({ error: 'userId, sessionId, questionId, and answer are required' });
    }

    const responseId = await SystemDesignService.submitAnswer(userId, sessionId, questionId, answer);
    res.json({ success: true, responseId });
  } catch (err) {
    console.error('Error submitting answer:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/system-design/sessions/:sessionId/questions/:questionId/guided-answer
 * Get the guided answer for a question (reveal after user answered)
 */
router.get('/sessions/:sessionId/questions/:questionId/guided-answer', async (req, res) => {
  try {
    const { userId } = req.query;
    const { sessionId, questionId } = req.params;

    if (!userId || !sessionId || !questionId) {
      return res.status(400).json({ error: 'userId, sessionId, and questionId are required' });
    }

    const guidedAnswer = await SystemDesignService.getGuidedAnswer(userId, sessionId, questionId);
    res.json({
      success: true,
      guidedAnswer
    });
  } catch (err) {
    console.error('Error getting guided answer:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/system-design/sessions/:sessionId/questions/:questionId/response
 * Get the user's response for a question (to show saved answer)
 */
router.get('/sessions/:sessionId/questions/:questionId/response', async (req, res) => {
  try {
    const { userId } = req.query;
    const { sessionId, questionId } = req.params;

    if (!userId || !sessionId || !questionId) {
      return res.status(400).json({ error: 'userId, sessionId, and questionId are required' });
    }

    const response = await SystemDesignService.getUserResponse(userId, sessionId, questionId);
    res.json({
      success: true,
      response: response || null
    });
  } catch (err) {
    console.error('Error getting user response:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/system-design/journeys/:journeyId/progress
 * Get progress for a journey (answered vs total questions)
 */
router.get('/journeys/:journeyId/progress', async (req, res) => {
  try {
    const { userId } = req.query;
    const { journeyId } = req.params;

    if (!userId || !journeyId) {
      return res.status(400).json({ error: 'userId and journeyId are required' });
    }

    const progress = await SystemDesignService.getSessionProgress(userId, journeyId);
    res.json({ success: true, progress });
  } catch (err) {
    console.error('Error getting progress:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/system-design/journeys/:journeyId/reset
 * Reset question bank (mark all as unanswered)
 */
router.post('/journeys/:journeyId/reset', async (req, res) => {
  try {
    const { userId } = req.body;
    const { journeyId } = req.params;

    if (!userId || !journeyId) {
      return res.status(400).json({ error: 'userId and journeyId are required' });
    }

    await SystemDesignService.resetQuestionBankState(userId, journeyId);
    res.json({ success: true, message: 'Question bank reset' });
  } catch (err) {
    console.error('Error resetting question bank:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/system-design/sessions/:sessionId/end
 * End a flashcard session
 */
router.post('/sessions/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    await SystemDesignService.endSession(sessionId);
    res.json({ success: true, message: 'Session ended' });
  } catch (err) {
    console.error('Error ending session:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/system-design/user/:userId/journeys
 * Get all flashcard journeys for a user
 */
router.get('/user/:userId/journeys', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const journeys = await SystemDesignService.getUserFlashcardJourneys(userId);
    res.json({ success: true, journeys });
  } catch (err) {
    console.error('Error getting user journeys:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/system-design/user/:userId/sessions
 * Get all active sessions for a user
 */
router.get('/user/:userId/sessions', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const sessions = await SystemDesignService.getUserActiveSessions(userId);
    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Error getting user sessions:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/system-design/sessions/:sessionId/details
 * Get detailed info about a session
 */
router.get('/sessions/:sessionId/details', async (req, res) => {
  try {
    const { userId } = req.query;
    const { sessionId } = req.params;

    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }

    const session = await SystemDesignService.getSessionDetails(userId, sessionId);
    res.json({ success: true, session });
  } catch (err) {
    console.error('Error getting session details:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
