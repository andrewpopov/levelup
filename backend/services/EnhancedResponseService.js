/**
 * Enhanced Response Service - Media-rich responses and follow-ups
 */

import { EnhancedResponseRepository } from '../repositories/EnhancedResponseRepository.js';
import { QuestionRepository } from '../repositories/QuestionRepository.js';
import eventBus from '../core/event-bus.js';
import { ResponseSubmittedEvent } from '../core/domain-events.js';

export class EnhancedResponseService {
  constructor(db) {
    this.enhancedRepository = new EnhancedResponseRepository(db);
    this.questionRepository = new QuestionRepository(db);
  }

  // ============= MEDIA RESPONSES =============

  /**
   * Submit a media response (voice, video, image)
   */
  async submitMediaResponse(responseId, responseType, mediaUrl, transcription = null) {
    // Validate response type
    const validTypes = ['text', 'voice', 'video', 'image'];
    if (!validTypes.includes(responseType)) {
      throw new Error(`Response type must be one of: ${validTypes.join(', ')}`);
    }

    if (!mediaUrl) {
      throw new Error('Media URL is required for media responses');
    }

    // Check if enhanced response already exists
    const existing = await this.enhancedRepository.getEnhancedResponse(responseId);

    if (existing) {
      // Update
      await this.enhancedRepository.updateEnhancedResponse(
        existing.id,
        responseType,
        mediaUrl,
        transcription
      );
      return existing.id;
    } else {
      // Create new
      const enhancedId = await this.enhancedRepository.createEnhancedResponse(
        responseId,
        responseType,
        mediaUrl,
        transcription
      );

      // Get the original response to publish event
      const response = await this.questionRepository.get(
        'SELECT question_id, user_id FROM question_responses WHERE id = ?',
        [responseId]
      );

      // Publish event with media type
      if (response) {
        await eventBus.publish(
          new ResponseSubmittedEvent(responseId, null, response.question_id, response.user_id, responseType)
        );
      }

      return enhancedId;
    }
  }

  /**
   * Get enhanced response with media details
   */
  async getMediaResponse(responseId) {
    return this.enhancedRepository.getEnhancedResponse(responseId);
  }

  /**
   * Transcribe voice/video response (returns existing transcription or placeholder)
   */
  async getTranscription(responseId) {
    const enhanced = await this.enhancedRepository.getEnhancedResponse(responseId);

    if (!enhanced) {
      return null;
    }

    if (enhanced.transcription) {
      return enhanced.transcription;
    }

    if (['voice', 'video'].includes(enhanced.responseType)) {
      // In production, would call speech-to-text API here
      // For now, return a placeholder
      return {
        status: 'pending',
        estimatedTime: '30 seconds'
      };
    }

    return null;
  }

  // ============= FOLLOW-UP QUESTIONS =============

  /**
   * Ask a follow-up question on a response
   */
  async askFollowup(responseId, followupText, askedBy) {
    if (!followupText || followupText.trim().length === 0) {
      throw new Error('Follow-up question cannot be empty');
    }

    // Validate response exists
    const response = await this.questionRepository.get(
      'SELECT id FROM question_responses WHERE id = ?',
      [responseId]
    );

    if (!response) {
      throw new Error('Response not found');
    }

    const followupId = await this.enhancedRepository.createFollowup(
      responseId,
      followupText,
      askedBy
    );

    return {
      id: followupId,
      responseId,
      followupText,
      askedBy,
      createdAt: new Date()
    };
  }

  /**
   * Get all follow-ups for a response
   */
  async getFollowups(responseId) {
    return this.enhancedRepository.getFollowups(responseId);
  }

  /**
   * Answer a follow-up question
   */
  async answerFollowup(followupId, followupResponse) {
    if (!followupResponse || followupResponse.trim().length === 0) {
      throw new Error('Follow-up response cannot be empty');
    }

    await this.enhancedRepository.answerFollowup(followupId, followupResponse);

    return {
      followupId,
      followupResponse,
      answeredAt: new Date()
    };
  }

  /**
   * Get unanswered follow-ups for a user
   */
  async getUnansweredFollowups(userId) {
    return this.enhancedRepository.getUnansweredFollowups(userId);
  }

  /**
   * Delete follow-up (only if unanswered)
   */
  async deleteFollowup(followupId) {
    const followup = await this.enhancedRepository.get(
      'SELECT followup_response FROM response_followups WHERE id = ?',
      [followupId]
    );

    if (followup && followup.followup_response) {
      throw new Error('Cannot delete answered follow-ups');
    }

    await this.enhancedRepository.deleteFollowup(followupId);
  }

  // ============= CONVERSATION SUMMARY =============

  /**
   * Get full conversation thread for a response
   */
  async getConversationThread(responseId) {
    // Get base response
    const response = await this.questionRepository.get(
      'SELECT id, question_id, user_id, response_text, created_at FROM question_responses WHERE id = ?',
      [responseId]
    );

    if (!response) {
      throw new Error('Response not found');
    }

    // Get enhanced details
    const enhanced = await this.enhancedRepository.getEnhancedResponse(responseId);

    // Get all follow-ups
    const followups = await this.enhancedRepository.getFollowups(responseId);

    return {
      response: {
        ...response,
        enhanced: enhanced ? {
          type: enhanced.responseType,
          mediaUrl: enhanced.mediaUrl,
          transcription: enhanced.transcription
        } : null
      },
      followups,
      totalFollowups: followups.length,
      answeredFollowups: followups.filter(f => f.followupResponse).length
    };
  }

  /**
   * Get conversation insights (summary of themes)
   */
  async getConversationInsights(questionId) {
    const responses = await this.questionRepository.getResponses(questionId);

    const insights = {
      questionId,
      totalResponses: responses.length,
      responseTypes: {},
      followupSummary: {
        total: 0,
        answered: 0,
        unanswered: 0
      }
    };

    // Count response types
    for (const response of responses) {
      const enhanced = await this.enhancedRepository.getEnhancedResponse(response.id);
      const type = enhanced ? enhanced.responseType : 'text';
      insights.responseTypes[type] = (insights.responseTypes[type] || 0) + 1;

      // Count follow-ups
      const followups = await this.enhancedRepository.getFollowups(response.id);
      insights.followupSummary.total += followups.length;
      insights.followupSummary.answered += followups.filter(f => f.followupResponse).length;
      insights.followupSummary.unanswered += followups.filter(f => !f.followupResponse).length;
    }

    return insights;
  }
}
