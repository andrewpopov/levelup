import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './database.js';

// Validate JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dev-secret-key') {
  console.error('FATAL: JWT_SECRET must be set in production environment');
  process.exit(1);
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Check if user account is still active
  db.get('SELECT is_active FROM users WHERE id = ?', [user.userId], (err, row) => {
    if (err || !row) {
      return res.status(403).json({ error: 'Account not found' });
    }
    if (row.is_active === 0) {
      return res.status(403).json({ error: 'Account has been disabled' });
    }
    req.user = user;
    next();
  });
}
