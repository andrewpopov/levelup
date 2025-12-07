import db from '../database.js';

/**
 * Migration/Seed Script: Create Default Journey
 *
 * This script:
 * 1. Creates the default "52 Week Couples Guide" journey
 * 2. Migrates all existing questions as journey tasks
 * 3. Auto-enrolls existing users in the journey
 * 4. Links existing progress to journey tasks
 *
 * NOTE: This script is kept for backward compatibility.
 * New implementations should use seed-journeys.js with the JSON config.
 */

async function seedDefaultJourney() {
  console.log('Starting journey migration...\n');

  try {
    // Step 1: Check if default journey already exists
    const existingJourney = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM journeys WHERE is_default = 1',
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingJourney) {
      console.log('✓ Default journey already exists');
      console.log(`  Journey ID: ${existingJourney.id}`);
      console.log(`  Title: ${existingJourney.title}\n`);
      return existingJourney.id;
    }

    // Step 2: Create default journey
    console.log('Creating default journey...');
    const journeyId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO journeys (
          title,
          description,
          duration_weeks,
          cadence,
          is_active,
          is_default
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'A Year of Conversations',
          'A thoughtfully curated collection of 32 meaningful conversations designed to deepen your connection, understanding, and love. Each week brings new insights into your partner and your relationship.',
          32,
          'weekly',
          1,
          1
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    console.log(`✓ Created journey (ID: ${journeyId})\n`);

    // Step 3: Get all questions
    console.log('Fetching existing questions...');
    const questions = await new Promise((resolve, reject) => {
      db.all(
        `SELECT q.*, c.name as category_name
         FROM questions q
         JOIN question_categories c ON q.category_id = c.id
         ORDER BY q.week_number`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`✓ Found ${questions.length} questions\n`);

    // Step 4: Create journey tasks from questions
    console.log('Creating journey tasks...');
    let tasksCreated = 0;

    for (const question of questions) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO journey_tasks (
            journey_id,
            task_order,
            title,
            description,
            task_type,
            question_id,
            estimated_time_minutes,
            page_number,
            chapter_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            journeyId,
            question.week_number,
            question.title,
            question.main_prompt,
            'question',
            question.id,
            30, // Estimated 30 minutes per question task
            question.week_number,
            question.category_name
          ],
          (err) => {
            if (err) reject(err);
            else {
              tasksCreated++;
              resolve();
            }
          }
        );
      });
    }

    console.log(`✓ Created ${tasksCreated} journey tasks\n`);

    // Step 5: Get all users
    console.log('Fetching users...');
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`✓ Found ${users.length} users\n`);

    // Step 6: Auto-enroll existing users
    console.log('Auto-enrolling users in default journey...');
    let usersEnrolled = 0;

    for (const user of users) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO user_journeys (
            user_id,
            journey_id,
            start_date,
            status
          ) VALUES (?, ?, ?, ?)`,
          [
            user.id,
            journeyId,
            user.created_at, // Start from when they joined
            'active'
          ],
          (err) => {
            if (err) reject(err);
            else {
              usersEnrolled++;
              resolve();
            }
          }
        );
      });
    }

    console.log(`✓ Enrolled ${usersEnrolled} users\n`);

    // Step 7: Link existing progress to journey tasks
    console.log('Migrating existing progress...');

    // Get all user journeys for the default journey
    const userJourneys = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM user_journeys WHERE journey_id = ?',
        [journeyId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    let progressEntriesCreated = 0;

    for (const userJourney of userJourneys) {
      // Get all responses for this user
      const responses = await new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM question_responses WHERE user_id = ?',
          [userJourney.user_id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Create progress entries for each response
      for (const response of responses) {
        // Find the corresponding journey task
        const task = await new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM journey_tasks WHERE journey_id = ? AND question_id = ?',
            [journeyId, response.question_id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (task) {
          // Check if discussion exists for this question
          const discussion = await new Promise((resolve, reject) => {
            db.get(
              'SELECT * FROM question_discussions WHERE question_id = ?',
              [response.question_id],
              (err, row) => {
                if (err) reject(err);
                else resolve(row);
              }
            );
          });

          // Calculate due date based on journey start date and task order
          const startDate = new Date(userJourney.start_date);
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + (task.task_order - 1) * 7); // Weekly cadence

          // Determine status
          let status = 'in_progress';
          let completedAt = null;

          if (discussion && discussion.discussed_at) {
            status = 'completed';
            completedAt = discussion.discussed_at;
          }

          // Create or update task progress
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT OR REPLACE INTO user_task_progress (
                user_journey_id,
                task_id,
                user_id,
                status,
                due_date,
                started_at,
                completed_at,
                question_response_id,
                discussion_id
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                userJourney.id,
                task.id,
                userJourney.user_id,
                status,
                dueDate.toISOString().split('T')[0],
                response.created_at,
                completedAt,
                response.id,
                discussion ? discussion.id : null
              ],
              (err) => {
                if (err) reject(err);
                else {
                  progressEntriesCreated++;
                  resolve();
                }
              }
            );
          });
        }
      }

      // Update journey progress percentage
      const completedTasks = await new Promise((resolve, reject) => {
        db.get(
          `SELECT COUNT(*) as count
           FROM user_task_progress
           WHERE user_journey_id = ? AND status = 'completed'`,
          [userJourney.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
          }
        );
      });

      const totalTasks = questions.length;
      const percentage = (completedTasks / totalTasks) * 100;

      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE user_journeys SET completion_percentage = ? WHERE id = ?',
          [percentage, userJourney.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    console.log(`✓ Created ${progressEntriesCreated} progress entries\n`);

    console.log('='.repeat(50));
    console.log('✓ MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Journey ID: ${journeyId}`);
    console.log(`Tasks Created: ${tasksCreated}`);
    console.log(`Users Enrolled: ${usersEnrolled}`);
    console.log(`Progress Entries: ${progressEntriesCreated}`);
    console.log('='.repeat(50));

    return journeyId;

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDefaultJourney()
    .then(() => {
      console.log('\nMigration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration failed:', error);
      process.exit(1);
    });
}

export default seedDefaultJourney;
