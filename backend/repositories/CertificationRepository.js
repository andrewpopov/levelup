/**
 * Certification Repository - Competency profiles, assessments, and certifications
 */

import { BaseRepository } from './BaseRepository.js';
import crypto from 'crypto';

export class CertificationRepository extends BaseRepository {
  // ============= COMPETENCY PROFILES =============

  async createProfile(userId, journeyId) {
    const result = await this.run(
      'INSERT INTO competency_profiles (user_id, journey_id) VALUES (?, ?)',
      [userId, journeyId]
    );
    return result.lastID;
  }

  async getProfile(userId, journeyId) {
    return this.get(
      `SELECT id, user_id as userId, journey_id as journeyId, created_at FROM competency_profiles
       WHERE user_id = ? AND journey_id = ?`,
      [userId, journeyId]
    );
  }

  // ============= COMPETENCY ASSESSMENTS =============

  async createAssessment(profileId, signalName, targetLevel, currentLevel) {
    const result = await this.run(
      `INSERT INTO competency_assessments (profile_id, signal_name, target_level, current_level)
       VALUES (?, ?, ?, ?)`,
      [profileId, signalName, targetLevel, currentLevel]
    );
    return result.lastID;
  }

  async updateAssessment(assessmentId, targetLevel, currentLevel) {
    await this.run(
      `UPDATE competency_assessments SET target_level = ?, current_level = ?, assessed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [targetLevel, currentLevel, assessmentId]
    );
  }

  async getAssessments(profileId) {
    return this.all(
      `SELECT id, profile_id as profileId, signal_name as signalName, target_level as targetLevel,
              current_level as currentLevel, assessed_at FROM competency_assessments
       WHERE profile_id = ?
       ORDER BY signal_name`,
      [profileId]
    );
  }

  async getAssessment(profileId, signalName) {
    return this.get(
      `SELECT id, profile_id as profileId, signal_name as signalName, target_level as targetLevel,
              current_level as currentLevel, assessed_at FROM competency_assessments
       WHERE profile_id = ? AND signal_name = ?`,
      [profileId, signalName]
    );
  }

  // ============= CERTIFICATIONS =============

  async issueCertification(userId, journeyId) {
    // Generate shareable token
    const shareableToken = crypto.randomBytes(32).toString('hex');

    const result = await this.run(
      `INSERT INTO certifications (user_id, journey_id, issued_at, shareable_token)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?)`,
      [userId, journeyId, shareableToken]
    );
    return {
      id: result.lastID,
      shareableToken
    };
  }

  async getCertification(userId, journeyId) {
    return this.get(
      `SELECT id, user_id as userId, journey_id as journeyId, issued_at, certificate_url,
              is_sharable as isShareable, shareable_token as shareableToken, created_at
       FROM certifications WHERE user_id = ? AND journey_id = ?`,
      [userId, journeyId]
    );
  }

  async getCertificationById(certificationId) {
    return this.get(
      `SELECT id, user_id as userId, journey_id as journeyId, issued_at, certificate_url,
              is_sharable as isShareable, shareable_token as shareableToken, created_at
       FROM certifications WHERE id = ?`,
      [certificationId]
    );
  }

  async getCertificationByToken(token) {
    return this.get(
      `SELECT id, user_id as userId, journey_id as journeyId, issued_at, certificate_url,
              is_sharable as isShareable, shareable_token as shareableToken, created_at
       FROM certifications WHERE shareable_token = ? AND is_sharable = 1`,
      [token]
    );
  }

  async getUserCertifications(userId) {
    return this.all(
      `SELECT id, user_id as userId, journey_id as journeyId, issued_at, certificate_url,
              is_sharable as isShareable, created_at
       FROM certifications WHERE user_id = ?
       ORDER BY issued_at DESC`,
      [userId]
    );
  }

  async updateCertificateUrl(certificationId, certificateUrl) {
    await this.run(
      'UPDATE certifications SET certificate_url = ? WHERE id = ?',
      [certificateUrl, certificationId]
    );
  }

  async revokeCertification(certificationId) {
    await this.run(
      'UPDATE certifications SET is_sharable = 0 WHERE id = ?',
      [certificationId]
    );
  }

  // ============= BADGES =============

  async createBadge(badgeName, iconUrl, description, requirements) {
    const result = await this.run(
      `INSERT INTO badges (badge_name, icon_url, description, requirements)
       VALUES (?, ?, ?, ?)`,
      [badgeName, iconUrl, description, JSON.stringify(requirements)]
    );
    return result.lastID;
  }

  async getBadge(badgeId) {
    const badge = await this.get(
      `SELECT id, badge_name as badgeName, icon_url as iconUrl, description, requirements, created_at
       FROM badges WHERE id = ?`,
      [badgeId]
    );

    if (badge && badge.requirements) {
      badge.requirements = JSON.parse(badge.requirements);
    }

    return badge;
  }

  async getAllBadges() {
    const badges = await this.all(
      `SELECT id, badge_name as badgeName, icon_url as iconUrl, description, requirements, created_at
       FROM badges ORDER BY badgeName`
    );

    return badges.map(b => ({
      ...b,
      requirements: JSON.parse(b.requirements)
    }));
  }

  async awardBadge(userId, badgeId) {
    const result = await this.run(
      'INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [userId, badgeId]
    );
    return result.lastID;
  }

  async getUserBadges(userId) {
    return this.all(
      `SELECT ub.id, b.id as badgeId, b.badge_name as badgeName, b.icon_url as iconUrl,
              b.description, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );
  }

  async hasBadge(userId, badgeId) {
    const record = await this.get(
      'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [userId, badgeId]
    );
    return !!record;
  }
}
