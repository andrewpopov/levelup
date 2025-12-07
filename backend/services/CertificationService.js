/**
 * Certification Service - Competency assessment and credential issuance
 */

import { CertificationRepository } from '../repositories/CertificationRepository.js';
import { JourneyRepository } from '../repositories/JourneyRepository.js';
import eventBus from '../core/event-bus.js';
import { CertificationIssuedEvent, BadgeEarnedEvent } from '../core/domain-events.js';

export class CertificationService {
  constructor(db) {
    this.certificationRepository = new CertificationRepository(db);
    this.journeyRepository = new JourneyRepository(db);
  }

  // ============= COMPETENCY PROFILES =============

  /**
   * Create a competency profile for user in journey
   */
  async createCompetencyProfile(userId, journeyId, targetSignals = []) {
    let profile = await this.certificationRepository.getProfile(userId, journeyId);

    if (profile) {
      return profile;
    }

    const profileId = await this.certificationRepository.createProfile(userId, journeyId);

    // Initialize assessments for target signals
    for (const signal of targetSignals) {
      await this.certificationRepository.createAssessment(
        profileId,
        signal.name,
        signal.targetLevel || 5,
        0
      );
    }

    return this.getCompetencyProfile(userId, journeyId);
  }

  /**
   * Get competency profile
   */
  async getCompetencyProfile(userId, journeyId) {
    const profile = await this.certificationRepository.getProfile(userId, journeyId);
    if (!profile) {
      return null;
    }

    const assessments = await this.certificationRepository.getAssessments(profile.id);

    return {
      ...profile,
      assessments
    };
  }

  // ============= COMPETENCY ASSESSMENTS =============

  /**
   * Update competency assessment (from story signals)
   */
  async assessCompetency(userId, journeyId, signalName, currentLevel) {
    const profile = await this.certificationRepository.getProfile(userId, journeyId);
    if (!profile) {
      throw new Error('Competency profile not found');
    }

    let assessment = await this.certificationRepository.getAssessment(profile.id, signalName);

    if (!assessment) {
      // Create new assessment
      await this.certificationRepository.createAssessment(
        profile.id,
        signalName,
        5, // default target level
        currentLevel
      );
    } else {
      // Update existing assessment
      await this.certificationRepository.updateAssessment(
        assessment.id,
        assessment.targetLevel,
        currentLevel
      );
    }

    return this.getCompetencyProfile(userId, journeyId);
  }

  /**
   * Get skill gaps (signals below target level)
   */
  async getSkillGaps(userId, journeyId) {
    const profile = await this.getCompetencyProfile(userId, journeyId);
    if (!profile) {
      return [];
    }

    return profile.assessments.filter(a => a.currentLevel < (a.targetLevel || 5));
  }

  // ============= CERTIFICATIONS =============

  /**
   * Issue a certification (when journey complete)
   */
  async issueCertification(userId, journeyId) {
    // Check if journey is complete
    const userJourney = await this.journeyRepository.getUserJourney(userId, journeyId);
    if (!userJourney || userJourney.status !== 'completed') {
      throw new Error('Journey must be completed to receive certification');
    }

    const journey = await this.journeyRepository.findById(journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    // Create or get existing certification
    let cert = await this.certificationRepository.getCertification(userId, journeyId);

    if (!cert) {
      const result = await this.certificationRepository.issueCertification(userId, journeyId);
      cert = await this.certificationRepository.getCertificationById(result.id);

      // Publish event
      await eventBus.publish(
        new CertificationIssuedEvent(cert.id, userId, journeyId)
      );
    }

    return cert;
  }

  /**
   * Get user's certification
   */
  async getCertification(userId, journeyId) {
    return this.certificationRepository.getCertification(userId, journeyId);
  }

  /**
   * Get certification by public token (for sharing)
   */
  async getPublicCertification(token) {
    return this.certificationRepository.getCertificationByToken(token);
  }

  /**
   * Get all user certifications
   */
  async getUserCertifications(userId) {
    return this.certificationRepository.getUserCertifications(userId);
  }

  /**
   * Revoke certification
   */
  async revokeCertification(certificationId) {
    await this.certificationRepository.revokeCertification(certificationId);
  }

  // ============= BADGES =============

  /**
   * Create a badge definition
   */
  async createBadge(badgeName, iconUrl, description, requirements) {
    if (!badgeName) {
      throw new Error('Badge name is required');
    }

    return this.certificationRepository.createBadge(
      badgeName,
      iconUrl,
      description,
      requirements
    );
  }

  /**
   * Get badge
   */
  async getBadge(badgeId) {
    return this.certificationRepository.getBadge(badgeId);
  }

  /**
   * Get all badges
   */
  async getAllBadges() {
    return this.certificationRepository.getAllBadges();
  }

  /**
   * Award badge to user
   */
  async awardBadge(userId, badgeId) {
    const badge = await this.certificationRepository.getBadge(badgeId);
    if (!badge) {
      throw new Error('Badge not found');
    }

    const hasBadge = await this.certificationRepository.hasBadge(userId, badgeId);
    if (hasBadge) {
      throw new Error('User already has this badge');
    }

    await this.certificationRepository.awardBadge(userId, badgeId);

    // Publish event
    await eventBus.publish(
      new BadgeEarnedEvent(userId, badge.badgeName)
    );

    return badge;
  }

  /**
   * Get user badges
   */
  async getUserBadges(userId) {
    return this.certificationRepository.getUserBadges(userId);
  }

  // ============= COMPLETION METRICS =============

  /**
   * Get comprehensive competency report
   */
  async getCompetencyReport(userId, journeyId) {
    const profile = await this.getCompetencyProfile(userId, journeyId);
    if (!profile) {
      return null;
    }

    const gaps = await this.getSkillGaps(userId, journeyId);
    const certification = await this.getCertification(userId, journeyId);
    const badges = await this.getUserBadges(userId);

    // Calculate competency score
    const avgLevel = profile.assessments.length > 0
      ? profile.assessments.reduce((sum, a) => sum + a.currentLevel, 0) / profile.assessments.length
      : 0;

    return {
      profile,
      overallCompetencyScore: parseFloat(avgLevel.toFixed(2)),
      skillGaps: gaps,
      skillGapsCount: gaps.length,
      certification: certification ? { issued: true, token: certification.shareableToken } : { issued: false },
      badges,
      readinesPercentage: calculateInterviewReadiness(profile.assessments)
    };
  }
}

/**
 * Helper to calculate interview readiness based on signal levels
 */
function calculateInterviewReadiness(assessments) {
  if (assessments.length === 0) return 0;

  // Consider signals at level 3+ as "ready"
  const readyCount = assessments.filter(a => a.currentLevel >= 3).length;
  return Math.round((readyCount / assessments.length) * 100);
}
