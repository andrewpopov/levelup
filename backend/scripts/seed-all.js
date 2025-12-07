/**
 * Master Seed Script
 *
 * Orchestrates all database seeding operations for the LevelUp application.
 * Run this script to set up a complete database from scratch.
 */

import seedJourneys from './seed-journeys.js';
import seedDefaultJourney from './seed-default-journey.js';
import initializeBehavioralJourney from './init-behavioral-journey.js';

async function seedAll() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║        LevelUp Database Seeding - All Schemas         ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Seed journeys from JSON config
    console.log('\n--- Step 1: Seeding Journeys ---');
    console.log('Loading journey data from seed configuration...\n');
    const journeyResults = await seedJourneys();

    // Step 2: Initialize default journey (if needed)
    console.log('\n--- Step 2: Setting Up Default Journey ---');
    console.log('Migrating existing data and enrolling users...\n');
    const defaultJourneyId = await seedDefaultJourney();

    // Step 3: Initialize behavioral interview journey
    console.log('\n--- Step 3: Initializing Behavioral Interview System ---');
    console.log('Setting up IC SWE interview prep journeys...\n');
    const behavioralJourneyId = await initializeBehavioralJourney();

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║              ✓ ALL SEEDING COMPLETE! ✓               ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('Summary:');
    console.log(`  • Journeys Created: ${journeyResults.totalJourneysCreated}`);
    console.log(`  • Questions Created: ${journeyResults.totalQuestionsCreated}`);
    console.log(`  • Tasks Created: ${journeyResults.totalTasksCreated}`);
    console.log(`  • Default Journey ID: ${defaultJourneyId}`);
    console.log(`  • Behavioral Journey ID: ${behavioralJourneyId}`);
    console.log('\nDatabase is ready to use! 🎉\n');

    return {
      journeyResults,
      defaultJourneyId,
      behavioralJourneyId
    };

  } catch (error) {
    console.error('\n❌ SEEDING FAILED!\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAll()
    .then(() => {
      console.log('Exiting with success status...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export default seedAll;
