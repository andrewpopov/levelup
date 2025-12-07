/**
 * Enhanced Response Repository - Media-rich responses with follow-ups
 */

import { BaseRepository } from './BaseRepository.js';

export class EnhancedResponseRepository extends BaseRepository {
  // ============= ENHANCED RESPONSE MANAGEMENT =============

  async createEnhancedResponse(responseId, responseType, mediaUrl, transcription) {
    const result = await this.run(
      `INSERT INTO enhanced_question_responses (response_id, response_type, media_url, transcription)
       VALUES (?, ?, ?, ?)`,
      [responseId, responseType, mediaUrl, transcription]
    );
    return result.lastID;
  }

  async getEnhancedResponse(responseId) {
    return this.get(
      `SELECT id, response_id as responseId, response_type as responseType, media_url as mediaUrl,
              transcription, created_at FROM enhanced_question_responses WHERE response_id = ?`,
      [responseId]
    );
  }

  async updateEnhancedResponse(enhancedResponseId, responseType, mediaUrl, transcription) {
    await this.run(
      `UPDATE enhanced_question_responses SET response_type = ?, media_url = ?, transcription = ?
       WHERE id = ?`,
      [responseType, mediaUrl, transcription, enhancedResponseId]
    );
  }

  // ============= FOLLOW-UP QUESTIONS =============

  async createFollowup(responseId, followupText, askedBy) {
    const result = await this.run(
      `INSERT INTO response_followups (response_id, followup_text, asked_by)
       VALUES (?, ?, ?)`,
      [responseId, followupText, askedBy]
    );
    return result.lastID;
  }

  async getFollowups(responseId) {
    return this.all(
      `SELECT id, response_id as responseId, followup_text as followupText, asked_by as askedBy,
              followup_response as followupResponse, created_at FROM response_followups
       WHERE response_id = ? ORDER BY created_at`,
      [responseId]
    );
  }

  async answerFollowup(followupId, followupResponse) {
    await this.run(
      'UPDATE response_followups SET followup_response = ? WHERE id = ?',
      [followupResponse, followupId]
    );
  }

  async deleteFollowup(followupId) {
    await this.run(
      'DELETE FROM response_followups WHERE id = ?',
      [followupId]
    );
  }

  async getUnansweredFollowups(userId) {
    return this.all(
      `SELECT rf.id, rf.response_id as responseId, rf.followup_text as followupText,
              rf.asked_by as askedBy, qr.question_id as questionId, qr.user_id as respondentId
       FROM response_followups rf
       JOIN question_responses qr ON rf.response_id = qr.id
       WHERE qr.user_id = ? AND rf.followup_response IS NULL
       ORDER BY rf.created_at DESC`,
      [userId]
    );
  }
}
