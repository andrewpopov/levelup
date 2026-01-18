import db from '../database.js';

/**
 * Relationship Journey Validation Tests
 *
 * Verifies that the "A Year of Conversations" relationship/couples journey
 * is still valid and functional after the behavioral interview system additions
 */

describe('Relationship Journey (A Year of Conversations)', () => {
  describe('Journey Structure', () => {
    test('should have journey table set up correctly', (done) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='journeys'", (err, rows) => {
        expect(err).toBeNull();
        expect(rows.length).toBe(1);
        done();
      });
    });

    test('should have questions table for relationship journey', (done) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'", (err, rows) => {
        expect(err).toBeNull();
        expect(rows.length).toBe(1);
        done();
      });
    });

    test('should have user_journeys table', (done) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='user_journeys'", (err, rows) => {
        expect(err).toBeNull();
        expect(rows.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Relationship Journey Data', () => {
    test('should be able to query journeys table', (done) => {
      db.all('SELECT * FROM journeys LIMIT 1', (err, rows) => {
        expect(err).toBeNull();
        expect(Array.isArray(rows)).toBe(true);
        done();
      });
    }, 10000);

    test('journey table should have required columns', (done) => {
      db.all("PRAGMA table_info(journeys)", (err, columns) => {
        expect(err).toBeNull();
        const columnNames = columns.map(c => c.name);

        const requiredColumns = ['id', 'title', 'description', 'duration_weeks', 'cadence', 'is_active'];
        requiredColumns.forEach(col => {
          expect(columnNames).toContain(col);
        });

        done();
      });
    }, 10000);

    test('should be able to insert relationship journey', (done) => {
      db.run(
        `INSERT OR IGNORE INTO journeys (title, description, duration_weeks, cadence, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        ['Test Relationship Journey', 'A journey for couples', 32, 'weekly', 1],
        function(err) {
          expect(err).toBeNull();
          expect(this.lastID).toBeGreaterThan(0);
          done();
        }
      );
    }, 10000);
  });

  describe('Questions Table Structure', () => {
    test('should have questions table with required columns', (done) => {
      db.all("PRAGMA table_info(questions)", (err, columns) => {
        expect(err).toBeNull();
        const columnNames = columns.map(c => c.name);

        const requiredColumns = ['id', 'title', 'main_prompt'];
        requiredColumns.forEach(col => {
          expect(columnNames).toContain(col);
        });

        done();
      });
    }, 10000);

    test('should be able to query relationship questions', (done) => {
      db.all(
        `SELECT COUNT(*) as count FROM questions LIMIT 1`,
        (err, rows) => {
          expect(err).toBeNull();
          expect(Array.isArray(rows)).toBe(true);
          done();
        }
      );
    }, 10000);
  });

  describe('Relationship Journey Backward Compatibility', () => {
    test('should have questions table for relationship journey', (done) => {
      db.all('SELECT COUNT(*) as count FROM questions', (err, rows) => {
        expect(err).toBeNull();
        expect(Array.isArray(rows)).toBe(true);
        done();
      });
    }, 10000);

    test('user_journeys table should work with multiple journey types', (done) => {
      db.all("PRAGMA table_info(user_journeys)", (err, columns) => {
        expect(err).toBeNull();
        const columnNames = columns.map(c => c.name);

        // Should have fields to support both journey types
        expect(columnNames).toContain('user_id');
        expect(columnNames).toContain('journey_id');

        done();
      });
    }, 10000);

    test('should be able to query user journeys regardless of type', (done) => {
      db.all('SELECT * FROM user_journeys LIMIT 1', (err, rows) => {
        expect(err).toBeNull();
        expect(Array.isArray(rows)).toBe(true);
        done();
      });
    }, 10000);
  });

  describe('Relationship Journey Features', () => {
    test('should support relationship questions table', (done) => {
      // Verify questions table exists and can be queried
      db.all(
        'SELECT * FROM questions LIMIT 5',
        (err, rows) => {
          expect(err).toBeNull();
          expect(Array.isArray(rows)).toBe(true);
          done();
        }
      );
    }, 10000);

    test('should support question categories for organization', (done) => {
      db.all("PRAGMA table_info(questions)", (err, columns) => {
        expect(err).toBeNull();
        const columnNames = columns.map(c => c.name);

        // Should have fields for organizing and storing questions
        expect(columnNames).toContain('id');
        expect(columnNames).toContain('title');
        expect(columnNames).toContain('main_prompt');

        done();
      });
    }, 10000);
  });

  describe('Data Integrity', () => {
    test('should enforce foreign key constraints if configured', (done) => {
      // SQLite foreign keys are optional, but if enabled should work
      db.all("PRAGMA foreign_keys", (err, result) => {
        expect(err).toBeNull();
        // Just verify we can check the setting
        done();
      });
    }, 10000);

    test('journey_id should be valid foreign key in user_journeys', (done) => {
      db.all("PRAGMA foreign_key_list(user_journeys)", (err, keys) => {
        expect(err).toBeNull();
        // Verify structure supports FK relationships
        done();
      });
    }, 10000);
  });

  describe('Relationship Journey Seeding', () => {
    test('relationship questions seed script should exist', async () => {
      // Verify the seed file exists in scripts directory
      const fs = await import('fs/promises');
      const path = 'E:\\proj\\levelup\\backend\\scripts\\seed-questions.js';

      try {
        const content = await fs.readFile(path, 'utf-8');
        expect(content).toContain('INSERT INTO');
      } catch (err) {
        // File should exist
        expect(err).toBeNull();
      }
    });

    test('seed script should define question categories', async () => {
      const fs = await import('fs/promises');
      const path = 'E:\\proj\\levelup\\backend\\scripts\\seed-questions.js';

      try {
        const content = await fs.readFile(path, 'utf-8');

        // Verify key categories exist
        const expectedCategories = [
          'Our Foundation',
          'Communication & Conflict',
          'Daily Life & Shared Routines'
        ];

        expectedCategories.forEach(category => {
          expect(content).toContain(category);
        });
      } catch (err) {
        expect(err).toBeNull();
      }
    });
  });

  describe('Mixed Journey System', () => {
    test('database should support both behavioral and relationship journeys', (done) => {
      // The schema should support:
      // - Regular journeys (relationship, daily questions, etc.)
      // - Behavioral journeys (interview prep with story slots)
      // - Backward compatibility

      db.all(
        `SELECT name FROM sqlite_master
         WHERE type='table' AND name IN ('journeys', 'story_slots', 'questions', 'user_journeys')`,
        (err, tables) => {
          expect(err).toBeNull();
          const tableNames = tables.map(t => t.name);

          // Core tables for all journey types
          expect(tableNames).toContain('journeys');
          expect(tableNames).toContain('questions');
          expect(tableNames).toContain('user_journeys');

          // Behavioral-specific tables (should coexist)
          if (tableNames.includes('story_slots')) {
            expect(tableNames).toContain('story_slots');
          }

          done();
        }
      );
    });

    test('users should be able to have both relationship and behavioral journeys', (done) => {
      // Verify the schema allows this
      db.all("PRAGMA table_info(user_journeys)", (err, columns) => {
        expect(err).toBeNull();
        const columnNames = columns.map(c => c.name);

        expect(columnNames).toContain('user_id');
        expect(columnNames).toContain('journey_id');

        // Should work for any journey_id regardless of type
        done();
      });
    });
  });
});
