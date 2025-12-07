/**
 * Learning Service - Journey and task management
 */

import { JourneyRepository } from '../repositories/JourneyRepository.js';
import eventBus from '../core/event-bus.js';
import {
  JourneyEnrolledEvent,
  TaskStartedEvent,
  TaskCompletedEvent,
  JourneyCompletedEvent
} from '../core/domain-events.js';

export class LearningService {
  constructor(db) {
    this.journeyRepository = new JourneyRepository(db);
  }

  // ============= JOURNEY MANAGEMENT =============

  /**
   * Get all active journeys
   */
  async getActiveJourneys() {
    return this.journeyRepository.findActive();
  }

  /**
   * Get journey details
   */
  async getJourney(journeyId) {
    const journey = await this.journeyRepository.findById(journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    // Get tasks
    const tasks = await this.journeyRepository.getTasksForJourney(journeyId);

    return {
      ...journey,
      tasks
    };
  }

  /**
   * Create a new journey (admin only)
   */
  async createJourney(journeyData) {
    const { title, description, coverImageUrl, durationWeeks, cadence, createdBy } = journeyData;

    if (!title || !durationWeeks || !cadence) {
      throw new Error('Title, duration, and cadence are required');
    }

    const validCadences = ['daily', 'weekly', 'biweekly', 'monthly'];
    if (!validCadences.includes(cadence)) {
      throw new Error(`Cadence must be one of: ${validCadences.join(', ')}`);
    }

    const journeyId = await this.journeyRepository.create({
      title,
      description,
      coverImageUrl,
      durationWeeks,
      cadence,
      isActive: true,
      createdBy
    });

    return this.getJourney(journeyId);
  }

  // ============= ENROLLMENT =============

  /**
   * Enroll user in a journey
   */
  async enrollUser(userId, journeyId, startDate = new Date()) {
    // Check if already enrolled
    const existing = await this.journeyRepository.getUserJourney(userId, journeyId);
    if (existing) {
      throw new Error('User already enrolled in this journey');
    }

    const journey = await this.journeyRepository.findById(journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    // Create enrollment
    const userJourneyId = await this.journeyRepository.enrollUser(
      userId,
      journeyId,
      startDate
    );

    // Create task progress records for all tasks
    const tasks = await this.journeyRepository.getTasksForJourney(journeyId);

    for (const task of tasks) {
      const dueDate = this._calculateDueDate(startDate, task.taskOrder, journey.cadence);
      await this.journeyRepository.createTaskProgress(
        userJourneyId,
        task.id,
        userId,
        dueDate
      );
    }

    // Publish event
    await eventBus.publish(
      new JourneyEnrolledEvent(userJourneyId, userId, journeyId)
    );

    return this.getUserJourney(userJourneyId);
  }

  /**
   * Get user's journey details
   */
  async getUserJourney(userJourneyId) {
    const userJourney = await this.journeyRepository.getUserJourneyById(userJourneyId);
    if (!userJourney) {
      throw new Error('User journey not found');
    }

    const journey = await this.journeyRepository.findById(userJourney.journeyId);
    const taskProgress = await this.journeyRepository.getJourneyTaskProgress(userJourneyId);

    return {
      ...userJourney,
      journey,
      taskProgress,
      completionPercentage: userJourney.completionPercentage
    };
  }

  /**
   * Get user's active journeys
   */
  async getUserActiveJourneys(userId) {
    const journeys = await this.journeyRepository.getUserJourneys(userId, 'active');

    return Promise.all(
      journeys.map(async (uj) => {
        const journey = await this.journeyRepository.findById(uj.journeyId);
        return {
          ...uj,
          journey
        };
      })
    );
  }

  // ============= TASK MANAGEMENT =============

  /**
   * Start a task
   */
  async startTask(taskProgressId) {
    const progress = await this.journeyRepository.all(
      'SELECT user_journey_id, task_id, user_id FROM user_task_progress WHERE id = ?',
      [taskProgressId]
    );

    if (!progress || progress.length === 0) {
      throw new Error('Task progress not found');
    }

    const { user_journey_id, task_id, user_id } = progress[0];

    await this.journeyRepository.startTask(taskProgressId);

    // Publish event
    await eventBus.publish(
      new TaskStartedEvent(taskProgressId, user_journey_id, task_id, user_id)
    );

    return { taskProgressId, status: 'in_progress' };
  }

  /**
   * Complete a task and update journey progress
   */
  async completeTask(taskProgressId) {
    const progress = await this.journeyRepository.all(
      'SELECT user_journey_id, task_id, user_id FROM user_task_progress WHERE id = ?',
      [taskProgressId]
    );

    if (!progress || progress.length === 0) {
      throw new Error('Task progress not found');
    }

    const { user_journey_id, task_id, user_id } = progress[0];

    await this.journeyRepository.completeTask(taskProgressId);

    // Calculate new journey progress
    await this._updateJourneyProgress(user_journey_id);

    // Get updated user journey to check if complete
    const userJourney = await this.journeyRepository.getUserJourneyById(user_journey_id);
    const journey = await this.journeyRepository.findById(userJourney.journeyId);

    // Publish event
    await eventBus.publish(
      new TaskCompletedEvent(taskProgressId, user_journey_id, task_id, user_id, journey.id)
    );

    // Check if journey is complete
    if (userJourney.completionPercentage >= 100) {
      await this.journeyRepository.completeUserJourney(user_journey_id);
      await eventBus.publish(
        new JourneyCompletedEvent(user_journey_id, user_id, journey.id)
      );
    }

    return { taskProgressId, status: 'completed' };
  }

  /**
   * Get pending/current tasks for user
   */
  async getCurrentTasks(userId) {
    const journeys = await this.journeyRepository.getUserJourneys(userId, 'active');

    const allTasks = [];
    for (const uj of journeys) {
      const tasks = await this.journeyRepository.getJourneyTaskProgress(uj.id);
      const journey = await this.journeyRepository.findById(uj.journeyId);

      for (const task of tasks) {
        if (task.status !== 'completed') {
          const taskDetail = await this.journeyRepository.getTaskById(task.taskId);
          allTasks.push({
            ...task,
            taskDetail,
            journeyId: uj.journeyId,
            journeyTitle: journey.title
          });
        }
      }
    }

    return allTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  // ============= PRIVATE HELPERS =============

  /**
   * Calculate due date based on task order and cadence
   */
  _calculateDueDate(startDate, taskOrder, cadence) {
    const date = new Date(startDate);

    switch (cadence) {
      case 'daily':
        date.setDate(date.getDate() + (taskOrder - 1));
        break;
      case 'weekly':
        date.setDate(date.getDate() + (taskOrder - 1) * 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + (taskOrder - 1) * 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + (taskOrder - 1));
        break;
    }

    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  /**
   * Update journey completion percentage
   */
  async _updateJourneyProgress(userJourneyId) {
    const taskProgress = await this.journeyRepository.getJourneyTaskProgress(userJourneyId);

    if (taskProgress.length === 0) {
      return;
    }

    const completedCount = taskProgress.filter(t => t.status === 'completed').length;
    const completionPercentage = Math.round((completedCount / taskProgress.length) * 100);

    await this.journeyRepository.updateUserJourneyProgress(
      userJourneyId,
      completionPercentage
    );
  }
}
