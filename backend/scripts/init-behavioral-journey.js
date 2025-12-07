import journeyConfigService from '../services/journeyConfigService.js';

/**
 * Initialize the Behavioral Interview Journey
 *
 * This script:
 * 1. Creates the IC SWE behavioral interview journey from config
 * 2. Seeds micro-prompts for SPARC framework
 * 3. Loads signal definitions
 */

async function initializeBehavioralJourney() {
  console.log('Initializing Behavioral Interview Journey System...\n');

  try {
    // 1. Load signals
    console.log('Loading signal definitions...');
    const signals = await journeyConfigService.loadSignals();
    console.log(`✓ Loaded ${signals.signals.length} competency signals`);
    console.log(`✓ Loaded ${signals.company_archetypes.length} company archetypes`);
    console.log(`✓ Loaded ${signals.roles.length} role definitions\n`);

    // 2. Create journey from config
    console.log('Creating IC SWE journey from config...');
    const journeyId = await journeyConfigService.createJourneyFromConfig('ic-swe-journey');
    console.log(`✓ Journey created with ID: ${journeyId}\n`);

    // 3. Seed micro-prompts
    console.log('Seeding SPARC micro-prompts...');
    await journeyConfigService.seedMicroPrompts('ic-swe-journey');
    console.log();

    // 4. Get and display story slots
    console.log('Story slots created:');
    const slots = await journeyConfigService.getStorySlots(journeyId);
    slots.forEach(slot => {
      console.log(`  ${slot.display_order}. ${slot.title}`);
      console.log(`     Signals: ${JSON.parse(slot.signals).join(', ')}`);
      console.log(`     Framework: ${slot.framework} (${slot.estimated_minutes} min)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✓ BEHAVIORAL INTERVIEW JOURNEY INITIALIZED!');
    console.log('='.repeat(60));
    console.log(`Journey ID: ${journeyId}`);
    console.log(`Story Slots: ${slots.length}`);
    console.log(`Config-driven: Yes`);
    console.log('='.repeat(60));

    return journeyId;

  } catch (error) {
    console.error('Error initializing journey:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeBehavioralJourney()
    .then(() => {
      console.log('\nInitialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nInitialization failed:', error);
      process.exit(1);
    });
}

export default initializeBehavioralJourney;
