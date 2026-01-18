import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'levelup-journal.db'));

// Initialize database schema
export function initializeDatabase() {
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

      // Journal entries table
      db.run(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT,
          content TEXT NOT NULL,
          entry_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Memories/Photos table
      db.run(`
        CREATE TABLE IF NOT EXISTS memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          photo_path TEXT,
          memory_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Gratitude entries table
      db.run(`
        CREATE TABLE IF NOT EXISTS gratitude_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          entry_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Goals table
      db.run(`
        CREATE TABLE IF NOT EXISTS goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          target_date DATE,
          status TEXT DEFAULT 'active',
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Question categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS question_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          display_order INTEGER NOT NULL
        )
      `);

      // Questions table
      db.run(`
        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL,
          week_number INTEGER NOT NULL,
          title TEXT NOT NULL,
          main_prompt TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES question_categories (id)
        )
      `);

      // Question details table
      db.run(`
        CREATE TABLE IF NOT EXISTS question_details (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_id INTEGER NOT NULL,
          detail_text TEXT NOT NULL,
          display_order INTEGER NOT NULL,
          FOREIGN KEY (question_id) REFERENCES questions (id)
        )
      `);

      // Question responses table
      db.run(`
        CREATE TABLE IF NOT EXISTS question_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          response_text TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (question_id) REFERENCES questions (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(question_id, user_id)
        )
      `);

      // Question discussions table
      db.run(`
        CREATE TABLE IF NOT EXISTS question_discussions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_id INTEGER NOT NULL UNIQUE,
          discussed_at DATETIME,
          joint_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (question_id) REFERENCES questions (id)
        )
      `);

      // Journeys table
      db.run(`
        CREATE TABLE IF NOT EXISTS journeys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          cover_image_url TEXT,
          duration_weeks INTEGER NOT NULL,
          cadence TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          is_default BOOLEAN DEFAULT 0,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Journey tasks table
      db.run(`
        CREATE TABLE IF NOT EXISTS journey_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          journey_id INTEGER NOT NULL,
          task_order INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          task_type TEXT NOT NULL,
          question_id INTEGER,
          estimated_time_minutes INTEGER,
          page_number INTEGER NOT NULL,
          chapter_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (journey_id) REFERENCES journeys (id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions (id),
          UNIQUE(journey_id, task_order)
        )
      `);

      // User journeys table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_journeys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          journey_id INTEGER NOT NULL,
          enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          start_date DATE NOT NULL,
          current_task_id INTEGER,
          status TEXT DEFAULT 'active',
          completion_percentage REAL DEFAULT 0,
          completed_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (journey_id) REFERENCES journeys (id),
          FOREIGN KEY (current_task_id) REFERENCES journey_tasks (id),
          UNIQUE(user_id, journey_id)
        )
      `);

      // User task progress table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_task_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_journey_id INTEGER NOT NULL,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          due_date DATE,
          started_at DATETIME,
          completed_at DATETIME,
          is_overdue BOOLEAN DEFAULT 0,
          question_response_id INTEGER,
          discussion_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_journey_id) REFERENCES user_journeys (id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES journey_tasks (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (question_response_id) REFERENCES question_responses (id),
          FOREIGN KEY (discussion_id) REFERENCES question_discussions (id),
          UNIQUE(user_journey_id, task_id, user_id)
        )
      `);

      // User stories table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_stories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          journey_id INTEGER NOT NULL,
          slot_id INTEGER,
          story_title TEXT NOT NULL,
          year TEXT,
          stakeholders TEXT,
          stakes TEXT,
          framework TEXT DEFAULT 'SPARC',
          situation TEXT,
          problem TEXT,
          actions TEXT,
          results TEXT,
          coda TEXT,
          is_complete BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (journey_id) REFERENCES journeys (id)
        )
      `);

      // Story signals table
      db.run(`
        CREATE TABLE IF NOT EXISTS story_signals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          story_id INTEGER NOT NULL,
          signal_name TEXT NOT NULL,
          strength INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (story_id) REFERENCES user_stories (id) ON DELETE CASCADE
        )
      `);

      // Story slots table
      db.run(`
        CREATE TABLE IF NOT EXISTS story_slots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          journey_id INTEGER NOT NULL,
          slot_key TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          signals TEXT,
          framework TEXT DEFAULT 'SPARC',
          estimated_minutes INTEGER DEFAULT 45,
          display_order INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (journey_id) REFERENCES journeys (id) ON DELETE CASCADE
        )
      `);

      // Journey configs table
      db.run(`
        CREATE TABLE IF NOT EXISTS journey_configs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          config_file TEXT NOT NULL,
          parsed_config TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Micro prompts table
      db.run(`
        CREATE TABLE IF NOT EXISTS micro_prompts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          section TEXT NOT NULL,
          prompt_text TEXT NOT NULL,
          display_order INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT 1,
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

      // User flashcard sessions table
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

      // User system design responses table
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

      // System design question bank state table
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

      // Domain events table
      db.run(`
        CREATE TABLE IF NOT EXISTS domain_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          event_data TEXT,
          aggregate_id INTEGER,
          aggregate_type TEXT,
          published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          processed BOOLEAN DEFAULT 0
        )
      `);

      // Create indexes
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_journeys_user_status ON user_journeys(user_id, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_task_progress_due_date ON user_task_progress(due_date, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_journey_tasks_journey ON journey_tasks(journey_id, task_order)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_system_design_questions_category ON system_design_questions(category)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_flashcard_sessions_user ON user_flashcard_sessions(user_id, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_type ON domain_events(event_type, published_at)`, (err) => {
        if (err) {
          console.error('Database initialization error:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  });
}

export default db;
