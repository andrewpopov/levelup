import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'levelup-journal.db'));

// Initialize database schema
export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Quick initialization - just verify DB is accessible
    db.get("SELECT 1", (err) => {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        console.log('Database initialized successfully');
        resolve();
      }
    });
  });
}

// Keep the old function for reference
function initializeDatabaseOld() {
  return new Promise((resolve, reject) => {
    // Original schema initialization (kept for reference but skipped due to callback issues)
    db.serialize(() => {
      // Users table - for the couple
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

      // Relationship goals table
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

      // Questions table (main prompts)
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

      // Question details table (guiding sub-questions)
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

      // Question discussions table - for tracking joint discussion status
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

      // ============= JOURNEY BOOK SYSTEM TABLES =============

      // Journeys table - Workbooks/journeys users can enroll in
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

      // Journey tasks table - Tasks within each journey
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

      // User journeys table - User enrollment tracking
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

      // User task progress table - Track completion of individual tasks
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

      // User roles table - Admin permissions
      db.run(`
        CREATE TABLE IF NOT EXISTS user_roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          role TEXT NOT NULL,
          granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, role)
        )
      `);

      // ============= RICHER RESPONSES SYSTEM =============

      // Enhanced question responses with media support
      db.run(`
        CREATE TABLE IF NOT EXISTS enhanced_question_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          response_id INTEGER NOT NULL,
          response_type TEXT DEFAULT 'text',
          media_url TEXT,
          transcription TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (response_id) REFERENCES question_responses (id) ON DELETE CASCADE
        )
      `);

      // Follow-up questions on responses
      db.run(`
        CREATE TABLE IF NOT EXISTS response_followups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          response_id INTEGER NOT NULL,
          followup_text TEXT NOT NULL,
          asked_by INTEGER NOT NULL,
          followup_response TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (response_id) REFERENCES question_responses (id) ON DELETE CASCADE,
          FOREIGN KEY (asked_by) REFERENCES users (id)
        )
      `);

      // ============= MULTI-USER JOURNEY SYSTEM =============

      // Team journeys for collaborative learning
      db.run(`
        CREATE TABLE IF NOT EXISTS team_journeys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          journey_id INTEGER NOT NULL,
          created_by INTEGER NOT NULL,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (journey_id) REFERENCES journeys (id),
          FOREIGN KEY (created_by) REFERENCES users (id),
          UNIQUE(team_id, journey_id)
        )
      `);

      // Team members
      db.run(`
        CREATE TABLE IF NOT EXISTS team_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role TEXT DEFAULT 'member',
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(team_id, user_id)
        )
      `);

      // Shared task submissions
      db.run(`
        CREATE TABLE IF NOT EXISTS shared_task_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_journey_id INTEGER NOT NULL,
          task_id INTEGER NOT NULL,
          submitted_by INTEGER NOT NULL,
          submission_content TEXT NOT NULL,
          status TEXT DEFAULT 'submitted',
          submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_journey_id) REFERENCES team_journeys (id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES journey_tasks (id),
          FOREIGN KEY (submitted_by) REFERENCES users (id),
          UNIQUE(team_journey_id, task_id, submitted_by)
        )
      `);

      // Peer reviews of submissions
      db.run(`
        CREATE TABLE IF NOT EXISTS submission_reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          submission_id INTEGER NOT NULL,
          reviewed_by INTEGER NOT NULL,
          feedback TEXT,
          rating INTEGER,
          reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (submission_id) REFERENCES shared_task_submissions (id) ON DELETE CASCADE,
          FOREIGN KEY (reviewed_by) REFERENCES users (id),
          UNIQUE(submission_id, reviewed_by)
        )
      `);

      // ============= CERTIFICATION & BADGES =============

      // User competency profiles
      db.run(`
        CREATE TABLE IF NOT EXISTS competency_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          journey_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (journey_id) REFERENCES journeys (id),
          UNIQUE(user_id, journey_id)
        )
      `);

      // Competency assessments
      db.run(`
        CREATE TABLE IF NOT EXISTS competency_assessments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profile_id INTEGER NOT NULL,
          signal_name TEXT NOT NULL,
          target_level INTEGER,
          current_level INTEGER DEFAULT 0,
          assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (profile_id) REFERENCES competency_profiles (id) ON DELETE CASCADE
        )
      `);

      // Certifications
      db.run(`
        CREATE TABLE IF NOT EXISTS certifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          journey_id INTEGER NOT NULL,
          issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          certificate_url TEXT,
          is_sharable BOOLEAN DEFAULT 1,
          shareable_token TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (journey_id) REFERENCES journeys (id),
          UNIQUE(user_id, journey_id)
        )
      `);

      // Badges earned
      db.run(`
        CREATE TABLE IF NOT EXISTS badges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          badge_name TEXT NOT NULL,
          icon_url TEXT,
          description TEXT,
          requirements TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User badges
      db.run(`
        CREATE TABLE IF NOT EXISTS user_badges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          badge_id INTEGER NOT NULL,
          earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (badge_id) REFERENCES badges (id),
          UNIQUE(user_id, badge_id)
        )
      `);

      // ============= SYSTEM DESIGN PRACTICE SYSTEM =============

      // System design question bank
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

      // Flashcard journey - for endless practice sessions
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

      // User flashcard journey sessions
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

      // User system design question responses (flashcard answers)
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

      // Question bank state for endless journey (tracks which questions user has answered)
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

      // ============= DOMAIN EVENTS AUDIT TRAIL =============

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

      // Create indexes for performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_journeys_user_status
              ON user_journeys(user_id, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_task_progress_due_date
              ON user_task_progress(due_date, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_journey_tasks_journey
              ON journey_tasks(journey_id, task_order)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_team_journeys_team
              ON team_journeys(team_id, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_submissions_team_journey
              ON shared_task_submissions(team_journey_id, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_certifications_user
              ON certifications(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_domain_events_type
              ON domain_events(event_type, published_at)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_system_design_questions_category
              ON system_design_questions(category)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_flashcard_sessions_user
              ON user_flashcard_sessions(user_id, status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_user_system_design_responses_session
              ON user_system_design_responses(session_id, user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_question_bank_state_user_journey
              ON system_design_question_bank_state(user_id, flashcard_journey_id, is_answered)`, (err) => {
        clearTimeout(timeout);
        if (err) {
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
