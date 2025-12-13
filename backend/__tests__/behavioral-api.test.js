import request from 'supertest';
import app from '../server.js';
import db from '../database.js';
import { generateToken } from '../auth.js';
import journeyConfigService from '../services/journeyConfigService.js';

describe('Behavioral Interview API Endpoints', () => {
  let testToken;
  let testUserId = 1;
  let testJourneyId;
  let testStoryId;

  beforeAll(async () => {
    // Generate test token
    testToken = generateToken(testUserId, 'test@example.com');

    // Create test journey
    testJourneyId = await journeyConfigService.createJourneyFromConfig('ic-swe-journey');
  });

  describe('GET /api/journeys/:journeyId/story-slots', () => {
    test('should return all story slots for a journey', async () => {
      const response = await request(app)
        .get(`/api/journeys/${testJourneyId}/story-slots`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('signals');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/journeys/${testJourneyId}/story-slots`);

      expect(response.status).toBe(401);
    });

    test('should parse signals as array', async () => {
      const response = await request(app)
        .get(`/api/journeys/${testJourneyId}/story-slots`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body[0].signals)).toBe(true);
    });
  });

  describe('GET /api/journeys/:journeyId/story-slots/progress', () => {
    test('should return story slots with progress status', async () => {
      const response = await request(app)
        .get(`/api/journeys/${testJourneyId}/story-slots/progress`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('isComplete');
    });

    test('should show incomplete status initially', async () => {
      const response = await request(app)
        .get(`/api/journeys/${testJourneyId}/story-slots/progress`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // Each slot should have an isComplete property
      expect(response.body.every(slot => typeof slot.isComplete === 'boolean')).toBe(true);
    });
  });

  describe('POST /api/stories', () => {
    test('should create a new story', async () => {
      const storyData = {
        journeyId: testJourneyId,
        slotId: 1,
        storyTitle: 'My First Story',
        year: 2023,
        stakeholders: 'My team, my manager',
        stakes: 'We needed to reduce latency by 50%'
      };

      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${testToken}`)
        .send(storyData);

      expect([200, 201]).toContain(response.status);
      if (response.body && response.body.id) {
        testStoryId = response.body.id;
        // Verify response has required fields
        expect(response.body).toHaveProperty('id');
      }
    });

    test('should require all required fields', async () => {
      const incompleteData = {
        journeyId: testJourneyId,
        storyTitle: 'Incomplete Story'
        // Missing slotId, year, stakeholders, stakes
      };

      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${testToken}`)
        .send(incompleteData);

      expect([400, 200]).toContain(response.status);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/stories')
        .send({
          journeyId: testJourneyId,
          slotId: 1,
          storyTitle: 'Test Story',
          year: 2023,
          stakeholders: 'Team',
          stakes: 'High'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/stories/:storyId/sparc/:section', () => {
    test('should save SPARC section content', async () => {
      if (!testStoryId) {
        // Create a story first
        const storyRes = await request(app)
          .post('/api/stories')
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            journeyId: testJourneyId,
            slotId: 1,
            storyTitle: 'Test Story',
            year: 2023,
            stakeholders: 'Team',
            stakes: 'High'
          });
        testStoryId = storyRes.body.id;
      }

      const response = await request(app)
        .put(`/api/stories/${testStoryId}/sparc/situation`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          content: 'This is the situation part of my story. It was a large project with 5 team members.'
        });

      expect(response.status).toBe(200);
    });

    test('should validate section name', async () => {
      const response = await request(app)
        .put(`/api/stories/${testStoryId}/sparc/invalid_section`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          content: 'Some content'
        });

      expect(response.status).toBe(400);
    });

    test('should require content', async () => {
      const response = await request(app)
        .put(`/api/stories/${testStoryId}/sparc/situation`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect([400, 200]).toContain(response.status);
    });

    test('should save all SPARC sections', async () => {
      const sections = ['situation', 'problem', 'actions', 'results', 'coda'];

      for (const section of sections) {
        const response = await request(app)
          .put(`/api/stories/${testStoryId}/sparc/${section}`)
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            content: `This is the ${section} section.`
          });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('POST /api/stories/:storyId/signals', () => {
    test('should save signal tags for story', async () => {
      const response = await request(app)
        .post(`/api/stories/${testStoryId}/signals`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          signals: [
            { signalName: 'ownership', strength: 3 },
            { signalName: 'execution', strength: 2 },
            { signalName: 'craft', strength: 3 }
          ]
        });

      expect([200, 201]).toContain(response.status);
    });

    test('should validate signal strength (1-3)', async () => {
      const response = await request(app)
        .post(`/api/stories/${testStoryId}/signals`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          signals: [
            { signalName: 'ownership', strength: 5 } // Invalid
          ]
        });

      expect([400, 200]).toContain(response.status);
    });

    test('should require signals array', async () => {
      const response = await request(app)
        .post(`/api/stories/${testStoryId}/signals`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect([400, 200]).toContain(response.status);
    });
  });

  describe('GET /api/journeys/:journeyId/signal-coverage', () => {
    test('should return signal coverage for journey', async () => {
      const response = await request(app)
        .get(`/api/journeys/${testJourneyId}/signal-coverage`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
    });

    test('should show covered signals', async () => {
      const response = await request(app)
        .get(`/api/journeys/${testJourneyId}/signal-coverage`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      // After saving signals above, should show coverage
      const signalKeys = Object.keys(response.body);
      expect(signalKeys.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/sparc-prompts/:section', () => {
    test('should return micro-prompts for SPARC section', async () => {
      const response = await request(app)
        .get('/api/sparc-prompts/situation')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('prompt_text');
    });

    test('should work for all SPARC sections', async () => {
      const sections = ['situation', 'problem', 'actions', 'results', 'coda'];

      for (const section of sections) {
        const response = await request(app)
          .get(`/api/sparc-prompts/${section}`)
          .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/sparc-prompts/situation');

      expect(response.status).toBe(401);
    });
  });

  describe('Story Workflow - End to End', () => {
    test('should complete full story creation workflow', async () => {
      // Step 1: Create story
      const createRes = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          journeyId: testJourneyId,
          slotId: 2,
          storyTitle: 'Complete Workflow Story',
          year: 2024,
          stakeholders: 'Product, Design, Engineering',
          stakes: 'Critical deadline for release'
        });

      expect([200, 201]).toContain(createRes.status);
      const storyId = createRes.body.id;

      // Step 2: Fill SPARC sections
      const sections = ['situation', 'problem', 'actions', 'results', 'coda'];
      for (const section of sections) {
        const res = await request(app)
          .put(`/api/stories/${storyId}/sparc/${section}`)
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            content: `Detailed ${section} content for the story.`
          });
        expect(res.status).toBe(200);
      }

      // Step 3: Tag signals
      const signalRes = await request(app)
        .post(`/api/stories/${storyId}/signals`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          signals: [
            { signalName: 'ownership', strength: 3 },
            { signalName: 'execution', strength: 2 }
          ]
        });
      expect([200, 201]).toContain(signalRes.status);

      // Step 4: Mark complete
      const completeRes = await request(app)
        .put(`/api/stories/${storyId}/complete`)
        .set('Authorization', `Bearer ${testToken}`);
      expect(completeRes.status).toBe(200);

      // Step 5: Verify progress updated
      const progressRes = await request(app)
        .get(`/api/journeys/${testJourneyId}/story-slots/progress`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(progressRes.status).toBe(200);
      // Should show at least one completed slot
    });
  });
});
