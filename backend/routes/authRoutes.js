import express from 'express';
import db from '../database.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { AdminService } from '../services/AdminService.js';
import {
  hashPassword,
  comparePassword,
  generateToken
} from '../auth.js';

const router = express.Router();
const userRepository = new UserRepository(db);
const adminService = new AdminService();

// Google OAuth client (lazy-initialized, dynamic import so app starts even without the package)
let googleClient = null;
async function getGoogleClient() {
  if (!googleClient && process.env.GOOGLE_CLIENT_ID) {
    const { OAuth2Client } = await import('google-auth-library');
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

// Auth config (public)
router.get('/config', async (req, res) => {
  try {
    const signupAllowed = await adminService.isSignupAllowed();
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || null,
      signupAllowed
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching auth config' });
  }
});

// Google Sign-In
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required' });
  }

  const client = await getGoogleClient();
  if (!client) {
    return res.status(500).json({ error: 'Google authentication is not configured' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by google_id
    let user = await userRepository.findByGoogleId(googleId);

    if (user) {
      // Existing Google user - check active status
      if (!user.is_active) {
        return res.status(403).json({ error: 'Account has been disabled' });
      }
      await userRepository.updateLastLogin(user.id);
    } else {
      // Check if email already exists (link accounts)
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        // Link Google ID to existing account
        await userRepository.run(
          'UPDATE users SET google_id = ?, last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
          [googleId, existingUser.id]
        );
        user = existingUser;
      } else {
        // New user - check if signups allowed
        const signupAllowed = await adminService.isSignupAllowed();
        if (!signupAllowed) {
          return res.status(403).json({ error: 'New account registration is currently disabled' });
        }
        // Create new Google user
        user = await userRepository.createGoogleUser(email, googleId, name || email.split('@')[0]);
      }
    }

    const roles = await userRepository.getRoles(user.id);
    const token = generateToken(user.id, user.username || email);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username || email,
        displayName: user.displayName,
        roles
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google credential' });
  }
});

// Register
router.post('/register', async (req, res) => {
  const { username, password, displayName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Check if signups are allowed
  try {
    const signupAllowed = await adminService.isSignupAllowed();
    if (!signupAllowed) {
      return res.status(403).json({ error: 'New account registration is currently disabled' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error checking signup status' });
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
        user: { id: this.lastID, username, displayName: finalDisplayName, roles: [] }
      });
    }
  );
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await userRepository.findByEmailWithPassword(username);

    if (!user || !comparePassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_active === 0) {
      return res.status(403).json({ error: 'Account has been disabled' });
    }

    await userRepository.updateLastLogin(user.id);
    const roles = await userRepository.getRoles(user.id);
    const token = generateToken(user.id, user.username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        roles
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
