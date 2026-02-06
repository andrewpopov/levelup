import express from 'express';
import SystemDesignService from '../services/SystemDesignService.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// All system design routes require authentication
router.use(authenticateToken);

/**
 * POST /api/system-design/journeys
 * Create a new flashcard journey for system design practice
 */
router.post('/journeys', async (req, res) => {
  try {
    const journeyId = await SystemDesignService.createFlashcardJourney(req.user.userId);
    res.json({ success: true, journeyId });
  } catch (err) {
    console.error('Error creating flashcard journey:', err);
    res.status(500).json({ error: 'Failed to create flashcard journey' });
  }
});

/**
 * POST /api/system-design/journeys/:journeyId/sessions
 * Start a new flashcard session
 */
router.post('/journeys/:journeyId/sessions', async (req, res) => {
  try {
    const { journeyId } = req.params;
    const sessionId = await SystemDesignService.startFlashcardSession(req.user.userId, journeyId);
    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('Error starting flashcard session:', err);
    res.status(500).json({ error: 'Failed to start flashcard session' });
  }
});

/**
 * GET /api/system-design/sessions/:sessionId/next-question
 * Get the next unanswered question from the question bank
 */
router.get('/sessions/:sessionId/next-question', async (req, res) => {
  try {
    const { journeyId } = req.query;
    const { sessionId } = req.params;

    if (!journeyId || !sessionId) {
      return res.status(400).json({ error: 'journeyId and sessionId are required' });
    }

    const question = await SystemDesignService.getNextQuestion(req.user.userId, journeyId);
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
      }
    });
  } catch (err) {
    console.error('Error getting next question:', err);
    res.status(500).json({ error: 'Failed to get next question' });
  }
});

/**
 * POST /api/system-design/sessions/:sessionId/submit-answer
 * Submit the user's answer to a question
 */
router.post('/sessions/:sessionId/submit-answer', async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const { sessionId } = req.params;

    if (!sessionId || !questionId || !answer) {
      return res.status(400).json({ error: 'sessionId, questionId, and answer are required' });
    }

    const responseId = await SystemDesignService.submitAnswer(req.user.userId, sessionId, questionId, answer);
    res.json({ success: true, responseId });
  } catch (err) {
    console.error('Error submitting answer:', err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

/**
 * GET /api/system-design/sessions/:sessionId/questions/:questionId/guided-answer
 * Get the guided answer for a question (reveal after user answered)
 */
router.get('/sessions/:sessionId/questions/:questionId/guided-answer', async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const guidedAnswer = await SystemDesignService.getGuidedAnswer(req.user.userId, sessionId, questionId);
    res.json({ success: true, guidedAnswer });
  } catch (err) {
    console.error('Error getting guided answer:', err);
    res.status(500).json({ error: 'Failed to get guided answer' });
  }
});

/**
 * GET /api/system-design/sessions/:sessionId/questions/:questionId/response
 * Get the user's response for a question (to show saved answer)
 */
router.get('/sessions/:sessionId/questions/:questionId/response', async (req, res) => {
  try {
    const { sessionId, questionId } = req.params;
    const response = await SystemDesignService.getUserResponse(req.user.userId, sessionId, questionId);
    res.json({ success: true, response: response || null });
  } catch (err) {
    console.error('Error getting user response:', err);
    res.status(500).json({ error: 'Failed to get user response' });
  }
});

/**
 * GET /api/system-design/journeys/:journeyId/progress
 * Get progress for a journey (answered vs total questions)
 */
router.get('/journeys/:journeyId/progress', async (req, res) => {
  try {
    const { journeyId } = req.params;
    const progress = await SystemDesignService.getSessionProgress(req.user.userId, journeyId);
    res.json({ success: true, progress });
  } catch (err) {
    console.error('Error getting progress:', err);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * POST /api/system-design/journeys/:journeyId/reset
 * Reset question bank (mark all as unanswered)
 */
router.post('/journeys/:journeyId/reset', async (req, res) => {
  try {
    const { journeyId } = req.params;
    await SystemDesignService.resetQuestionBankState(req.user.userId, journeyId);
    res.json({ success: true, message: 'Question bank reset' });
  } catch (err) {
    console.error('Error resetting question bank:', err);
    res.status(500).json({ error: 'Failed to reset question bank' });
  }
});

/**
 * POST /api/system-design/sessions/:sessionId/end
 * End a flashcard session
 */
router.post('/sessions/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await SystemDesignService.endSession(sessionId);
    res.json({ success: true, message: 'Session ended' });
  } catch (err) {
    console.error('Error ending session:', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

/**
 * GET /api/system-design/journeys
 * Get all flashcard journeys for the authenticated user
 */
router.get('/journeys', async (req, res) => {
  try {
    const journeys = await SystemDesignService.getUserFlashcardJourneys(req.user.userId);
    res.json({ success: true, journeys });
  } catch (err) {
    console.error('Error getting user journeys:', err);
    res.status(500).json({ error: 'Failed to get user journeys' });
  }
});

/**
 * GET /api/system-design/sessions
 * Get all active sessions for the authenticated user
 */
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await SystemDesignService.getUserActiveSessions(req.user.userId);
    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Error getting user sessions:', err);
    res.status(500).json({ error: 'Failed to get user sessions' });
  }
});

/**
 * GET /api/system-design/sessions/:sessionId/details
 * Get detailed info about a session
 */
router.get('/sessions/:sessionId/details', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await SystemDesignService.getSessionDetails(req.user.userId, sessionId);
    res.json({ success: true, session });
  } catch (err) {
    console.error('Error getting session details:', err);
    res.status(500).json({ error: 'Failed to get session details' });
  }
});

export default router;
