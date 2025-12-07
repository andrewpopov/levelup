/**
 * Certification Service Tests
 */

import { CertificationService } from '../../services/CertificationService.js';
import eventBus from '../../core/event-bus.js';
import { CertificationIssuedEvent, BadgeEarnedEvent } from '../../core/domain-events.js';

describe('CertificationService', () => {
  let service;
  let mockCertRepository;
  let mockJourneyRepository;

  beforeEach(() => {
    eventBus.clearHistory();
    eventBus.clearListeners();

    mockCertRepository = {
      createProfile: jest.fn(),
      getProfile: jest.fn(),
      createAssessment: jest.fn(),
      updateAssessment: jest.fn(),
      getAssessments: jest.fn(),
      getAssessment: jest.fn(),
      issueCertification: jest.fn(),
      getCertification: jest.fn(),
      getCertificationById: jest.fn(),
      getCertificationByToken: jest.fn(),
      getUserCertifications: jest.fn(),
      updateCertificateUrl: jest.fn(),
      revokeCertification: jest.fn(),
      createBadge: jest.fn(),
      getBadge: jest.fn(),
      getAllBadges: jest.fn(),
      awardBadge: jest.fn(),
      getUserBadges: jest.fn(),
      hasBadge: jest.fn()
    };

    mockJourneyRepository = {
      getUserJourney: jest.fn(),
      findById: jest.fn()
    };

    service = new CertificationService({});
    service.certificationRepository = mockCertRepository;
    service.journeyRepository = mockJourneyRepository;
  });

  describe('createCompetencyProfile', () => {
    it('should create a competency profile', async () => {
      const targetSignals = [
        { name: 'leadership', targetLevel: 4 },
        { name: 'communication', targetLevel: 5 }
      ];

      mockCertRepository.getProfile.mockResolvedValue(null);
      mockCertRepository.createProfile.mockResolvedValue(1);
      mockCertRepository.createAssessment.mockResolvedValue(null);
      mockCertRepository.getAssessments.mockResolvedValue([
        { signalName: 'leadership', targetLevel: 4, currentLevel: 0 },
        { signalName: 'communication', targetLevel: 5, currentLevel: 0 }
      ]);

      const profile = await service.createCompetencyProfile(1, 1, targetSignals);

      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('assessments');
      expect(mockCertRepository.createProfile).toHaveBeenCalledWith(1, 1);
      expect(mockCertRepository.createAssessment).toHaveBeenCalledTimes(2);
    });

    it('should return existing profile if already created', async () => {
      const existingProfile = { id: 1, userId: 1, journeyId: 1 };

      mockCertRepository.getProfile.mockResolvedValue(existingProfile);
      mockCertRepository.getAssessments.mockResolvedValue([]);

      const profile = await service.createCompetencyProfile(1, 1);

      expect(profile.id).toBe(1);
      expect(mockCertRepository.createProfile).not.toHaveBeenCalled();
    });
  });

  describe('assessCompetency', () => {
    it('should assess a competency signal', async () => {
      mockCertRepository.getProfile.mockResolvedValue({ id: 1 });
      mockCertRepository.getAssessment.mockResolvedValue({
        id: 1,
        signalName: 'leadership',
        targetLevel: 5
      });

      mockCertRepository.updateAssessment.mockResolvedValue(null);
      mockCertRepository.getAssessments.mockResolvedValue([
        { signalName: 'leadership', targetLevel: 5, currentLevel: 4 }
      ]);

      const profile = await service.assessCompetency(1, 1, 'leadership', 4);

      expect(profile).toHaveProperty('assessments');
      expect(mockCertRepository.updateAssessment).toHaveBeenCalled();
    });

    it('should reject if profile not found', async () => {
      mockCertRepository.getProfile.mockResolvedValue(null);

      await expect(
        service.assessCompetency(1, 1, 'leadership', 4)
      ).rejects.toThrow('not found');
    });
  });

  describe('getSkillGaps', () => {
    it('should identify skill gaps', async () => {
      mockCertRepository.getProfile.mockResolvedValue({ id: 1 });
      mockCertRepository.getAssessments.mockResolvedValue([
        { signalName: 'leadership', targetLevel: 5, currentLevel: 2 },
        { signalName: 'communication', targetLevel: 5, currentLevel: 4 },
        { signalName: 'execution', targetLevel: 5, currentLevel: 2 }
      ]);

      const gaps = await service.getSkillGaps(1, 1);

      expect(gaps.length).toBe(2);
      expect(gaps[0].signalName).toBe('leadership');
      expect(gaps[1].signalName).toBe('execution');
    });

    it('should return empty array if no gaps', async () => {
      mockCertRepository.getProfile.mockResolvedValue({ id: 1 });
      mockCertRepository.getAssessments.mockResolvedValue([
        { signalName: 'leadership', targetLevel: 5, currentLevel: 5 }
      ]);

      const gaps = await service.getSkillGaps(1, 1);

      expect(gaps.length).toBe(0);
    });
  });

  describe('issueCertification', () => {
    it('should issue a certification on journey completion', async () => {
      mockJourneyRepository.getUserJourney.mockResolvedValue({
        id: 1,
        userId: 1,
        journeyId: 1,
        status: 'completed'
      });

      mockJourneyRepository.findById.mockResolvedValue({
        id: 1,
        title: 'Interview Prep'
      });

      mockCertRepository.getCertification.mockResolvedValue(null);
      mockCertRepository.issueCertification.mockResolvedValue({
        id: 1,
        shareableToken: 'abc123xyz'
      });

      mockCertRepository.getCertificationById.mockResolvedValue({
        id: 1,
        userId: 1,
        journeyId: 1,
        shareableToken: 'abc123xyz'
      });

      const publishSpy = jest.spyOn(eventBus, 'publish');

      const cert = await service.issueCertification(1, 1);

      expect(cert).toHaveProperty('shareableToken');
      expect(publishSpy).toHaveBeenCalled();

      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(CertificationIssuedEvent);
    });

    it('should reject if journey not completed', async () => {
      mockJourneyRepository.getUserJourney.mockResolvedValue({
        id: 1,
        status: 'active'
      });

      await expect(
        service.issueCertification(1, 1)
      ).rejects.toThrow('must be completed');
    });

    it('should not re-issue if already issued', async () => {
      mockJourneyRepository.getUserJourney.mockResolvedValue({
        id: 1,
        status: 'completed'
      });

      mockJourneyRepository.findById.mockResolvedValue({ id: 1 });

      mockCertRepository.getCertification.mockResolvedValue({
        id: 1,
        shareableToken: 'existing-token'
      });

      const publishSpy = jest.spyOn(eventBus, 'publish');

      const cert = await service.issueCertification(1, 1);

      expect(cert.shareableToken).toBe('existing-token');
      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  describe('getCertification', () => {
    it('should retrieve user certification', async () => {
      const mockCert = {
        id: 1,
        userId: 1,
        journeyId: 1,
        shareableToken: 'abc123'
      };

      mockCertRepository.getCertification.mockResolvedValue(mockCert);

      const cert = await service.getCertification(1, 1);

      expect(cert).toEqual(mockCert);
    });
  });

  describe('getPublicCertification', () => {
    it('should retrieve public certificate by token', async () => {
      const mockCert = {
        id: 1,
        userId: 1,
        shareableToken: 'abc123'
      };

      mockCertRepository.getCertificationByToken.mockResolvedValue(mockCert);

      const cert = await service.getPublicCertification('abc123');

      expect(cert).toEqual(mockCert);
    });

    it('should reject invalid token', async () => {
      mockCertRepository.getCertificationByToken.mockResolvedValue(null);

      await expect(
        service.getPublicCertification('invalid-token')
      ).rejects.toThrow('not found');
    });
  });

  describe('createBadge', () => {
    it('should create a new badge', async () => {
      mockCertRepository.createBadge.mockResolvedValue(1);

      const badgeId = await service.createBadge(
        'Interview Master',
        'https://example.com/badge.png',
        'Completed all interview questions',
        { completedStories: 5 }
      );

      expect(badgeId).toBe(1);
      expect(mockCertRepository.createBadge).toHaveBeenCalledWith(
        'Interview Master',
        'https://example.com/badge.png',
        'Completed all interview questions',
        { completedStories: 5 }
      );
    });

    it('should reject if badge name not provided', async () => {
      await expect(
        service.createBadge('', 'url', 'desc', {})
      ).rejects.toThrow('name is required');
    });
  });

  describe('awardBadge', () => {
    it('should award a badge to user', async () => {
      const mockBadge = { id: 1, badgeName: 'Interview Master' };

      mockCertRepository.getBadge.mockResolvedValue(mockBadge);
      mockCertRepository.hasBadge.mockResolvedValue(false);
      mockCertRepository.awardBadge.mockResolvedValue(null);

      const publishSpy = jest.spyOn(eventBus, 'publish');

      const badge = await service.awardBadge(1, 1);

      expect(badge).toEqual(mockBadge);
      expect(publishSpy).toHaveBeenCalled();

      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(BadgeEarnedEvent);
      expect(event.badgeName).toBe('Interview Master');
    });

    it('should reject if badge not found', async () => {
      mockCertRepository.getBadge.mockResolvedValue(null);

      await expect(
        service.awardBadge(1, 999)
      ).rejects.toThrow('not found');
    });

    it('should reject if user already has badge', async () => {
      mockCertRepository.getBadge.mockResolvedValue({ id: 1 });
      mockCertRepository.hasBadge.mockResolvedValue(true);

      await expect(
        service.awardBadge(1, 1)
      ).rejects.toThrow('already has this badge');
    });
  });

  describe('getUserBadges', () => {
    it('should retrieve user badges', async () => {
      const mockBadges = [
        { id: 1, badgeName: 'Interview Master', earnedAt: '2024-01-01' },
        { id: 2, badgeName: 'Story Teller', earnedAt: '2024-01-15' }
      ];

      mockCertRepository.getUserBadges.mockResolvedValue(mockBadges);

      const badges = await service.getUserBadges(1);

      expect(badges).toEqual(mockBadges);
    });
  });

  describe('getCompetencyReport', () => {
    it('should generate comprehensive competency report', async () => {
      const mockProfile = {
        id: 1,
        assessments: [
          { signalName: 'leadership', currentLevel: 4, targetLevel: 5 },
          { signalName: 'communication', currentLevel: 5, targetLevel: 5 },
          { signalName: 'execution', currentLevel: 2, targetLevel: 5 }
        ]
      };

      mockCertRepository.getProfile.mockResolvedValue(mockProfile);
      mockCertRepository.getAssessments.mockResolvedValue(mockProfile.assessments);
      mockCertRepository.getCertification.mockResolvedValue({
        id: 1,
        shareableToken: 'abc123'
      });

      mockCertRepository.getUserBadges.mockResolvedValue([
        { id: 1, badgeName: 'Story Teller' }
      ]);

      const report = await service.getCompetencyReport(1, 1);

      expect(report).toHaveProperty('profile');
      expect(report).toHaveProperty('overallCompetencyScore');
      expect(report).toHaveProperty('skillGaps');
      expect(report).toHaveProperty('certification');
      expect(report).toHaveProperty('badges');
      expect(report).toHaveProperty('readinesPercentage');

      expect(report.overallCompetencyScore).toBe(3.67);
      expect(report.skillGapsCount).toBe(1);
    });

    it('should calculate interview readiness correctly', async () => {
      const mockProfile = {
        id: 1,
        assessments: [
          { signalName: 'leadership', currentLevel: 4 },
          { signalName: 'communication', currentLevel: 5 },
          { signalName: 'execution', currentLevel: 2 },
          { signalName: 'learning', currentLevel: 3 }
        ]
      };

      mockCertRepository.getProfile.mockResolvedValue(mockProfile);
      mockCertRepository.getAssessments.mockResolvedValue(mockProfile.assessments);
      mockCertRepository.getCertification.mockResolvedValue(null);
      mockCertRepository.getUserBadges.mockResolvedValue([]);

      const report = await service.getCompetencyReport(1, 1);

      // 3 out of 4 signals are at level 3 or above
      expect(report.readinesPercentage).toBe(75);
    });
  });

  describe('revokeCertification', () => {
    it('should revoke a certification', async () => {
      mockCertRepository.revokeCertification.mockResolvedValue(null);

      await service.revokeCertification(1);

      expect(mockCertRepository.revokeCertification).toHaveBeenCalledWith(1);
    });
  });

  describe('getAllBadges', () => {
    it('should retrieve all badges', async () => {
      const mockBadges = [
        { id: 1, badgeName: 'Badge 1' },
        { id: 2, badgeName: 'Badge 2' }
      ];

      mockCertRepository.getAllBadges.mockResolvedValue(mockBadges);

      const badges = await service.getAllBadges();

      expect(badges).toEqual(mockBadges);
    });
  });
});
