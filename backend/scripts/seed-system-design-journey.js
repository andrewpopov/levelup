/**
 * Seed script for System Design Practice Journey
 * Loads all system design questions from the template JSON
 */

import SystemDesignService from '../services/SystemDesignService.js';

async function seedSystemDesignJourney() {
  try {
    console.log('Starting system design journey setup...');

    // Seed questions
    console.log('Seeding system design questions...');
    const questionCount = await SystemDesignService.seedSystemDesignQuestions();
    console.log(`✓ Successfully seeded ${questionCount} system design questions`);

    console.log('\n✓ System design journey setup complete!');
    console.log('\nTo use the system design practice:');
    console.log('1. POST /api/system-design/journeys with userId to create a journey');
    console.log('2. POST /api/system-design/journeys/{journeyId}/sessions to start a session');
    console.log('3. GET /api/system-design/sessions/{sessionId}/next-question to get a question');
    console.log('4. POST /api/system-design/sessions/{sessionId}/submit-answer to answer');
    console.log('5. GET /api/system-design/sessions/{sessionId}/questions/{questionId}/guided-answer to reveal answer');
    console.log('6. Keep going! Questions are endless - you\'ll cycle through all questions');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding system design journey:', err);
    process.exit(1);
  }
}

// Run the seed
seedSystemDesignJourney();
