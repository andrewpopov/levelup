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
      'SELECT id, username, password_hash, display_name as displayName, created_at FROM users WHERE username = ?',
      [email]
    );
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

  async addRole(userId, role) {
    await this.run(
      'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
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

  async all() {
    return this.all(
      'SELECT id, username, display_name as displayName, created_at FROM users'
    );
  }
}
