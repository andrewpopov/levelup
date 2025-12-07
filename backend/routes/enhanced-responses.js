/**
 * Enhanced Response Routes - Media-rich responses and follow-ups
 *
 * Requires authentication via JWT token in Authorization header
 */

import express from 'express';
import { EnhancedResponseService } from '../services/EnhancedResponseService.js';
import { authenticateToken } from '../auth.js';

export function setupEnhancedResponseRoutes(app, db) {
  const router = express.Router();
  const service = new EnhancedResponseService(db);

  // ============= MEDIA RESPONSES =============

  /**
   * POST /api/responses/:responseId/media
   * Submit a media response (voice, video, image)
   * Body: { responseType, mediaUrl, transcription? }
   */
  router.post('/:responseId/media', authenticateToken, async (req, res) => {
    try {
      const { responseId } = req.params;
      const { responseType, mediaUrl, transcription } = req.body;

      if (!responseType || !mediaUrl) {
        return res.status(400).json({ error: 'Response type and media URL are required' });
      }

      const enhanced = await service.submitMediaResponse(
        parseInt(responseId),
        responseType,
        mediaUrl,
        transcription
      );

      res.status(201).json({ enhancedResponseId: enhanced });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/responses/:responseId/media
   * Get media details for a response
   */
  router.get('/:responseId/media', authenticateToken, async (req, res) => {
    try {
      const { responseId } = req.params;
      const enhanced = await service.getMediaResponse(parseInt(responseId));

      if (!enhanced) {
        return res.status(404).json({ enhanced: null });
      }

      res.json(enhanced);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/responses/:responseId/transcription
   * Get transcription for a voice/video response
   */
  router.get('/:responseId/transcription', authenticateToken, async (req, res) => {
    try {
      const { responseId } = req.params;
      const transcription = await service.getTranscription(parseInt(responseId));

      res.json({ transcription });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= FOLLOW-UP QUESTIONS =============

  /**
   * POST /api/responses/:responseId/followups
   * Ask a follow-up question on a response
   * Body: { followupText }
   */
  router.post('/:responseId/followups', authenticateToken, async (req, res) => {
    try {
      const { responseId } = req.params;
      const { followupText } = req.body;
      const userId = req.user.id;

      if (!followupText) {
        return res.status(400).json({ error: 'Follow-up text is required' });
      }

      const followup = await service.askFollowup(
        parseInt(responseId),
        followupText,
        userId
      );

      res.status(201).json(followup);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/responses/:responseId/followups
   * Get all follow-ups for a response
   */
  router.get('/:responseId/followups', authenticateToken, async (req, res) => {
    try {
      const { responseId } = req.params;
      const followups = await service.getFollowups(parseInt(responseId));
      res.json(followups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/followups/:followupId/answer
   * Answer a follow-up question
   * Body: { followupResponse }
   */
  router.post('/:followupId/answer', authenticateToken, async (req, res) => {
    try {
      const { followupId } = req.params;
      const { followupResponse } = req.body;

      if (!followupResponse) {
        return res.status(400).json({ error: 'Response text is required' });
      }

      const result = await service.answerFollowup(
        parseInt(followupId),
        followupResponse
      );

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/followups/me/unanswered
   * Get unanswered follow-ups directed to the current user
   */
  router.get('/me/unanswered', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const followups = await service.getUnansweredFollowups(userId);
      res.json(followups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/followups/:followupId
   * Delete a follow-up (only if unanswered)
   */
  router.delete('/:followupId', authenticateToken, async (req, res) => {
    try {
      const { followupId } = req.params;
      await service.deleteFollowup(parseInt(followupId));
      res.json({ message: 'Follow-up deleted' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============= CONVERSATION ANALYSIS =============

  /**
   * GET /api/responses/:responseId/conversation
   * Get full conversation thread for a response
   */
  router.get('/:responseId/conversation', authenticateToken, async (req, res) => {
    try {
      const { responseId } = req.params;
      const thread = await service.getConversationThread(parseInt(responseId));
      res.json(thread);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/questions/:questionId/conversation-insights
   * Get conversation insights for a question
   */
  router.get('/question/:questionId/insights', authenticateToken, async (req, res) => {
    try {
      const { questionId } = req.params;
      const insights = await service.getConversationInsights(parseInt(questionId));
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
