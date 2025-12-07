import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

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

  req.user = user;
  next();
}

// Check if user has admin role
export function checkUserRole(userId, role) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM user_roles WHERE user_id = ? AND role = ?',
      [userId, role],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

// Middleware to require admin role
export async function requireAdmin(req, res, next) {
  try {
    const isAdmin = await checkUserRole(req.user.userId, 'admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    res.status(500).json({ error: 'Error verifying permissions' });
  }
}
