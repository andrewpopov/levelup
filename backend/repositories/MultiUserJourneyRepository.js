/**
 * Multi-User Journey Repository - Team-based collaborative learning
 */

import { BaseRepository } from './BaseRepository.js';

export class MultiUserJourneyRepository extends BaseRepository {
  // ============= TEAM JOURNEY MANAGEMENT =============

  async findTeamJourneyById(teamJourneyId) {
    return this.get(
      `SELECT id, team_id as teamId, journey_id as journeyId, created_by as createdBy,
              status, created_at FROM team_journeys WHERE id = ?`,
      [teamJourneyId]
    );
  }

  async findTeamJourneysForTeam(teamId) {
    return this.all(
      `SELECT id, team_id as teamId, journey_id as journeyId, created_by as createdBy,
              status, created_at FROM team_journeys WHERE team_id = ? AND status = 'active'
       ORDER BY created_at DESC`,
      [teamId]
    );
  }

  async createTeamJourney(teamId, journeyId, createdBy) {
    const result = await this.run(
      'INSERT INTO team_journeys (team_id, journey_id, created_by) VALUES (?, ?, ?)',
      [teamId, journeyId, createdBy]
    );
    return result.lastID;
  }

  // ============= TEAM MEMBER MANAGEMENT =============

  async addTeamMember(teamId, userId) {
    const result = await this.run(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
      [teamId, userId]
    );
    return result.lastID;
  }

  async removeTeamMember(teamId, userId) {
    await this.run(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
  }

  async getTeamMembers(teamId) {
    return this.all(
      `SELECT id, user_id as userId, role, joined_at FROM team_members
       WHERE team_id = ? ORDER BY joined_at`,
      [teamId]
    );
  }

  async isTeamMember(teamId, userId) {
    const record = await this.get(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    );
    return !!record;
  }

  // ============= SHARED TASK SUBMISSIONS =============

  async submitTask(teamJourneyId, taskId, userId, submissionContent) {
    const result = await this.run(
      `INSERT INTO shared_task_submissions (team_journey_id, task_id, submitted_by, submission_content)
       VALUES (?, ?, ?, ?)`,
      [teamJourneyId, taskId, userId, submissionContent]
    );
    return result.lastID;
  }

  async getSubmission(submissionId) {
    return this.get(
      `SELECT id, team_journey_id as teamJourneyId, task_id as taskId, submitted_by as submittedBy,
              submission_content as submissionContent, status, submitted_at FROM shared_task_submissions
       WHERE id = ?`,
      [submissionId]
    );
  }

  async getTaskSubmissions(teamJourneyId, taskId) {
    return this.all(
      `SELECT id, team_journey_id as teamJourneyId, task_id as taskId, submitted_by as submittedBy,
              submission_content as submissionContent, status, submitted_at FROM shared_task_submissions
       WHERE team_journey_id = ? AND task_id = ?
       ORDER BY submitted_at DESC`,
      [teamJourneyId, taskId]
    );
  }

  async getUserSubmission(teamJourneyId, taskId, userId) {
    return this.get(
      `SELECT id, team_journey_id as teamJourneyId, task_id as taskId, submitted_by as submittedBy,
              submission_content as submissionContent, status, submitted_at FROM shared_task_submissions
       WHERE team_journey_id = ? AND task_id = ? AND submitted_by = ?`,
      [teamJourneyId, taskId, userId]
    );
  }

  // ============= PEER REVIEWS =============

  async submitReview(submissionId, reviewedBy, feedback, rating) {
    const result = await this.run(
      `INSERT INTO submission_reviews (submission_id, reviewed_by, feedback, rating)
       VALUES (?, ?, ?, ?)`,
      [submissionId, reviewedBy, feedback, rating]
    );
    return result.lastID;
  }

  async getSubmissionReviews(submissionId) {
    return this.all(
      `SELECT id, submission_id as submissionId, reviewed_by as reviewedBy, feedback, rating, reviewed_at
       FROM submission_reviews WHERE submission_id = ?
       ORDER BY reviewed_at DESC`,
      [submissionId]
    );
  }

  async getUserReview(submissionId, userId) {
    return this.get(
      `SELECT id, submission_id as submissionId, reviewed_by as reviewedBy, feedback, rating, reviewed_at
       FROM submission_reviews WHERE submission_id = ? AND reviewed_by = ?`,
      [submissionId, userId]
    );
  }

  async deleteReview(reviewId) {
    await this.run(
      'DELETE FROM submission_reviews WHERE id = ?',
      [reviewId]
    );
  }
}
