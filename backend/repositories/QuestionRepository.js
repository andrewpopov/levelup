/**
 * Question Repository - Manages Question and Response aggregates
 */

import { BaseRepository } from './BaseRepository.js';

export class QuestionRepository extends BaseRepository {
  async findById(questionId) {
    const question = await this.get(
      `SELECT id, category_id as categoryId, week_number as weekNumber,
              title, main_prompt as mainPrompt, created_at FROM questions WHERE id = ?`,
      [questionId]
    );

    if (!question) return null;

    const details = await this.all(
      'SELECT id, detail_text as detailText, display_order as displayOrder FROM question_details WHERE question_id = ? ORDER BY display_order',
      [questionId]
    );

    return {
      ...question,
      details
    };
  }

  async findByCategory(categoryId) {
    return this.all(
      `SELECT id, category_id as categoryId, week_number as weekNumber,
              title, main_prompt as mainPrompt, created_at FROM questions
       WHERE category_id = ? ORDER BY week_number`,
      [categoryId]
    );
  }

  async findByWeek(weekNumber) {
    return this.get(
      `SELECT id, category_id as categoryId, week_number as weekNumber,
              title, main_prompt as mainPrompt, created_at FROM questions
       WHERE week_number = ?`,
      [weekNumber]
    );
  }

  async getAll() {
    return this.all(
      `SELECT id, category_id as categoryId, week_number as weekNumber,
              title, main_prompt as mainPrompt, created_at FROM questions
       ORDER BY week_number`
    );
  }

  // ============= RESPONSE MANAGEMENT =============

  async saveResponse(questionId, userId, responseText) {
    // Check if response already exists
    const existing = await this.get(
      'SELECT id FROM question_responses WHERE question_id = ? AND user_id = ?',
      [questionId, userId]
    );

    if (existing) {
      // Update existing
      await this.run(
        'UPDATE question_responses SET response_text = ?, updated_at = CURRENT_TIMESTAMP WHERE question_id = ? AND user_id = ?',
        [responseText, questionId, userId]
      );
      return existing.id;
    } else {
      // Create new
      const result = await this.run(
        'INSERT INTO question_responses (question_id, user_id, response_text) VALUES (?, ?, ?)',
        [questionId, userId, responseText]
      );
      return result.lastID;
    }
  }

  async getResponse(questionId, userId) {
    return this.get(
      'SELECT id, response_text as responseText, created_at, updated_at FROM question_responses WHERE question_id = ? AND user_id = ?',
      [questionId, userId]
    );
  }

  async getResponses(questionId) {
    return this.all(
      'SELECT id, user_id as userId, response_text as responseText, created_at FROM question_responses WHERE question_id = ?',
      [questionId]
    );
  }

  async deleteResponse(responseId) {
    await this.run(
      'DELETE FROM question_responses WHERE id = ?',
      [responseId]
    );
  }

  // ============= DISCUSSION MANAGEMENT =============

  async recordDiscussion(questionId, discussionNotes) {
    const existing = await this.get(
      'SELECT id FROM question_discussions WHERE question_id = ?',
      [questionId]
    );

    if (existing) {
      await this.run(
        'UPDATE question_discussions SET discussed_at = CURRENT_TIMESTAMP, joint_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE question_id = ?',
        [discussionNotes, questionId]
      );
      return existing.id;
    } else {
      const result = await this.run(
        'INSERT INTO question_discussions (question_id, discussed_at, joint_notes) VALUES (?, CURRENT_TIMESTAMP, ?)',
        [questionId, discussionNotes]
      );
      return result.lastID;
    }
  }

  async getDiscussion(questionId) {
    return this.get(
      'SELECT id, discussed_at as discussedAt, joint_notes as jointNotes, created_at FROM question_discussions WHERE question_id = ?',
      [questionId]
    );
  }

  async deleteDiscussion(questionId) {
    await this.run(
      'DELETE FROM question_discussions WHERE question_id = ?',
      [questionId]
    );
  }
}
