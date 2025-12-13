/**
 * Communication Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CommunicationService } from '../../services/CommunicationService.js';
import eventBus from '../../core/event-bus.js';
import { ResponseSubmittedEvent, DiscussionRecordedEvent } from '../../core/domain-events.js';

describe('CommunicationService', () => {
  let service;
  let mockQuestionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    if (eventBus.clearHistory) eventBus.clearHistory();
    if (eventBus.clearListeners) eventBus.clearListeners();

    mockQuestionRepository = {
      findById: jest.fn(),
      getAll: jest.fn(),
      findByCategory: jest.fn(),
      findByWeek: jest.fn(),
      saveResponse: jest.fn(),
      getResponse: jest.fn(),
      getResponses: jest.fn(),
      recordDiscussion: jest.fn(),
      getDiscussion: jest.fn(),
      deleteResponse: jest.fn()
    };

    service = new CommunicationService({});
    service.questionRepository = mockQuestionRepository;
  });

  describe('submitResponse', () => {
    it('should submit a response to a question', async () => {
      mockQuestionRepository.findById.mockResolvedValue({
        id: 1,
        title: 'What is your biggest strength?',
        mainPrompt: 'Tell us about your biggest strength'
      });

      mockQuestionRepository.saveResponse.mockResolvedValue(1);

      const result = await service.submitResponse(1, 2, 'My biggest strength is leadership');

      expect(result).toEqual({
        id: 1,
        questionId: 1,
        userId: 2,
        responseText: 'My biggest strength is leadership',
        createdAt: expect.any(Date)
      });

      expect(mockQuestionRepository.saveResponse).toHaveBeenCalledWith(
        1,
        2,
        'My biggest strength is leadership'
      );
    });

    it('should publish ResponseSubmittedEvent', async () => {
      mockQuestionRepository.findById.mockResolvedValue({ id: 1, title: 'Q1' });
      mockQuestionRepository.saveResponse.mockResolvedValue(1);
      const publishSpy = jest.spyOn(eventBus, 'publish');

      await service.submitResponse(1, 2, 'Response text');

      expect(publishSpy).toHaveBeenCalled();
      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(ResponseSubmittedEvent);
      expect(event.responseId).toBe(1);
      expect(event.userId).toBe(2);
    });

    it('should reject empty response', async () => {
      await expect(
        service.submitResponse(1, 2, '')
      ).rejects.toThrow('cannot be empty');
    });

    it('should reject if question not found', async () => {
      mockQuestionRepository.findById.mockResolvedValue(null);

      await expect(
        service.submitResponse(999, 2, 'Response')
      ).rejects.toThrow('not found');
    });
  });

  describe('getQuestion', () => {
    it('should retrieve question with details', async () => {
      const mockQuestion = {
        id: 1,
        title: 'Question Title',
        details: [
          { id: 1, detailText: 'Follow-up 1' },
          { id: 2, detailText: 'Follow-up 2' }
        ]
      };

      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);

      const question = await service.getQuestion(1);

      expect(question).toEqual(mockQuestion);
    });
  });

  describe('recordDiscussion', () => {
    it('should record a discussion', async () => {
      mockQuestionRepository.recordDiscussion.mockResolvedValue(1);

      const result = await service.recordDiscussion(1, 'We both agreed on the topic');

      expect(result).toEqual({
        id: 1,
        questionId: 1,
        discussionNotes: 'We both agreed on the topic',
        discussedAt: expect.any(Date)
      });

      expect(mockQuestionRepository.recordDiscussion).toHaveBeenCalledWith(
        1,
        'We both agreed on the topic'
      );
    });

    it('should publish DiscussionRecordedEvent', async () => {
      mockQuestionRepository.recordDiscussion.mockResolvedValue(1);
      const publishSpy = jest.spyOn(eventBus, 'publish');

      await service.recordDiscussion(1, 'Notes');

      expect(publishSpy).toHaveBeenCalled();
      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(DiscussionRecordedEvent);
    });

    it('should reject empty discussion notes', async () => {
      await expect(
        service.recordDiscussion(1, '')
      ).rejects.toThrow('cannot be empty');
    });
  });

  describe('checkSessionStatus', () => {
    it('should check if both users have responded', async () => {
      mockQuestionRepository.getResponses.mockResolvedValue([
        { userId: 1, responseText: 'Response 1' },
        { userId: 2, responseText: 'Response 2' }
      ]);

      mockQuestionRepository.getDiscussion.mockResolvedValue({
        jointNotes: 'Discussed'
      });

      const status = await service.checkSessionStatus(1, 1, 2);

      expect(status).toEqual({
        questionId: 1,
        user1Responded: true,
        user2Responded: true,
        bothResponded: true,
        discussed: true,
        discussionNotes: 'Discussed'
      });
    });

    it('should handle case where only one user responded', async () => {
      mockQuestionRepository.getResponses.mockResolvedValue([
        { userId: 1, responseText: 'Response 1' }
      ]);

      mockQuestionRepository.getDiscussion.mockResolvedValue(null);

      const status = await service.checkSessionStatus(1, 1, 2);

      expect(status.bothResponded).toBe(false);
      expect(status.user1Responded).toBe(true);
      expect(status.user2Responded).toBe(false);
    });
  });

  describe('getQuestionOfTheWeek', () => {
    it('should retrieve question for current week', async () => {
      const mockQuestion = { id: 1, weekNumber: 1 };
      mockQuestionRepository.findByWeek.mockResolvedValue(mockQuestion);

      const question = await service.getQuestionOfTheWeek();

      expect(question).toBeDefined();
      expect(mockQuestionRepository.findByWeek).toHaveBeenCalled();
    });
  });

  describe('getAllQuestions', () => {
    it('should retrieve all questions', async () => {
      const mockQuestions = [
        { id: 1, title: 'Q1', details: [] },
        { id: 2, title: 'Q2', details: [] }
      ];

      mockQuestionRepository.getAll.mockResolvedValue(mockQuestions);
      mockQuestionRepository.all = jest.fn().mockResolvedValue([]);

      const questions = await service.getAllQuestions();

      expect(questions.length).toBeGreaterThan(0);
    });
  });
});
