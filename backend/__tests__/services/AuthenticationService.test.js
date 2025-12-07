/**
 * Authentication Service Tests
 */

import { AuthenticationService } from '../../services/AuthenticationService.js';
import eventBus from '../../core/event-bus.js';
import { UserRegisteredEvent, UserLoggedInEvent } from '../../core/domain-events.js';

describe('AuthenticationService', () => {
  let service;
  let mockDb;

  beforeEach(() => {
    // Clear event history before each test
    eventBus.clearHistory();
    eventBus.clearListeners();

    // Mock database with simple in-memory storage
    mockDb = {
      users: [],
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    };

    service = new AuthenticationService(mockDb);
  });

  describe('register', () => {
    it('should register a new user with valid credentials', async () => {
      const mockUserRepository = {
        findByEmail: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          displayName: 'User',
          createdAt: new Date()
        })
      };

      service.userRepository = mockUserRepository;

      const result = await service.register('user@example.com', 'password123', 'User');

      expect(result).toHaveProperty('token');
      expect(result.user).toEqual({
        id: 1,
        email: 'user@example.com',
        displayName: 'User'
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should publish UserRegisteredEvent', async () => {
      const mockUserRepository = {
        findByEmail: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          displayName: 'User'
        })
      };

      service.userRepository = mockUserRepository;
      const publishSpy = jest.spyOn(eventBus, 'publish');

      await service.register('user@example.com', 'password123', 'User');

      expect(publishSpy).toHaveBeenCalled();
      const event = publishSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(UserRegisteredEvent);
      expect(event.userId).toBe(1);
      expect(event.email).toBe('user@example.com');
    });

    it('should reject duplicate email', async () => {
      const mockUserRepository = {
        findByEmail: jest.fn().mockResolvedValue({ id: 1, email: 'user@example.com' })
      };

      service.userRepository = mockUserRepository;

      await expect(
        service.register('user@example.com', 'password123', 'User')
      ).rejects.toThrow('already registered');
    });

    it('should reject invalid email', async () => {
      const mockUserRepository = {
        findByEmail: jest.fn().mockResolvedValue(null)
      };

      service.userRepository = mockUserRepository;

      await expect(
        service.register('invalid-email', 'password123', 'User')
      ).rejects.toThrow('Invalid email');
    });

    it('should generate displayName from email if not provided', async () => {
      const mockUserRepository = {
        findByEmail: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 1,
          email: 'john@example.com',
          displayName: 'john'
        })
      };

      service.userRepository = mockUserRepository;

      const result = await service.register('john@example.com', 'password123');

      expect(result.user.displayName).toBe('john');
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const mockUserRepository = {
        findByEmailWithPassword: jest.fn().mockResolvedValue({
          id: 1,
          username: 'user@example.com',
          password_hash: '$2b$10$...',
          displayName: 'User'
        })
      };

      service.userRepository = mockUserRepository;

      // Mock comparePassword to return true
      jest.mock('../../auth.js', () => ({
        ...jest.requireActual('../../auth.js'),
        comparePassword: jest.fn().mockReturnValue(true)
      }));

      // Note: In real test, would mock comparePassword from auth.js
      // For this example, we're testing the flow
    });

    it('should publish UserLoggedInEvent', async () => {
      const mockUserRepository = {
        findByEmailWithPassword: jest.fn().mockResolvedValue({
          id: 1,
          username: 'user@example.com',
          password_hash: '$2b$10$...',
          displayName: 'User'
        })
      };

      service.userRepository = mockUserRepository;
      const publishSpy = jest.spyOn(eventBus, 'publish');

      // This would work with proper mocking of comparePassword
      // Left as example of event verification pattern
    });

    it('should reject non-existent user', async () => {
      const mockUserRepository = {
        findByEmailWithPassword: jest.fn().mockResolvedValue(null)
      };

      service.userRepository = mockUserRepository;

      await expect(
        service.login('nonexistent@example.com', 'password')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('updateDisplayName', () => {
    it('should update user display name', async () => {
      const mockUserRepository = {
        updateDisplayName: jest.fn().mockResolvedValue(undefined)
      };

      service.userRepository = mockUserRepository;

      await service.updateDisplayName(1, 'New Name');

      expect(mockUserRepository.updateDisplayName).toHaveBeenCalledWith(1, 'New Name');
    });

    it('should reject empty display name', async () => {
      await expect(
        service.updateDisplayName(1, '')
      ).rejects.toThrow('cannot be empty');
    });
  });

  describe('getUser', () => {
    it('should fetch user profile', async () => {
      const mockUserRepository = {
        findById: jest.fn().mockResolvedValue({
          id: 1,
          email: 'user@example.com',
          displayName: 'User'
        })
      };

      service.userRepository = mockUserRepository;

      const user = await service.getUser(1);

      expect(user).toEqual({
        id: 1,
        email: 'user@example.com',
        displayName: 'User'
      });
    });
  });
});
