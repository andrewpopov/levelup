/**
 * Database initialization script
 * Creates all necessary tables for the application
 */

import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../levelup-journal.db');

const db = new sqlite3.Database(dbPath);

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          display_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // System design questions table
      db.run(`
        CREATE TABLE IF NOT EXISTS system_design_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_key TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          prompt TEXT NOT NULL,
          guided_answer TEXT NOT NULL,
          category TEXT NOT NULL,
          difficulty TEXT DEFAULT 'medium',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Flashcard journeys table
      db.run(`
        CREATE TABLE IF NOT EXISTS flashcard_journeys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          question_category TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // User flashcard sessions
      db.run(`
        CREATE TABLE IF NOT EXISTS user_flashcard_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          flashcard_journey_id INTEGER NOT NULL,
          session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
          session_end DATETIME,
          status TEXT DEFAULT 'active',
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (flashcard_journey_id) REFERENCES flashcard_journeys (id) ON DELETE CASCADE
        )
      `);

      // User system design responses
      db.run(`
        CREATE TABLE IF NOT EXISTS user_system_design_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          session_id INTEGER NOT NULL,
          user_answer TEXT NOT NULL,
          is_answered BOOLEAN DEFAULT 1,
          answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          viewed_guided_answer BOOLEAN DEFAULT 0,
          viewed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (question_id) REFERENCES system_design_questions (id),
          FOREIGN KEY (session_id) REFERENCES user_flashcard_sessions (id) ON DELETE CASCADE,
          UNIQUE(session_id, question_id, user_id)
        )
      `);

      // Question bank state
      db.run(`
        CREATE TABLE IF NOT EXISTS system_design_question_bank_state (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          flashcard_journey_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          is_answered BOOLEAN DEFAULT 0,
          answer_count INTEGER DEFAULT 0,
          first_answered_at DATETIME,
          last_answered_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (flashcard_journey_id) REFERENCES flashcard_journeys (id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES system_design_questions (id),
          UNIQUE(user_id, flashcard_journey_id, question_id)
        )
      `);

      // Create indexes
      db.run(`CREATE INDEX IF NOT EXISTS idx_system_design_questions_category
              ON system_design_questions(category)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_flashcard_sessions_user
              ON user_flashcard_sessions(user_id, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_system_design_responses_session
              ON user_system_design_responses(session_id, user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_question_bank_state_user_journey
              ON system_design_question_bank_state(user_id, flashcard_journey_id, is_answered)`, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✓ Database tables created successfully');
          resolve();
        }
      });
    });
  });
}

async function main() {
  try {
    console.log('Initializing database...');
    await createTables();
    console.log('✓ Database initialization complete');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

main();
