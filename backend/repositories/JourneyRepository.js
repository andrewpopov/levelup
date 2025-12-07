/**
 * Journey Repository - Manages Journey and UserJourney aggregates
 */

import { BaseRepository } from './BaseRepository.js';

export class JourneyRepository extends BaseRepository {
  // ============= JOURNEY MANAGEMENT =============

  async findById(journeyId) {
    return this.get(
      `SELECT id, title, description, cover_image_url as coverImageUrl,
              duration_weeks as durationWeeks, cadence, is_active as isActive,
              is_default as isDefault, created_by as createdBy, created_at
       FROM journeys WHERE id = ?`,
      [journeyId]
    );
  }

  async findActive() {
    return this.all(
      `SELECT id, title, description, cover_image_url as coverImageUrl,
              duration_weeks as durationWeeks, cadence, is_active as isActive,
              is_default as isDefault, created_by as createdBy, created_at
       FROM journeys WHERE is_active = 1 ORDER BY is_default DESC, created_at DESC`
    );
  }

  async findAll() {
    return this.all(
      `SELECT id, title, description, cover_image_url as coverImageUrl,
              duration_weeks as durationWeeks, cadence, is_active as isActive,
              is_default as isDefault, created_by as createdBy, created_at
       FROM journeys ORDER BY created_at DESC`
    );
  }

  async create(journey) {
    const result = await this.run(
      `INSERT INTO journeys (title, description, cover_image_url, duration_weeks, cadence, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        journey.title,
        journey.description,
        journey.coverImageUrl,
        journey.durationWeeks,
        journey.cadence,
        journey.isActive ? 1 : 0,
        journey.createdBy
      ]
    );
    return result.lastID;
  }

  async updateJourney(journeyId, updates) {
    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'title') {
        setClauses.push('title = ?');
        params.push(value);
      } else if (key === 'description') {
        setClauses.push('description = ?');
        params.push(value);
      } else if (key === 'coverImageUrl') {
        setClauses.push('cover_image_url = ?');
        params.push(value);
      } else if (key === 'isActive') {
        setClauses.push('is_active = ?');
        params.push(value ? 1 : 0);
      }
    }

    if (setClauses.length === 0) return;

    params.push(journeyId);
    await this.run(
      `UPDATE journeys SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );
  }

  // ============= JOURNEY TASK MANAGEMENT =============

  async getTasksForJourney(journeyId) {
    return this.all(
      `SELECT id, journey_id as journeyId, task_order as taskOrder, title,
              description, task_type as taskType, question_id as questionId,
              estimated_time_minutes as estimatedTimeMinutes, page_number as pageNumber,
              chapter_name as chapterName, created_at
       FROM journey_tasks WHERE journey_id = ? ORDER BY task_order`,
      [journeyId]
    );
  }

  async getTaskById(taskId) {
    return this.get(
      `SELECT id, journey_id as journeyId, task_order as taskOrder, title,
              description, task_type as taskType, question_id as questionId,
              estimated_time_minutes as estimatedTimeMinutes, page_number as pageNumber,
              chapter_name as chapterName, created_at
       FROM journey_tasks WHERE id = ?`,
      [taskId]
    );
  }

  async createTask(journeyId, task) {
    const result = await this.run(
      `INSERT INTO journey_tasks (journey_id, task_order, title, description, task_type, question_id, estimated_time_minutes, page_number, chapter_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        journeyId,
        task.taskOrder,
        task.title,
        task.description,
        task.taskType,
        task.questionId || null,
        task.estimatedTimeMinutes || null,
        task.pageNumber,
        task.chapterName
      ]
    );
    return result.lastID;
  }

  // ============= USER JOURNEY ENROLLMENT =============

  async enrollUser(userId, journeyId, startDate) {
    const result = await this.run(
      `INSERT INTO user_journeys (user_id, journey_id, start_date, status)
       VALUES (?, ?, ?, 'active')`,
      [userId, journeyId, startDate]
    );
    return result.lastID;
  }

  async getUserJourneyById(userJourneyId) {
    return this.get(
      `SELECT id, user_id as userId, journey_id as journeyId, enrolled_at as enrolledAt,
              start_date as startDate, current_task_id as currentTaskId, status,
              completion_percentage as completionPercentage, completed_at
       FROM user_journeys WHERE id = ?`,
      [userJourneyId]
    );
  }

  async getUserJourney(userId, journeyId) {
    return this.get(
      `SELECT id, user_id as userId, journey_id as journeyId, enrolled_at as enrolledAt,
              start_date as startDate, current_task_id as currentTaskId, status,
              completion_percentage as completionPercentage, completed_at
       FROM user_journeys WHERE user_id = ? AND journey_id = ?`,
      [userId, journeyId]
    );
  }

  async getUserJourneys(userId, status = 'active') {
    return this.all(
      `SELECT id, user_id as userId, journey_id as journeyId, enrolled_at as enrolledAt,
              start_date as startDate, current_task_id as currentTaskId, status,
              completion_percentage as completionPercentage, completed_at
       FROM user_journeys WHERE user_id = ? AND status = ?
       ORDER BY enrolled_at DESC`,
      [userId, status]
    );
  }

  async updateUserJourneyProgress(userJourneyId, completionPercentage) {
    await this.run(
      `UPDATE user_journeys SET completion_percentage = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [completionPercentage, userJourneyId]
    );
  }

  async completeUserJourney(userJourneyId) {
    await this.run(
      `UPDATE user_journeys SET status = 'completed', completion_percentage = 100, completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [userJourneyId]
    );
  }

  // ============= TASK PROGRESS MANAGEMENT =============

  async getTaskProgress(userJourneyId, taskId) {
    return this.get(
      `SELECT id, user_journey_id as userJourneyId, task_id as taskId, user_id as userId,
              status, due_date as dueDate, started_at as startedAt, completed_at as completedAt,
              is_overdue as isOverdue, created_at
       FROM user_task_progress WHERE user_journey_id = ? AND task_id = ?`,
      [userJourneyId, taskId]
    );
  }

  async getJourneyTaskProgress(userJourneyId) {
    return this.all(
      `SELECT id, user_journey_id as userJourneyId, task_id as taskId, user_id as userId,
              status, due_date as dueDate, started_at as startedAt, completed_at as completedAt,
              is_overdue as isOverdue, created_at
       FROM user_task_progress WHERE user_journey_id = ?
       ORDER BY due_date`,
      [userJourneyId]
    );
  }

  async createTaskProgress(userJourneyId, taskId, userId, dueDate) {
    const result = await this.run(
      `INSERT INTO user_task_progress (user_journey_id, task_id, user_id, status, due_date)
       VALUES (?, ?, ?, 'pending', ?)`,
      [userJourneyId, taskId, userId, dueDate]
    );
    return result.lastID;
  }

  async startTask(taskProgressId) {
    await this.run(
      `UPDATE user_task_progress SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [taskProgressId]
    );
  }

  async completeTask(taskProgressId) {
    await this.run(
      `UPDATE user_task_progress SET status = 'completed', completed_at = CURRENT_TIMESTAMP, is_overdue = 0
       WHERE id = ?`,
      [taskProgressId]
    );
  }

  async getOverdueTasks(userId) {
    return this.all(
      `SELECT id, task_id as taskId, user_journey_id as userJourneyId, status, due_date as dueDate
       FROM user_task_progress WHERE user_id = ? AND status != 'completed' AND due_date < date('now')
       ORDER BY due_date`,
      [userId]
    );
  }
}
