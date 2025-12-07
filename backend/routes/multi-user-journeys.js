/**
 * Multi-User Journey Routes - Team-based collaborative learning
 *
 * Requires authentication via JWT token in Authorization header
 */

import express from 'express';
import { MultiUserJourneyService } from '../services/MultiUserJourneyService.js';
import { authenticateToken } from '../auth.js';

export function setupMultiUserJourneyRoutes(app, db) {
  const router = express.Router();
  const service = new MultiUserJourneyService(db);

  // ============= TEAM JOURNEY ROUTES =============

  /**
   * POST /api/team-journeys
   * Create a team journey (start a journey for a team)
   * Body: { teamId, journeyId }
   */
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { teamId, journeyId } = req.body;
      const userId = req.user.id;

      if (!teamId || !journeyId) {
        return res.status(400).json({ error: 'Team ID and Journey ID are required' });
      }

      const teamJourney = await service.createTeamJourney(teamId, journeyId, userId);
      res.status(201).json(teamJourney);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/team-journeys/:teamId
   * Get all journeys for a team
   */
  router.get('/:teamId', authenticateToken, async (req, res) => {
    try {
      const { teamId } = req.params;
      const journeys = await service.getTeamJourneys(teamId);
      res.json(journeys);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= TEAM MEMBER ROUTES =============

  /**
   * POST /api/team-journeys/:teamJourneyId/members
   * Add a member to the team
   * Body: { userId }
   */
  router.post('/:teamJourneyId/members', authenticateToken, async (req, res) => {
    try {
      const { teamJourneyId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Get team journey to get team ID
      const teamJourney = await db.get(
        'SELECT team_id FROM team_journeys WHERE id = ?',
        [teamJourneyId]
      );

      if (!teamJourney) {
        return res.status(404).json({ error: 'Team journey not found' });
      }

      const member = await service.addTeamMember(teamJourney.team_id, userId);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/team-journeys/:teamJourneyId/members
   * Get all members of a team
   */
  router.get('/:teamJourneyId/members', authenticateToken, async (req, res) => {
    try {
      const { teamJourneyId } = req.params;

      const teamJourney = await db.get(
        'SELECT team_id FROM team_journeys WHERE id = ?',
        [teamJourneyId]
      );

      if (!teamJourney) {
        return res.status(404).json({ error: 'Team journey not found' });
      }

      const members = await service.getTeamMembers(teamJourney.team_id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/team-journeys/:teamJourneyId/members/:userId
   * Remove a member from the team
   */
  router.delete('/:teamJourneyId/members/:userId', authenticateToken, async (req, res) => {
    try {
      const { teamJourneyId, userId } = req.params;

      const teamJourney = await db.get(
        'SELECT team_id FROM team_journeys WHERE id = ?',
        [teamJourneyId]
      );

      if (!teamJourney) {
        return res.status(404).json({ error: 'Team journey not found' });
      }

      await service.removeTeamMember(teamJourney.team_id, parseInt(userId));
      res.json({ message: 'Member removed' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============= SHARED TASK SUBMISSION ROUTES =============

  /**
   * POST /api/team-journeys/:teamJourneyId/tasks/:taskId/submit
   * Submit a shared task
   * Body: { submissionContent }
   */
  router.post('/:teamJourneyId/tasks/:taskId/submit', authenticateToken, async (req, res) => {
    try {
      const { teamJourneyId, taskId } = req.params;
      const { submissionContent } = req.body;
      const userId = req.user.id;

      if (!submissionContent) {
        return res.status(400).json({ error: 'Submission content is required' });
      }

      const submission = await service.submitTask(
        parseInt(teamJourneyId),
        parseInt(taskId),
        userId,
        submissionContent
      );

      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/team-journeys/:teamJourneyId/tasks/:taskId/submissions
   * Get all submissions for a task
   */
  router.get('/:teamJourneyId/tasks/:taskId/submissions', authenticateToken, async (req, res) => {
    try {
      const { teamJourneyId, taskId } = req.params;
      const submissions = await service.getTaskSubmissions(
        parseInt(teamJourneyId),
        parseInt(taskId)
      );
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/submissions/:submissionId
   * Get a specific submission
   */
  router.get('/submission/:submissionId', authenticateToken, async (req, res) => {
    try {
      const { submissionId } = req.params;
      const submission = await service.getSubmission(parseInt(submissionId));

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= PEER REVIEW ROUTES =============

  /**
   * POST /api/submissions/:submissionId/reviews
   * Submit a peer review
   * Body: { feedback, rating }
   */
  router.post('/submission/:submissionId/reviews', authenticateToken, async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { feedback, rating } = req.body;
      const userId = req.user.id;

      if (!rating) {
        return res.status(400).json({ error: 'Rating is required' });
      }

      const review = await service.reviewSubmission(
        parseInt(submissionId),
        userId,
        feedback || null,
        parseInt(rating)
      );

      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/submissions/:submissionId/reviews
   * Get all reviews for a submission
   */
  router.get('/submission/:submissionId/reviews', authenticateToken, async (req, res) => {
    try {
      const { submissionId } = req.params;
      const reviews = await service.getSubmissionReviews(parseInt(submissionId));
      const rating = await service.getSubmissionRating(parseInt(submissionId));

      res.json({
        reviews,
        rating
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/reviews/:reviewId
   * Delete a review
   */
  router.delete('/review/:reviewId', authenticateToken, async (req, res) => {
    try {
      const { reviewId } = req.params;
      await service.deleteReview(parseInt(reviewId));
      res.json({ message: 'Review deleted' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
