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
      // Register a polling sequence scenario using GitHub API
      scenarist.registerScenario({
        id: 'github-polling',
        name: 'GitHub Job Polling Sequence',
        description: 'Simulates async GitHub job polling with state progression',
        mocks: [
          {
            method: 'GET',
            url: 'https://api.github.com/users/:username',
            sequence: {
              responses: [
                { status: 200, body: { status: 'pending', progress: 0, login: 'user1' } },
                { status: 200, body: { status: 'processing', progress: 50, login: 'user2' } },
                { status: 200, body: { status: 'complete', progress: 100, login: 'user3' } },
              ],
              repeat: 'last', // Stay at 'complete' after third call
            },
          },
        ],
      });

      // Switch to polling scenario
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
});
