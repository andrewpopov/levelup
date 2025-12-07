/**
 * Authentication Service - User authentication and registration
 */

import { hashPassword, comparePassword, generateToken, verifyToken } from '../auth.js';
import { UserRepository } from '../repositories/UserRepository.js';
import eventBus from '../core/event-bus.js';
import { UserRegisteredEvent, UserLoggedInEvent } from '../core/domain-events.js';

export class AuthenticationService {
  constructor(db) {
    this.userRepository = new UserRepository(db);
  }

  /**
   * Register a new user
   */
  async register(email, password, displayName) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address');
    }

    // Check if user already exists
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('This email is already registered');
    }

    const finalDisplayName = displayName || email.split('@')[0];
    const passwordHash = hashPassword(password);

    try {
      const user = await this.userRepository.create(email, passwordHash, finalDisplayName);

      // Publish domain event
      await eventBus.publish(
        new UserRegisteredEvent(user.id, email, finalDisplayName)
      );

      // Generate token
      const token = generateToken(user.id, email);

      return {
        token,
        user: {
          id: user.id,
          email,
          displayName: finalDisplayName
        }
      };
    } catch (err) {
      throw new Error(`Registration failed: ${err.message}`);
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const passwordValid = comparePassword(password, user.password_hash);
    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    // Publish domain event
    await eventBus.publish(
      new UserLoggedInEvent(user.id, email)
    );

    const token = generateToken(user.id, email);

    return {
      token,
      user: {
        id: user.id,
        email: user.username,
        displayName: user.displayName
      }
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    return verifyToken(token);
  }

  /**
   * Get user profile
   */
  async getUser(userId) {
    return this.userRepository.findById(userId);
  }

  /**
   * Update user display name
   */
  async updateDisplayName(userId, displayName) {
    if (!displayName || displayName.trim().length === 0) {
      throw new Error('Display name cannot be empty');
    }
    await this.userRepository.updateDisplayName(userId, displayName);
  }
}
