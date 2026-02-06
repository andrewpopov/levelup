import db from '../database.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { SystemSettingsRepository } from '../repositories/SystemSettingsRepository.js';

const userRepository = new UserRepository(db);
const settingsRepository = new SystemSettingsRepository(db);

export class AdminService {
  async isSignupAllowed() {
    const value = await settingsRepository.getSetting('allow_signups');
    return value !== 'false';
  }

  async setSignupAllowed(allowed, adminUserId) {
    await settingsRepository.setSetting('allow_signups', allowed ? 'true' : 'false', adminUserId);
  }

  async toggleUserActive(targetUserId, isActive) {
    await userRepository.setActive(targetUserId, isActive);
  }

  async getSettings() {
    return settingsRepository.getAllSettings();
  }

  async setSetting(key, value, adminUserId) {
    await settingsRepository.setSetting(key, value, adminUserId);
  }
}
