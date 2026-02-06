import db from '../database.js';
import { UserRepository } from '../repositories/UserRepository.js';

const userRepository = new UserRepository(db);

export async function requireAdmin(req, res, next) {
  try {
    const isAdmin = await userRepository.hasRole(req.user.userId, 'admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Error checking admin status' });
  }
}
