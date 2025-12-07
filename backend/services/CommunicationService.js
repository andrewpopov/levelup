/**
 * Communication Service - Question-based learning and couple coordination
 */

import { QuestionRepository } from '../repositories/QuestionRepository.js';
import eventBus from '../core/event-bus.js';
import {
  ResponseSubmittedEvent,
  DiscussionRecordedEvent
} from '../core/domain-events.js';

export class CommunicationService {
  constructor(db) {
    this.questionRepository = new QuestionRepository(db);
  }

  /**
   * Get all questions with details
   */
  async getAllQuestions() {
    const questions = await this.questionRepository.getAll();

    // Enrich with details
    return Promise.all(
      questions.map(async (q) => {
        const details = await this.questionRepository.all(
          'SELECT id, detail_text as detailText, display_order as displayOrder FROM question_details WHERE question_id = ? ORDER BY display_order',
          [q.id]
        );
        return { ...q, details };
      })
    );
  }

  /**
   * Get question by ID with all details
   */
  async getQuestion(questionId) {
    return this.questionRepository.findById(questionId);
  }

  /**
   * Get questions by category
   */
  async getQuestionsByCategory(categoryId) {
    return this.questionRepository.findByCategory(categoryId);
  }

  /**
   * Get question of the week (cycling through weeks)
   */
  async getQuestionOfTheWeek() {
    const weekNumber = ((Math.floor(Date.now() / 1000 / 60 / 60 / 24 / 7)) % 32) + 1;
    return this.questionRepository.findByWeek(weekNumber);
  }

  /**
   * Submit or update a response to a question
   */
  async submitResponse(questionId, userId, responseText) {
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Response cannot be empty');
    }

    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    try {
      const responseId = await this.questionRepository.saveResponse(
        questionId,
        userId,
        responseText
      );

      // Publish domain event
      await eventBus.publish(
        new ResponseSubmittedEvent(responseId, null, questionId, userId, 'text')
      );

      return {
        id: responseId,
        questionId,
        userId,
        responseText,
        createdAt: new Date()
      };
    } catch (err) {
      throw new Error(`Failed to save response: ${err.message}`);
    }
  }

  /**
   * Get user's response to a question
   */
  async getUserResponse(questionId, userId) {
    return this.questionRepository.getResponse(questionId, userId);
  }

  /**
   * Get all responses to a question
   */
  async getQuestionResponses(questionId) {
    return this.questionRepository.getResponses(questionId);
  }

  /**
   * Delete a response
   */
  async deleteResponse(responseId) {
    await this.questionRepository.deleteResponse(responseId);
  }

  /**
   * Record discussion (mark as discussed with notes)
   */
  async recordDiscussion(questionId, discussionNotes) {
    if (!discussionNotes || discussionNotes.trim().length === 0) {
      throw new Error('Discussion notes cannot be empty');
    }

    try {
      const discussionId = await this.questionRepository.recordDiscussion(
        questionId,
        discussionNotes
      );

      // Publish domain event
      await eventBus.publish(
        new DiscussionRecordedEvent(null, questionId, discussionId)
      );

      return {
        id: discussionId,
        questionId,
        discussionNotes,
        discussedAt: new Date()
      };
    } catch (err) {
      throw new Error(`Failed to record discussion: ${err.message}`);
    }
  }

  /**
   * Get discussion for a question
   */
  async getDiscussion(questionId) {
    return this.questionRepository.getDiscussion(questionId);
  }

  /**
   * Check if both users have responded to a question
   */
  async checkSessionStatus(questionId, userId1, userId2) {
    const responses = await this.questionRepository.getResponses(questionId);

    const user1Responded = responses.some(r => r.userId === userId1);
    const user2Responded = responses.some(r => r.userId === userId2);
    const discussion = await this.questionRepository.getDiscussion(questionId);

    return {
      questionId,
      user1Responded,
      user2Responded,
      bothResponded: user1Responded && user2Responded,
      discussed: !!discussion,
      discussionNotes: discussion?.jointNotes || null
    };
  }
}
