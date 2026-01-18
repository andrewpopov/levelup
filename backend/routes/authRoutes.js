import express from 'express';
import db from '../database.js';
import {
  hashPassword,
  comparePassword,
  generateToken
} from '../auth.js';

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { username, password, displayName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  // Auto-generate displayName from email if not provided
  const finalDisplayName = displayName || username.split('@')[0];

  const passwordHash = hashPassword(password);

  db.run(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
    [username, passwordHash, finalDisplayName],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'This email is already registered' });
        }
        return res.status(500).json({ error: 'Error creating account' });
      }

      const token = generateToken(this.lastID, username);
      res.json({
        token,
        user: { id: this.lastID, username, displayName: finalDisplayName }
      });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user || !comparePassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id, user.username);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name
        }
      });
    }
  );
});

export default router;
