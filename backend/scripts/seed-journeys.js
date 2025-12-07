import db from '../database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Seed Script: Load Journey Data from Configuration
 *
 * This script:
 * 1. Loads journey seed data from journeys/data/seed-journeys.json
 * 2. Creates journeys, questions, categories, and tasks
 * 3. Can be run multiple times (checks for existing data)
 */

function loadSeedData() {
  try {
    const seedPath = join(__dirname, '../journeys/data/seed-journeys.json');
    const seedContent = readFileSync(seedPath, 'utf-8');
    return JSON.parse(seedContent);
  } catch (error) {
    throw new Error(`Failed to load seed data: ${error.message}`);
  }
}

async function seedJourneys() {
  console.log('Starting journey seed from configuration...\n');

  try {
    const seedData = loadSeedData();
    let totalJourneysCreated = 0;
    let totalQuestionsCreated = 0;
    let totalTasksCreated = 0;

    for (const journey of seedData.journeys) {
      console.log(`Processing journey: ${journey.title}`);

      // Check if journey already exists
      const existingJourney = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM journeys WHERE title = ?',
          [journey.title],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingJourney) {
        console.log(`  ⚠ Journey already exists (ID: ${existingJourney.id})`);
        continue;
      }

      // Step 1: Create journey
      const journeyId = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO journeys (
            title,
            description,
            duration_weeks,
            cadence,
            is_active,
            is_default,
            created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            journey.title,
            journey.description,
            journey.duration_weeks,
            journey.cadence,
            journey.is_active ? 1 : 0,
            journey.is_default ? 1 : 0,
            journey.created_by || 'system'
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      console.log(`  ✓ Created journey (ID: ${journeyId})`);
      totalJourneysCreated++;

      // Step 2: Process categories and questions
      const categories = [...new Set(journey.questions.map(q => q.category))];
      const categoryMap = {};

      // Create or get categories
      for (const categoryName of categories) {
        const existing = await new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM question_categories WHERE name = ?',
            [categoryName],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (existing) {
          categoryMap[categoryName] = existing.id;
        } else {
          const categoryId = await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO question_categories (name, description, display_order) VALUES (?, ?, ?)',
              [categoryName, `Questions for ${categoryName}`, Object.keys(categoryMap).length],
              function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
              }
            );
          });
          categoryMap[categoryName] = categoryId;
        }
      }

      // Step 3: Create questions and tasks
      for (const question of journey.questions) {
        const categoryId = categoryMap[question.category];

        // Create question
        const questionId = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO questions (
              category_id,
              week_number,
              title,
              main_prompt
            ) VALUES (?, ?, ?, ?)`,
            [categoryId, question.week, question.title, question.prompt],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });

        totalQuestionsCreated++;

        // Create question details
        for (let i = 0; i < question.details.length; i++) {
          await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO question_details (question_id, detail_text, display_order) VALUES (?, ?, ?)',
              [questionId, question.details[i], i + 1],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }

        // Create journey task
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
              question.week,
              question.title,
              question.prompt,
              'question',
              questionId,
              30,
              question.week,
              question.category
            ],
            (err) => {
              if (err) reject(err);
              else {
                totalTasksCreated++;
                resolve();
              }
            }
          );
        });
      }

      console.log(`  ✓ Created ${journey.questions.length} questions and tasks\n`);
    }

    console.log('='.repeat(60));
    console.log('✓ JOURNEY SEED COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Journeys Created: ${totalJourneysCreated}`);
    console.log(`Questions Created: ${totalQuestionsCreated}`);
    console.log(`Tasks Created: ${totalTasksCreated}`);
    console.log('='.repeat(60));

    return { totalJourneysCreated, totalQuestionsCreated, totalTasksCreated };

  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedJourneys()
    .then(() => {
      console.log('\nSeed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nSeed failed:', error);
      process.exit(1);
    });
}

export default seedJourneys;
