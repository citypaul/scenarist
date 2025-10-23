import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server.js';

describe('Dynamic Response Sequences E2E (Phase 2)', () => {
  const { app, scenarist } = createApp();

  beforeAll(() => {
    scenarist.start();
  });

  afterAll(() => {
    scenarist.stop();
  });

  describe('Basic Sequence Progression', () => {
    it('should return responses in sequence order (pending → processing → complete)', async () => {
      // Switch to polling scenario (already registered in scenarios.ts)
      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, 'polling-test-1')
        .send({ scenario: 'github-polling' });

      // First call: pending
      const response1 = await request(app)
        .get('/api/github/user/testuser')
        .set(scenarist.config.headers.testId, 'polling-test-1');

      expect(response1.status).toBe(200);
      expect(response1.body).toEqual({ status: 'pending', progress: 0, login: 'user1' });

      // Second call: processing
      const response2 = await request(app)
        .get('/api/github/user/testuser')
        .set(scenarist.config.headers.testId, 'polling-test-1');

      expect(response2.status).toBe(200);
      expect(response2.body).toEqual({ status: 'processing', progress: 50, login: 'user2' });

      // Third call: complete
      const response3 = await request(app)
        .get('/api/github/user/testuser')
        .set(scenarist.config.headers.testId, 'polling-test-1');

      expect(response3.status).toBe(200);
      expect(response3.body).toEqual({ status: 'complete', progress: 100, login: 'user3' });

      // Fourth call: still complete (repeat: 'last')
      const response4 = await request(app)
        .get('/api/github/user/testuser')
        .set(scenarist.config.headers.testId, 'polling-test-1');

      expect(response4.status).toBe(200);
      expect(response4.body).toEqual({ status: 'complete', progress: 100, login: 'user3' });
    });
  });

  describe('Repeat Mode: cycle', () => {
    it('should cycle back to first response after sequence ends', async () => {
      // Switch to cycling scenario (already registered in scenarios.ts)
      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, 'cycle-test-1')
        .send({ scenario: 'weather-cycle' });

      // First cycle through
      const response1 = await request(app)
        .get('/api/weather/london')
        .set(scenarist.config.headers.testId, 'cycle-test-1');
      expect(response1.body.conditions).toBe('Sunny');

      const response2 = await request(app)
        .get('/api/weather/london')
        .set(scenarist.config.headers.testId, 'cycle-test-1');
      expect(response2.body.conditions).toBe('Cloudy');

      const response3 = await request(app)
        .get('/api/weather/london')
        .set(scenarist.config.headers.testId, 'cycle-test-1');
      expect(response3.body.conditions).toBe('Rainy');

      // Should cycle back to first response
      const response4 = await request(app)
        .get('/api/weather/london')
        .set(scenarist.config.headers.testId, 'cycle-test-1');
      expect(response4.status).toBe(200);
      expect(response4.body.conditions).toBe('Sunny');

      // Continue cycling
      const response5 = await request(app)
        .get('/api/weather/london')
        .set(scenarist.config.headers.testId, 'cycle-test-1');
      expect(response5.body.conditions).toBe('Cloudy');
    });
  });

  describe('Repeat Mode: none (with exhaustion)', () => {
    it('should fallback to next mock after sequence exhausted', async () => {
      // Switch to payment limited scenario (already registered in scenarios.ts)
      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, 'exhaust-test-1')
        .send({ scenario: 'payment-limited' });

      // First 3 calls go through sequence
      const response1 = await request(app)
        .post('/api/payment')
        .set(scenarist.config.headers.testId, 'exhaust-test-1')
        .send({ amount: 1000, currency: 'usd' });
      expect(response1.status).toBe(200);
      expect(response1.body.status).toBe('pending');

      const response2 = await request(app)
        .post('/api/payment')
        .set(scenarist.config.headers.testId, 'exhaust-test-1')
        .send({ amount: 1000, currency: 'usd' });
      expect(response2.status).toBe(200);
      expect(response2.body.status).toBe('pending');

      const response3 = await request(app)
        .post('/api/payment')
        .set(scenarist.config.headers.testId, 'exhaust-test-1')
        .send({ amount: 1000, currency: 'usd' });
      expect(response3.status).toBe(200);
      expect(response3.body.status).toBe('succeeded');

      // Fourth call: sequence exhausted, fallback to error mock
      const response4 = await request(app)
        .post('/api/payment')
        .set(scenarist.config.headers.testId, 'exhaust-test-1')
        .send({ amount: 1000, currency: 'usd' });
      expect(response4.status).toBe(429);
      expect(response4.body.error.message).toBe('Rate limit exceeded');

      // Fifth call: still uses fallback
      const response5 = await request(app)
        .post('/api/payment')
        .set(scenarist.config.headers.testId, 'exhaust-test-1')
        .send({ amount: 1000, currency: 'usd' });
      expect(response5.status).toBe(429);
    });
  });

  describe('Test ID Isolation', () => {
    it('should maintain independent sequence positions for different test IDs', async () => {
      // Register shared scenario
      scenarist.registerScenario({
        id: 'shared-polling',
        name: 'Shared Polling Sequence',
        description: 'Multiple tests can use same scenario with independent state',
        mocks: [
          {
            method: 'GET',
            url: 'https://api.github.com/users/:username',
            sequence: {
              responses: [
                { status: 200, body: { step: 1 } },
                { status: 200, body: { step: 2 } },
                { status: 200, body: { step: 3 } },
              ],
              repeat: 'last',
            },
          },
        ],
      });

      // Test ID A: Switch to scenario
      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, 'test-a')
        .send({ scenario: 'shared-polling' });

      // Test ID B: Switch to same scenario
      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, 'test-b')
        .send({ scenario: 'shared-polling' });

      // Test A: First call (step 1)
      const responseA1 = await request(app)
        .get('/api/github/user/userA')
        .set(scenarist.config.headers.testId, 'test-a');
      expect(responseA1.body.step).toBe(1);

      // Test B: First call (should also be step 1, independent state)
      const responseB1 = await request(app)
        .get('/api/github/user/userB')
        .set(scenarist.config.headers.testId, 'test-b');
      expect(responseB1.body.step).toBe(1);

      // Test A: Second call (step 2)
      const responseA2 = await request(app)
        .get('/api/github/user/userA')
        .set(scenarist.config.headers.testId, 'test-a');
      expect(responseA2.body.step).toBe(2);

      // Test B: Second call (should be step 2, not step 3)
      const responseB2 = await request(app)
        .get('/api/github/user/userB')
        .set(scenarist.config.headers.testId, 'test-b');
      expect(responseB2.body.step).toBe(2);

      // Test A: Third call (step 3)
      const responseA3 = await request(app)
        .get('/api/github/user/userA')
        .set(scenarist.config.headers.testId, 'test-a');
      expect(responseA3.body.step).toBe(3);

      // Test B: Third call (should be step 3)
      const responseB3 = await request(app)
        .get('/api/github/user/userB')
        .set(scenarist.config.headers.testId, 'test-b');
      expect(responseB3.body.step).toBe(3);

      // Both tests at step 3, both should stay there (repeat: 'last')
      const responseA4 = await request(app)
        .get('/api/github/user/userA')
        .set(scenarist.config.headers.testId, 'test-a');
      expect(responseA4.body.step).toBe(3);

      const responseB4 = await request(app)
        .get('/api/github/user/userB')
        .set(scenarist.config.headers.testId, 'test-b');
      expect(responseB4.body.step).toBe(3);
    });
  });
});
