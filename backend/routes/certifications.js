/**
 * Certification Routes - Competency profiles, assessments, certifications, and badges
 *
 * Requires authentication via JWT token in Authorization header
 */

import express from 'express';
import { CertificationService } from '../services/CertificationService.js';
import { authenticateToken } from '../auth.js';

export function setupCertificationRoutes(app, db) {
  const router = express.Router();
  const service = new CertificationService(db);

  // ============= COMPETENCY PROFILES =============

  /**
   * POST /api/competency-profiles
   * Create a competency profile for a user in a journey
   * Body: { journeyId, targetSignals? }
   */
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const { journeyId, targetSignals } = req.body;
      const userId = req.user.id;

      if (!journeyId) {
        return res.status(400).json({ error: 'Journey ID is required' });
      }

      const profile = await service.createCompetencyProfile(
        userId,
        parseInt(journeyId),
        targetSignals || []
      );

      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/competency-profiles/:journeyId
   * Get competency profile for current user in a journey
   */
  router.get('/:journeyId', authenticateToken, async (req, res) => {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;

      const profile = await service.getCompetencyProfile(
        userId,
        parseInt(journeyId)
      );

      if (!profile) {
        return res.status(404).json({ error: 'Competency profile not found' });
      }

      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= COMPETENCY ASSESSMENTS =============

  /**
   * POST /api/competency-assessments/:journeyId
   * Assess or update a competency (from story signals)
   * Body: { signalName, currentLevel }
   */
  router.post('/:journeyId/assessments', authenticateToken, async (req, res) => {
    try {
      const { journeyId } = req.params;
      const { signalName, currentLevel } = req.body;
      const userId = req.user.id;

      if (!signalName || currentLevel === undefined) {
        return res.status(400).json({ error: 'Signal name and level are required' });
      }

      const profile = await service.assessCompetency(
        userId,
        parseInt(journeyId),
        signalName,
        parseInt(currentLevel)
      );

      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/competency-assessments/:journeyId/gaps
   * Get skill gaps (signals below target level)
   */
  router.get('/:journeyId/gaps', authenticateToken, async (req, res) => {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;

      const gaps = await service.getSkillGaps(
        userId,
        parseInt(journeyId)
      );

      res.json({
        journeyId: parseInt(journeyId),
        skillGaps: gaps,
        gapCount: gaps.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= CERTIFICATIONS =============

  /**
   * POST /api/certifications/:journeyId/issue
   * Issue a certification when journey is complete
   */
  router.post('/:journeyId/issue', authenticateToken, async (req, res) => {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;

      const cert = await service.issueCertification(
        userId,
        parseInt(journeyId)
      );

      res.status(201).json(cert);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/certifications/:journeyId
   * Get user's certification for a journey
   */
  router.get('/:journeyId', authenticateToken, async (req, res) => {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;

      const cert = await service.getCertification(
        userId,
        parseInt(journeyId)
      );

      if (!cert) {
        return res.status(404).json({ error: 'Certification not found' });
      }

      res.json(cert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/certifications/me/all
   * Get all user's certifications
   */
  router.get('/me/all', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const certs = await service.getUserCertifications(userId);
      res.json(certs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/certifications/public/:token
   * Get public certification (shareable link)
   */
  router.get('/public/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const cert = await service.getPublicCertification(token);

      if (!cert) {
        return res.status(404).json({ error: 'Certification not found or not shareable' });
      }

      res.json(cert);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/certifications/:journeyId/revoke
   * Revoke a certification
   */
  router.delete('/:journeyId/revoke', authenticateToken, async (req, res) => {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;

      const cert = await service.getCertification(userId, parseInt(journeyId));
      if (!cert) {
        return res.status(404).json({ error: 'Certification not found' });
      }

      await service.revokeCertification(cert.id);
      res.json({ message: 'Certification revoked' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============= BADGES =============

  /**
   * POST /api/badges
   * Create a badge (admin only)
   * Body: { badgeName, iconUrl, description, requirements }
   */
  router.post('/badge/create', authenticateToken, async (req, res) => {
    try {
      const { badgeName, iconUrl, description, requirements } = req.body;

      if (!badgeName) {
        return res.status(400).json({ error: 'Badge name is required' });
      }

      const badgeId = await service.createBadge(
        badgeName,
        iconUrl,
        description,
        requirements
      );

      res.status(201).json({ badgeId });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/badges
   * Get all badges
   */
  router.get('/badge/all', async (req, res) => {
    try {
      const badges = await service.getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/badges/:badgeId
   * Get a specific badge
   */
  router.get('/badge/:badgeId', async (req, res) => {
    try {
      const { badgeId } = req.params;
      const badge = await service.getBadge(parseInt(badgeId));

      if (!badge) {
        return res.status(404).json({ error: 'Badge not found' });
      }

      res.json(badge);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/badges/:badgeId/award
   * Award a badge to a user (admin only)
   * Body: { userId }
   */
  router.post('/badge/:badgeId/award', authenticateToken, async (req, res) => {
    try {
      const { badgeId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const badge = await service.awardBadge(userId, parseInt(badgeId));
      res.status(201).json(badge);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/badges/me/earned
   * Get badges earned by current user
   */
  router.get('/me/earned', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const badges = await service.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= COMPETENCY REPORTS =============

  /**
   * GET /api/competency-report/:journeyId
   * Get comprehensive competency report
   */
  router.get('/report/:journeyId', authenticateToken, async (req, res) => {
    try {
      const { journeyId } = req.params;
      const userId = req.user.id;

      const report = await service.getCompetencyReport(
        userId,
        parseInt(journeyId)
      );

      if (!report) {
        return res.status(404).json({ error: 'No competency data found' });
      }

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
