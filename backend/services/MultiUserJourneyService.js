/**
 * Multi-User Journey Service - Team-based collaborative learning
 */

import { MultiUserJourneyRepository } from '../repositories/MultiUserJourneyRepository.js';
import { JourneyRepository } from '../repositories/JourneyRepository.js';
import eventBus from '../core/event-bus.js';
import {
  TeamJourneyCreatedEvent,
  TeamMemberAddedEvent,
  SharedTaskSubmittedEvent,
  SubmissionReviewedEvent
} from '../core/domain-events.js';

export class MultiUserJourneyService {
  constructor(db) {
    this.multiUserRepository = new MultiUserJourneyRepository(db);
    this.journeyRepository = new JourneyRepository(db);
  }

  // ============= TEAM JOURNEY MANAGEMENT =============

  /**
   * Create a team journey (start a journey as a team)
   */
  async createTeamJourney(teamId, journeyId, createdBy) {
    // Verify journey exists
    const journey = await this.journeyRepository.findById(journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    const teamJourneyId = await this.multiUserRepository.createTeamJourney(
      teamId,
      journeyId,
      createdBy
    );

    // Publish event
    await eventBus.publish(
      new TeamJourneyCreatedEvent(teamJourneyId, teamId, journeyId)
    );

    return {
      id: teamJourneyId,
      teamId,
      journey,
      createdAt: new Date()
    };
  }

  /**
   * Get team journeys
   */
  async getTeamJourneys(teamId) {
    const teamJourneys = await this.multiUserRepository.findTeamJourneysForTeam(teamId);

    return Promise.all(
      teamJourneys.map(async (tj) => {
        const journey = await this.journeyRepository.findById(tj.journeyId);
        return {
          ...tj,
          journey
        };
      })
    );
  }

  // ============= TEAM MEMBER MANAGEMENT =============

  /**
   * Add member to team
   */
  async addTeamMember(teamId, userId) {
    const isMember = await this.multiUserRepository.isTeamMember(teamId, userId);
    if (isMember) {
      throw new Error('User is already a team member');
    }

    const memberId = await this.multiUserRepository.addTeamMember(teamId, userId);

    // Publish event for all active team journeys
    const teamJourneys = await this.multiUserRepository.findTeamJourneysForTeam(teamId);
    for (const tj of teamJourneys) {
      await eventBus.publish(new TeamMemberAddedEvent(tj.id, userId));
    }

    return { memberId, teamId, userId };
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId) {
    return this.multiUserRepository.getTeamMembers(teamId);
  }

  /**
   * Remove team member
   */
  async removeTeamMember(teamId, userId) {
    await this.multiUserRepository.removeTeamMember(teamId, userId);
  }

  // ============= SHARED TASK SUBMISSIONS =============

  /**
   * Submit a shared task
   */
  async submitTask(teamJourneyId, taskId, userId, submissionContent) {
    if (!submissionContent || submissionContent.trim().length === 0) {
      throw new Error('Submission cannot be empty');
    }

    // Check for duplicate submission
    const existing = await this.multiUserRepository.getUserSubmission(
      teamJourneyId,
      taskId,
      userId
    );

    if (existing) {
      throw new Error('You have already submitted this task');
    }

    const submissionId = await this.multiUserRepository.submitTask(
      teamJourneyId,
      taskId,
      userId,
      submissionContent
    );

    // Publish event
    await eventBus.publish(
      new SharedTaskSubmittedEvent(submissionId, teamJourneyId, taskId, userId)
    );

    return {
      id: submissionId,
      teamJourneyId,
      taskId,
      userId,
      submissionContent,
      status: 'submitted',
      submittedAt: new Date()
    };
  }

  /**
   * Get all submissions for a task
   */
  async getTaskSubmissions(teamJourneyId, taskId) {
    return this.multiUserRepository.getTaskSubmissions(teamJourneyId, taskId);
  }

  /**
   * Get a specific submission
   */
  async getSubmission(submissionId) {
    return this.multiUserRepository.getSubmission(submissionId);
  }

  // ============= PEER REVIEWS =============

  /**
   * Submit a review of another team member's submission
   */
  async reviewSubmission(submissionId, reviewedBy, feedback, rating) {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if already reviewed by this user
    const existing = await this.multiUserRepository.getUserReview(submissionId, reviewedBy);
    if (existing) {
      throw new Error('You have already reviewed this submission');
    }

    const reviewId = await this.multiUserRepository.submitReview(
      submissionId,
      reviewedBy,
      feedback,
      rating
    );

    // Publish event
    await eventBus.publish(
      new SubmissionReviewedEvent(submissionId, reviewedBy, feedback)
    );

    return {
      id: reviewId,
      submissionId,
      reviewedBy,
      feedback,
      rating,
      reviewedAt: new Date()
    };
  }

  /**
   * Get all reviews for a submission
   */
  async getSubmissionReviews(submissionId) {
    return this.multiUserRepository.getSubmissionReviews(submissionId);
  }

  /**
   * Get average rating for a submission
   */
  async getSubmissionRating(submissionId) {
    const reviews = await this.multiUserRepository.getSubmissionReviews(submissionId);

    if (reviews.length === 0) {
      return { averageRating: null, reviewCount: 0 };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = sum / reviews.length;

    return {
      averageRating: parseFloat(averageRating.toFixed(2)),
      reviewCount: reviews.length
    };
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId) {
    await this.multiUserRepository.deleteReview(reviewId);
  }
}
