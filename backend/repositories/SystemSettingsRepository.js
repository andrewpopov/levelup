import { BaseRepository } from './BaseRepository.js';

export class SystemSettingsRepository extends BaseRepository {
  async getSetting(key) {
    const row = await this.get(
      'SELECT value FROM system_settings WHERE key = ?',
      [key]
    );
    return row ? row.value : null;
  }

  async setSetting(key, value, updatedBy) {
    await this.run(
      `INSERT INTO system_settings (key, value, updated_at, updated_by)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?`,
      [key, value, updatedBy, value, updatedBy]
    );
  }

  async getAllSettings() {
    return this.all('SELECT key, value, updated_at, updated_by FROM system_settings');
  }
}
