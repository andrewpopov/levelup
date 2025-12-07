/**
 * Multi-User Journey Service Tests
 */

import { MultiUserJourneyService } from '../../services/MultiUserJourneyService.js';
import eventBus from '../../core/event-bus.js';
import {
  TeamJourneyCreatedEvent,
  TeamMemberAddedEvent,
  SharedTaskSubmittedEvent,
  SubmissionReviewedEvent
} from '../../core/domain-events.js';

describe('MultiUserJourneyService', () => {
  let service;
  let mockMultiUserRepository;
  let mockJourneyRepository;

  beforeEach(() => {
    eventBus.clearHistory();
    eventBus.clearListeners();

    mockMultiUserRepository = {
      createTeamJourney: jest.fn(),
      findTeamJourneysForTeam: jest.fn(),
      addTeamMember: jest.fn(),
      removeTeamMember: jest.fn(),
      getTeamMembers: jest.fn(),
      isTeamMember: jest.fn(),
      submitTask: jest.fn(),
      getSubmission: jest.fn(),
      getTaskSubmissions: jest.fn(),
      getUserSubmission: jest.fn(),
      submitReview: jest.fn(),
      getSubmissionReviews: jest.fn(),
      getUserReview: jest.fn(),
      deleteReview: jest.fn()
    };

    mockJourneyRepository = {
      findById: jest.fn()
    };

    service = new MultiUserJourneyService({});
    service.multiUserRepository = mockMultiUserRepository;
    service.journeyRepository = mockJourneyRepository;
  });

  describe('createTeamJourney', () => {
    it('should create a team journey', async () => {
      const mockJourney = {
        id: 1,
        title: 'Interview Prep',
        description: 'Prepare for interviews'
      };

      mockJourneyRepository.findById.mockResolvedValue(mockJourney);
      mockMultiUserRepository.createTeamJourney.mockResolvedValue(1);

      const publishSpy = jest.spyOn(eventBus, 'publish');

      const result = await service.createTeamJourney(1, 1, 2);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('teamId', 1);
      expect(result).toHaveProperty('journey');

      expect(publishSpy).toHaveBeenCalled();
      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(TeamJourneyCreatedEvent);
    });

    it('should reject if journey not found', async () => {
      mockJourneyRepository.findById.mockResolvedValue(null);

      await expect(
        service.createTeamJourney(1, 999, 2)
      ).rejects.toThrow('not found');
    });
  });

  describe('addTeamMember', () => {
    it('should add a member to the team', async () => {
      mockMultiUserRepository.isTeamMember.mockResolvedValue(false);
      mockMultiUserRepository.addTeamMember.mockResolvedValue(1);
      mockMultiUserRepository.findTeamJourneysForTeam.mockResolvedValue([
        { id: 1, teamId: 1, journeyId: 1 }
      ]);

      const publishSpy = jest.spyOn(eventBus, 'publish');

      const result = await service.addTeamMember(1, 2);

      expect(result).toEqual({
        memberId: 1,
        teamId: 1,
        userId: 2
      });

      expect(publishSpy).toHaveBeenCalled();
      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(TeamMemberAddedEvent);
    });

    it('should reject if user already a member', async () => {
      mockMultiUserRepository.isTeamMember.mockResolvedValue(true);

      await expect(
        service.addTeamMember(1, 2)
      ).rejects.toThrow('already a team member');
    });

    it('should publish event for each active team journey', async () => {
      mockMultiUserRepository.isTeamMember.mockResolvedValue(false);
      mockMultiUserRepository.addTeamMember.mockResolvedValue(1);
      mockMultiUserRepository.findTeamJourneysForTeam.mockResolvedValue([
        { id: 1, teamId: 1, journeyId: 1 },
        { id: 2, teamId: 1, journeyId: 2 }
      ]);

      const publishSpy = jest.spyOn(eventBus, 'publish');

      await service.addTeamMember(1, 2);

      const events = publishSpy.mock.calls.map(call => call[0]);
      const memberAddedEvents = events.filter(e => e instanceof TeamMemberAddedEvent);
      expect(memberAddedEvents.length).toBe(2);
    });
  });

  describe('getTeamMembers', () => {
    it('should retrieve team members', async () => {
      const mockMembers = [
        { id: 1, userId: 1, role: 'leader', joinedAt: '2024-01-01' },
        { id: 2, userId: 2, role: 'member', joinedAt: '2024-01-02' }
      ];

      mockMultiUserRepository.getTeamMembers.mockResolvedValue(mockMembers);

      const members = await service.getTeamMembers(1);

      expect(members).toEqual(mockMembers);
      expect(mockMultiUserRepository.getTeamMembers).toHaveBeenCalledWith(1);
    });
  });

  describe('submitTask', () => {
    it('should submit a shared task', async () => {
      mockMultiUserRepository.getUserSubmission.mockResolvedValue(null);
      mockMultiUserRepository.submitTask.mockResolvedValue(1);

      const publishSpy = jest.spyOn(eventBus, 'publish');

      const result = await service.submitTask(1, 1, 2, 'My submission content');

      expect(result).toEqual({
        id: 1,
        teamJourneyId: 1,
        taskId: 1,
        userId: 2,
        submissionContent: 'My submission content',
        status: 'submitted',
        submittedAt: expect.any(Date)
      });

      expect(publishSpy).toHaveBeenCalled();
      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(SharedTaskSubmittedEvent);
    });

    it('should reject empty submission', async () => {
      await expect(
        service.submitTask(1, 1, 2, '')
      ).rejects.toThrow('cannot be empty');
    });

    it('should reject duplicate submission', async () => {
      mockMultiUserRepository.getUserSubmission.mockResolvedValue({
        id: 1,
        submissionContent: 'Existing submission'
      });

      await expect(
        service.submitTask(1, 1, 2, 'New submission')
      ).rejects.toThrow('already submitted');
    });
  });

  describe('getTaskSubmissions', () => {
    it('should get all submissions for a task', async () => {
      const mockSubmissions = [
        {
          id: 1,
          submittedBy: 1,
          submissionContent: 'Submission 1',
          status: 'submitted'
        },
        {
          id: 2,
          submittedBy: 2,
          submissionContent: 'Submission 2',
          status: 'submitted'
        }
      ];

      mockMultiUserRepository.getTaskSubmissions.mockResolvedValue(mockSubmissions);

      const submissions = await service.getTaskSubmissions(1, 1);

      expect(submissions).toEqual(mockSubmissions);
      expect(mockMultiUserRepository.getTaskSubmissions).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('reviewSubmission', () => {
    it('should submit a peer review', async () => {
      mockMultiUserRepository.getUserReview.mockResolvedValue(null);
      mockMultiUserRepository.submitReview.mockResolvedValue(1);

      const publishSpy = jest.spyOn(eventBus, 'publish');

      const result = await service.reviewSubmission(
        1,
        2,
        'Great work! Very clear explanation.',
        5
      );

      expect(result).toEqual({
        id: 1,
        submissionId: 1,
        reviewedBy: 2,
        feedback: 'Great work! Very clear explanation.',
        rating: 5,
        reviewedAt: expect.any(Date)
      });

      expect(publishSpy).toHaveBeenCalled();
      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(SubmissionReviewedEvent);
    });

    it('should reject invalid rating', async () => {
      await expect(
        service.reviewSubmission(1, 2, 'Feedback', 10)
      ).rejects.toThrow('between 1 and 5');

      await expect(
        service.reviewSubmission(1, 2, 'Feedback', 0)
      ).rejects.toThrow('between 1 and 5');
    });

    it('should reject duplicate review', async () => {
      mockMultiUserRepository.getUserReview.mockResolvedValue({
        id: 1,
        rating: 4
      });

      await expect(
        service.reviewSubmission(1, 2, 'Feedback', 5)
      ).rejects.toThrow('already reviewed');
    });
  });

  describe('getSubmissionReviews', () => {
    it('should get all reviews for a submission', async () => {
      const mockReviews = [
        { id: 1, reviewedBy: 2, rating: 5, feedback: 'Great!' },
        { id: 2, reviewedBy: 3, rating: 4, feedback: 'Good work' }
      ];

      mockMultiUserRepository.getSubmissionReviews.mockResolvedValue(mockReviews);

      const reviews = await service.getSubmissionReviews(1);

      expect(reviews).toEqual(mockReviews);
    });
  });

  describe('getSubmissionRating', () => {
    it('should calculate average rating', async () => {
      const mockReviews = [
        { id: 1, rating: 5 },
        { id: 2, rating: 4 },
        { id: 3, rating: 5 }
      ];

      mockMultiUserRepository.getSubmissionReviews.mockResolvedValue(mockReviews);

      const rating = await service.getSubmissionRating(1);

      expect(rating.averageRating).toBe(4.67);
      expect(rating.reviewCount).toBe(3);
    });

    it('should return null for unreviewed submission', async () => {
      mockMultiUserRepository.getSubmissionReviews.mockResolvedValue([]);

      const rating = await service.getSubmissionRating(1);

      expect(rating.averageRating).toBeNull();
      expect(rating.reviewCount).toBe(0);
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      mockMultiUserRepository.deleteReview.mockResolvedValue(null);

      await service.deleteReview(1);

      expect(mockMultiUserRepository.deleteReview).toHaveBeenCalledWith(1);
    });
  });

  describe('getTeamJourneys', () => {
    it('should get all team journeys', async () => {
      const mockTeamJourneys = [
        { id: 1, teamId: 1, journeyId: 1 }
      ];

      mockMultiUserRepository.findTeamJourneysForTeam.mockResolvedValue(mockTeamJourneys);
      mockJourneyRepository.findById.mockResolvedValue({
        id: 1,
        title: 'Interview Prep'
      });

      const journeys = await service.getTeamJourneys(1);

      expect(journeys.length).toBeGreaterThan(0);
      expect(journeys[0]).toHaveProperty('journey');
    });
  });
});
