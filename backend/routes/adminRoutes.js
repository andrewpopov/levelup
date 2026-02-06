import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { AdminService } from '../services/AdminService.js';

const router = express.Router();
const userRepository = new UserRepository(db);
const adminService = new AdminService();

// All admin routes require authentication + admin role
router.use(authenticateToken, requireAdmin);

const ALLOWED_SETTINGS = ['allow_signups'];

// GET /api/admin/users - list all users with roles
router.get('/users', async (req, res) => {
  try {
    const users = await userRepository.getAllWithRoles();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// GET /api/admin/settings - get all settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await adminService.getSettings();
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

// PUT /api/admin/settings/:key - update a setting
router.put('/settings/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (!ALLOWED_SETTINGS.includes(key)) {
    return res.status(400).json({ error: 'Invalid setting key' });
  }

  if (value === undefined || value === null) {
    return res.status(400).json({ error: 'Value is required' });
  }

  try {
    await adminService.setSetting(key, String(value), req.user.userId);
    res.json({ key, value: String(value) });
  } catch (err) {
    console.error('Error updating setting:', err);
    res.status(500).json({ error: 'Error updating setting' });
  }
});

// PUT /api/admin/users/:id/active - enable/disable user
router.put('/users/:id/active', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { isActive } = req.body;

  if (userId === req.user.userId) {
    return res.status(400).json({ error: 'You cannot disable your own account' });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be a boolean' });
  }

  try {
    await adminService.toggleUserActive(userId, isActive);
    res.json({ userId, isActive });
  } catch (err) {
    console.error('Error toggling user active status:', err);
    res.status(500).json({ error: 'Error updating user status' });
  }
});

// POST /api/admin/users/:id/roles - add role to user
router.post('/users/:id/roles', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;

  const ALLOWED_ROLES = ['admin'];
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    await userRepository.addRole(userId, role);
    const roles = await userRepository.getRoles(userId);
    res.json({ userId, roles });
  } catch (err) {
    console.error('Error adding role:', err);
    res.status(500).json({ error: 'Error adding role' });
  }
});

export default router;
