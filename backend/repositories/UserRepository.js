/**
 * User Repository - Manages User aggregate
 */

import { BaseRepository } from './BaseRepository.js';

export class UserRepository extends BaseRepository {
  async findById(userId) {
    return this.get(
      'SELECT id, username, display_name as displayName, created_at FROM users WHERE id = ?',
      [userId]
    );
  }

  async findByEmail(email) {
    return this.get(
      'SELECT id, username, display_name as displayName, created_at FROM users WHERE username = ?',
      [email]
    );
  }

  async findByEmailWithPassword(email) {
    return this.get(
      'SELECT id, username, password_hash, display_name as displayName, is_active, created_at FROM users WHERE username = ?',
      [email]
    );
  }

  async findByGoogleId(googleId) {
    return this.get(
      'SELECT id, username, display_name as displayName, google_id, is_active, created_at FROM users WHERE google_id = ?',
      [googleId]
    );
  }

  async createGoogleUser(email, googleId, displayName) {
    const result = await this.run(
      'INSERT INTO users (username, password_hash, display_name, google_id, last_login_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [email, '!GOOGLE_AUTH_ONLY!', displayName, googleId]
    );
    return { id: result.lastID, username: email, displayName, createdAt: new Date() };
  }

  async create(email, passwordHash, displayName) {
    const result = await this.run(
      'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
      [email, passwordHash, displayName]
    );
    return { id: result.lastID, email, displayName, createdAt: new Date() };
  }

  async updateDisplayName(userId, displayName) {
    await this.run(
      'UPDATE users SET display_name = ? WHERE id = ?',
      [displayName, userId]
    );
  }

  async updateLastLogin(userId) {
    await this.run(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  async addRole(userId, role) {
    await this.run(
      'INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)',
      [userId, role]
    );
  }

  async hasRole(userId, role) {
    const record = await this.get(
      'SELECT id FROM user_roles WHERE user_id = ? AND role = ?',
      [userId, role]
    );
    return !!record;
  }

  async getRoles(userId) {
    const roles = await this.all(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [userId]
    );
    return roles.map(r => r.role);
  }

  async getAllUsers() {
    return this.all(
      'SELECT id, username, display_name as displayName, created_at FROM users'
    );
  }

  async getAllWithRoles() {
    return this.all(
      `SELECT u.id, u.username, u.display_name as displayName, u.created_at, u.last_login_at, u.is_active, u.google_id,
              GROUP_CONCAT(ur.role) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
  }

  async setActive(userId, isActive) {
    await this.run(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [isActive ? 1 : 0, userId]
    );
  }
}
