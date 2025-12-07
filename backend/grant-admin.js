import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'levelup-journal.db'));

const email = process.argv[2];

if (!email) {
  console.error('Usage: node grant-admin.js <user-email>');
  process.exit(1);
}

// Find user by email
db.get('SELECT id, username, display_name FROM users WHERE username = ?', [email], (err, user) => {
  if (err) {
    console.error('Error finding user:', err);
    process.exit(1);
  }

  if (!user) {
    console.error(`User with email ${email} not found`);
    process.exit(1);
  }

  console.log(`Found user: ${user.display_name} (${user.username})`);

  // Check if already admin
  db.get('SELECT * FROM user_roles WHERE user_id = ? AND role = ?', [user.id, 'admin'], (err, role) => {
    if (err) {
      console.error('Error checking admin role:', err);
      process.exit(1);
    }

    if (role) {
      console.log('User already has admin role');
      process.exit(0);
    }

    // Grant admin role
    db.run('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [user.id, 'admin'], (err) => {
      if (err) {
        console.error('Error granting admin role:', err);
        process.exit(1);
      }

      console.log(`✓ Admin role granted to ${user.display_name} (${user.username})`);
      db.close();
    });
  });
});
