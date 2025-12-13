/**
 * Enhanced Response Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EnhancedResponseService } from '../../services/EnhancedResponseService.js';
import eventBus from '../../core/event-bus.js';
import { ResponseSubmittedEvent } from '../../core/domain-events.js';

describe('EnhancedResponseService', () => {
  let service;
  let mockEnhancedRepository;
  let mockQuestionRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    if (eventBus.clearHistory) eventBus.clearHistory();
    if (eventBus.clearListeners) eventBus.clearListeners();

    mockEnhancedRepository = {
      createEnhancedResponse: jest.fn(),
      getEnhancedResponse: jest.fn(),
      updateEnhancedResponse: jest.fn(),
      createFollowup: jest.fn(),
      getFollowups: jest.fn(),
      answerFollowup: jest.fn(),
      deleteFollowup: jest.fn(),
      getUnansweredFollowups: jest.fn(),
      get: jest.fn()
    };

    mockQuestionRepository = {
      get: jest.fn(),
      saveResponse: jest.fn(),
      getResponses: jest.fn()
    };

    service = new EnhancedResponseService({});
    service.enhancedRepository = mockEnhancedRepository;
    service.questionRepository = mockQuestionRepository;
  });

  describe('submitMediaResponse', () => {
    it('should submit a media response (voice)', async () => {
      const mockQuestion = {
        id: 1,
        user_id: 2
      };

      mockQuestionRepository.get.mockResolvedValue(mockQuestion);
      mockEnhancedRepository.getEnhancedResponse.mockResolvedValue(null);
      mockEnhancedRepository.createEnhancedResponse.mockResolvedValue(1);

      const publishSpy = jest.spyOn(eventBus, 'publish');

      const result = await service.submitMediaResponse(
        1,
        'voice',
        'https://example.com/voice.mp3',
        'Transcribed text...'
      );

      expect(result).toBe(1);
      expect(mockEnhancedRepository.createEnhancedResponse).toHaveBeenCalledWith(
        1,
        'voice',
        'https://example.com/voice.mp3',
        'Transcribed text...'
      );
      expect(publishSpy).toHaveBeenCalled();
    });

    it('should support video response type', async () => {
      mockQuestionRepository.get.mockResolvedValue({ id: 1, user_id: 2 });
      mockEnhancedRepository.getEnhancedResponse.mockResolvedValue(null);
      mockEnhancedRepository.createEnhancedResponse.mockResolvedValue(1);

      await service.submitMediaResponse(1, 'video', 'https://example.com/video.mp4');

      expect(mockEnhancedRepository.createEnhancedResponse).toHaveBeenCalledWith(
        1,
        'video',
        'https://example.com/video.mp4',
        null
      );
    });

    it('should reject invalid response type', async () => {
      await expect(
        service.submitMediaResponse(1, 'invalid-type', 'https://example.com/file')
      ).rejects.toThrow('Response type must be');
    });

    it('should reject missing media URL', async () => {
      await expect(
        service.submitMediaResponse(1, 'voice', null)
      ).rejects.toThrow('Media URL is required');
    });

    it('should update existing enhanced response', async () => {
      const existing = { id: 1, responseType: 'text' };

      mockEnhancedRepository.getEnhancedResponse.mockResolvedValue(existing);
      mockEnhancedRepository.updateEnhancedResponse.mockResolvedValue(null);

      const result = await service.submitMediaResponse(1, 'voice', 'https://example.com/audio');

      expect(mockEnhancedRepository.updateEnhancedResponse).toHaveBeenCalledWith(
        existing.id,
        'voice',
        'https://example.com/audio',
        null
      );
    });
  });

  describe('askFollowup', () => {
    it('should ask a follow-up question', async () => {
      mockQuestionRepository.get.mockResolvedValue({ id: 1 });
      mockEnhancedRepository.createFollowup.mockResolvedValue(1);

      const result = await service.askFollowup(
        1,
        'Can you elaborate on that?',
        2
      );

      expect(result).toEqual({
        id: 1,
        responseId: 1,
        followupText: 'Can you elaborate on that?',
        askedBy: 2,
        createdAt: expect.any(Date)
      });

      expect(mockEnhancedRepository.createFollowup).toHaveBeenCalledWith(
        1,
        'Can you elaborate on that?',
        2
      );
    });

    it('should reject empty follow-up text', async () => {
      await expect(
        service.askFollowup(1, '', 2)
      ).rejects.toThrow('cannot be empty');
    });

    it('should reject if response not found', async () => {
      mockQuestionRepository.get.mockResolvedValue(null);

      await expect(
        service.askFollowup(999, 'Question?', 2)
      ).rejects.toThrow('not found');
    });
  });

  describe('answerFollowup', () => {
    it('should answer a follow-up question', async () => {
      mockEnhancedRepository.answerFollowup.mockResolvedValue(null);

      const result = await service.answerFollowup(1, 'Yes, here is more detail...');

      expect(result).toEqual({
        followupId: 1,
        followupResponse: 'Yes, here is more detail...',
        answeredAt: expect.any(Date)
      });

      expect(mockEnhancedRepository.answerFollowup).toHaveBeenCalledWith(
        1,
        'Yes, here is more detail...'
      );
    });

    it('should reject empty answer', async () => {
      await expect(
        service.answerFollowup(1, '')
      ).rejects.toThrow('cannot be empty');
    });
  });

  describe('getFollowups', () => {
    it('should retrieve all follow-ups for a response', async () => {
      const mockFollowups = [
        { id: 1, followupText: 'Question 1?', followupResponse: null },
        { id: 2, followupText: 'Question 2?', followupResponse: 'Answer' }
      ];

      mockEnhancedRepository.getFollowups.mockResolvedValue(mockFollowups);

      const followups = await service.getFollowups(1);

      expect(followups).toEqual(mockFollowups);
      expect(mockEnhancedRepository.getFollowups).toHaveBeenCalledWith(1);
    });
  });

  describe('getUnansweredFollowups', () => {
    it('should get pending follow-ups for user', async () => {
      const mockFollowups = [
        {
          id: 1,
          responseId: 1,
          followupText: 'Can you clarify?',
          askedBy: 2,
          respondentId: 1,
          questionId: 1
        }
      ];

      mockEnhancedRepository.getUnansweredFollowups.mockResolvedValue(mockFollowups);

      const followups = await service.getUnansweredFollowups(1);

      expect(followups).toEqual(mockFollowups);
    });
  });

  describe('deleteFollowup', () => {
    it('should delete an unanswered follow-up', async () => {
      mockEnhancedRepository.get.mockResolvedValue({ followup_response: null });
      mockEnhancedRepository.deleteFollowup.mockResolvedValue(null);

      await service.deleteFollowup(1);

      expect(mockEnhancedRepository.deleteFollowup).toHaveBeenCalledWith(1);
    });

    it('should reject deleting answered follow-ups', async () => {
      mockEnhancedRepository.get.mockResolvedValue({ followup_response: 'Answer' });

      await expect(
        service.deleteFollowup(1)
      ).rejects.toThrow('Cannot delete answered');
    });
  });

  describe('getConversationThread', () => {
    it('should get full conversation with follow-ups', async () => {
      const mockResponse = {
        id: 1,
        question_id: 1,
        user_id: 2,
        response_text: 'My response',
        created_at: '2024-01-01'
      };

      const mockEnhanced = {
        responseType: 'voice',
        mediaUrl: 'https://example.com/audio.mp3',
        transcription: 'Transcribed...'
      };

      const mockFollowups = [
        { id: 1, followupText: 'Q1?', followupResponse: 'A1' },
        { id: 2, followupText: 'Q2?', followupResponse: null }
      ];

      mockQuestionRepository.get.mockResolvedValue(mockResponse);
      mockEnhancedRepository.getEnhancedResponse.mockResolvedValue(mockEnhanced);
      mockEnhancedRepository.getFollowups.mockResolvedValue(mockFollowups);

      const thread = await service.getConversationThread(1);

      expect(thread).toHaveProperty('response');
      expect(thread).toHaveProperty('followups');
      expect(thread.totalFollowups).toBe(2);
      expect(thread.answeredFollowups).toBe(1);
    });
  });

  describe('getConversationInsights', () => {
    it('should analyze conversation patterns', async () => {
      const mockResponses = [
        { id: 1, responseText: 'Response 1' },
        { id: 2, responseText: 'Response 2' }
      ];

      mockQuestionRepository.getResponses.mockResolvedValue(mockResponses);
      mockEnhancedRepository.getEnhancedResponse
        .mockResolvedValueOnce({ responseType: 'text' })
        .mockResolvedValueOnce({ responseType: 'voice' });

      mockEnhancedRepository.getFollowups
        .mockResolvedValueOnce([
          { followupResponse: null },
          { followupResponse: 'Answer' }
        ])
        .mockResolvedValueOnce([
          { followupResponse: 'Answer' }
        ]);

      const insights = await service.getConversationInsights(1);

      expect(insights).toHaveProperty('questionId');
      expect(insights).toHaveProperty('totalResponses');
      expect(insights).toHaveProperty('responseTypes');
      expect(insights).toHaveProperty('followupSummary');
      expect(insights.followupSummary.total).toBe(3);
      expect(insights.followupSummary.answered).toBe(2);
    });
  });

  describe('getTranscription', () => {
    it('should retrieve transcription if available', async () => {
      const mockEnhanced = {
        responseType: 'voice',
        transcription: 'Here is the transcribed text...'
      };

      mockEnhancedRepository.getEnhancedResponse.mockResolvedValue(mockEnhanced);

      const transcription = await service.getTranscription(1);

      expect(transcription).toBe('Here is the transcribed text...');
    });

    it('should return pending status for voice without transcription', async () => {
      const mockEnhanced = {
        responseType: 'voice',
        transcription: null
      };

      mockEnhancedRepository.getEnhancedResponse.mockResolvedValue(mockEnhanced);

      const transcription = await service.getTranscription(1);

      expect(transcription).toHaveProperty('status', 'pending');
    });
  });
});
