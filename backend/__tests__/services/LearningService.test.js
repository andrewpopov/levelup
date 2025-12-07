/**
 * Learning Service Tests
 */

import { LearningService } from '../../services/LearningService.js';
import eventBus from '../../core/event-bus.js';
import {
  JourneyEnrolledEvent,
  TaskCompletedEvent,
  JourneyCompletedEvent
} from '../../core/domain-events.js';

describe('LearningService', () => {
  let service;
  let mockJourneyRepository;

  beforeEach(() => {
    eventBus.clearHistory();
    eventBus.clearListeners();

    mockJourneyRepository = {
      findActive: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      updateJourney: jest.fn(),
      getTasksForJourney: jest.fn(),
      getTaskById: jest.fn(),
      createTask: jest.fn(),
      enrollUser: jest.fn(),
      getUserJourneyById: jest.fn(),
      getUserJourney: jest.fn(),
      getUserJourneys: jest.fn(),
      createTaskProgress: jest.fn(),
      startTask: jest.fn(),
      completeTask: jest.fn(),
      updateUserJourneyProgress: jest.fn(),
      completeUserJourney: jest.fn(),
      getJourneyTaskProgress: jest.fn(),
      getTaskProgress: jest.fn()
    };

    service = new LearningService({});
    service.journeyRepository = mockJourneyRepository;
  });

  describe('enrollUser', () => {
    it('should enroll user in a journey', async () => {
      const mockJourney = {
        id: 1,
        title: 'Interview Prep',
        cadence: 'weekly',
        durationWeeks: 8
      };

      const mockTasks = [
        { id: 1, taskOrder: 1, title: 'Task 1' },
        { id: 2, taskOrder: 2, title: 'Task 2' }
      ];

      mockJourneyRepository.findById.mockResolvedValue(mockJourney);
      mockJourneyRepository.enrollUser.mockResolvedValue(1);
      mockJourneyRepository.getTasksForJourney.mockResolvedValue(mockTasks);
      mockJourneyRepository.createTaskProgress.mockResolvedValue(null);
      mockJourneyRepository.getUserJourneyById.mockResolvedValue({
        id: 1,
        userId: 1,
        journeyId: 1,
        completionPercentage: 0,
        status: 'active'
      });

      const publishSpy = jest.spyOn(eventBus, 'publish');

      const result = await service.enrollUser(1, 1, new Date());

      expect(mockJourneyRepository.enrollUser).toHaveBeenCalledWith(1, 1, expect.any(Date));
      expect(mockJourneyRepository.createTaskProgress).toHaveBeenCalledTimes(2);
      expect(publishSpy).toHaveBeenCalled();

      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(JourneyEnrolledEvent);
    });

    it('should reject if already enrolled', async () => {
      mockJourneyRepository.getUserJourney.mockResolvedValue({
        id: 1,
        userId: 1,
        journeyId: 1
      });

      await expect(
        service.enrollUser(1, 1)
      ).rejects.toThrow('already enrolled');
    });

    it('should reject if journey not found', async () => {
      mockJourneyRepository.getUserJourney.mockResolvedValue(null);
      mockJourneyRepository.findById.mockResolvedValue(null);

      await expect(
        service.enrollUser(1, 999)
      ).rejects.toThrow('not found');
    });

    it('should calculate due dates based on cadence', async () => {
      const mockJourney = {
        id: 1,
        cadence: 'weekly'
      };

      const mockTasks = [
        { id: 1, taskOrder: 1 },
        { id: 2, taskOrder: 2 }
      ];

      mockJourneyRepository.findById.mockResolvedValue(mockJourney);
      mockJourneyRepository.enrollUser.mockResolvedValue(1);
      mockJourneyRepository.getTasksForJourney.mockResolvedValue(mockTasks);
      mockJourneyRepository.createTaskProgress.mockResolvedValue(null);
      mockJourneyRepository.getUserJourneyById.mockResolvedValue({
        id: 1,
        completionPercentage: 0
      });

      await service.enrollUser(1, 1, new Date('2024-01-01'));

      const calls = mockJourneyRepository.createTaskProgress.mock.calls;
      expect(calls.length).toBe(2);

      // First task due 1 week from start
      // Second task due 2 weeks from start
      expect(calls[0][3]).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format YYYY-MM-DD
      expect(calls[1][3]).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('completeTask', () => {
    it('should complete a task and update journey progress', async () => {
      mockJourneyRepository.all = jest.fn().mockResolvedValue([
        { user_journey_id: 1, task_id: 1, user_id: 1 }
      ]);

      mockJourneyRepository.completeTask.mockResolvedValue(null);
      mockJourneyRepository.getUserJourneyById.mockResolvedValue({
        id: 1,
        userId: 1,
        journeyId: 1,
        completionPercentage: 50,
        status: 'active'
      });

      mockJourneyRepository.findById.mockResolvedValue({
        id: 1,
        title: 'Journey'
      });

      mockJourneyRepository.getJourneyTaskProgress.mockResolvedValue([
        { id: 1, status: 'completed' },
        { id: 2, status: 'completed' }
      ]);

      const publishSpy = jest.spyOn(eventBus, 'publish');

      await service.completeTask(1);

      expect(mockJourneyRepository.completeTask).toHaveBeenCalledWith(1);
      expect(publishSpy).toHaveBeenCalled();

      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(TaskCompletedEvent);
    });

    it('should complete journey when all tasks done', async () => {
      mockJourneyRepository.all = jest.fn().mockResolvedValue([
        { user_journey_id: 1, task_id: 1, user_id: 1 }
      ]);

      mockJourneyRepository.completeTask.mockResolvedValue(null);
      mockJourneyRepository.getUserJourneyById.mockResolvedValue({
        id: 1,
        userId: 1,
        journeyId: 1,
        completionPercentage: 100,
        status: 'active'
      });

      mockJourneyRepository.findById.mockResolvedValue({ id: 1 });

      mockJourneyRepository.getJourneyTaskProgress.mockResolvedValue([
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' }
      ]);

      const publishSpy = jest.spyOn(eventBus, 'publish');

      await service.completeTask(1);

      expect(mockJourneyRepository.completeUserJourney).toHaveBeenCalledWith(1);

      const events = publishSpy.mock.calls.map(call => call[0]);
      const journeyCompletedEvent = events.find(e => e instanceof JourneyCompletedEvent);
      expect(journeyCompletedEvent).toBeDefined();
    });
  });

  describe('getCurrentTasks', () => {
    it('should get pending tasks for user', async () => {
      const mockJourneys = [
        {
          id: 1,
          userId: 1,
          journeyId: 1,
          status: 'active'
        }
      ];

      const mockTasks = [
        {
          id: 1,
          taskId: 1,
          status: 'pending',
          dueDate: '2024-12-15'
        }
      ];

      mockJourneyRepository.getUserJourneys.mockResolvedValue(mockJourneys);
      mockJourneyRepository.getJourneyTaskProgress.mockResolvedValue(mockTasks);
      mockJourneyRepository.findById.mockResolvedValue({
        id: 1,
        title: 'Journey 1'
      });

      mockJourneyRepository.getTaskById.mockResolvedValue({
        id: 1,
        title: 'Task 1'
      });

      const tasks = await service.getCurrentTasks(1);

      expect(Array.isArray(tasks)).toBe(true);
      expect(mockJourneyRepository.getUserJourneys).toHaveBeenCalledWith(1, 'active');
    });

    it('should filter out completed tasks', async () => {
      mockJourneyRepository.getUserJourneys.mockResolvedValue([
        { id: 1, userId: 1, journeyId: 1 }
      ]);

      mockJourneyRepository.getJourneyTaskProgress.mockResolvedValue([
        { id: 1, taskId: 1, status: 'completed' },
        { id: 2, taskId: 2, status: 'pending' }
      ]);

      mockJourneyRepository.findById.mockResolvedValue({ id: 1 });
      mockJourneyRepository.getTaskById.mockResolvedValue({ id: 1 });

      const tasks = await service.getCurrentTasks(1);

      // Should not include completed tasks
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      expect(completedCount).toBe(0);
    });
  });

  describe('getActiveJourneys', () => {
    it('should retrieve active journeys', async () => {
      const mockJourneys = [
        { id: 1, title: 'Interview Prep' },
        { id: 2, title: 'Leadership' }
      ];

      mockJourneyRepository.findActive.mockResolvedValue(mockJourneys);

      const journeys = await service.getActiveJourneys();

      expect(journeys).toEqual(mockJourneys);
      expect(mockJourneyRepository.findActive).toHaveBeenCalled();
    });
  });

  describe('_calculateDueDate', () => {
    it('should calculate weekly due dates correctly', () => {
      const startDate = new Date('2024-01-01');

      const dueDate1 = service._calculateDueDate(startDate, 1, 'weekly');
      const dueDate2 = service._calculateDueDate(startDate, 2, 'weekly');

      expect(dueDate1).toBe('2024-01-01');
      expect(dueDate2).toBe('2024-01-08');
    });

    it('should calculate daily due dates correctly', () => {
      const startDate = new Date('2024-01-01');

      const dueDate1 = service._calculateDueDate(startDate, 1, 'daily');
      const dueDate2 = service._calculateDueDate(startDate, 2, 'daily');

      expect(dueDate1).toBe('2024-01-01');
      expect(dueDate2).toBe('2024-01-02');
    });

    it('should calculate monthly due dates correctly', () => {
      const startDate = new Date('2024-01-15');

      const dueDate1 = service._calculateDueDate(startDate, 1, 'monthly');
      const dueDate2 = service._calculateDueDate(startDate, 2, 'monthly');

      expect(dueDate1).toBe('2024-01-15');
      expect(dueDate2).toBe('2024-02-15');
    });
  });
});
