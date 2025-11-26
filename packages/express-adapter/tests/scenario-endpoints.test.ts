import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createScenarioEndpoints } from '../src/endpoints/scenario-endpoints.js';
import { mockConfig, mockScenarioManager } from './test-helpers.js';

describe('Scenario Endpoints', () => {
  describe('POST /__scenario__', () => {
    it('should set scenario successfully', async () => {
      const config = mockConfig();
      const manager = mockScenarioManager({
        switchScenario: () => ({ success: true, data: undefined }),
      });

      const router = createScenarioEndpoints(manager, config);
      const app = express();
      app.use(express.json());
      app.use(router!);

      const response = await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({ scenario: 'happy-path' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        testId: 'test-123',
        scenarioId: 'happy-path',
      });
    });

    it('should return 400 when scenario is missing', async () => {
      const config = mockConfig();
      const manager = mockScenarioManager();

      const router = createScenarioEndpoints(manager, config);
      const app = express();
      app.use(express.json());
      app.use(router!);

      const response = await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid request body');
    });

    it('should return 400 with validation details when request body is invalid', async () => {
      const config = mockConfig();
      const manager = mockScenarioManager();

      const router = createScenarioEndpoints(manager, config);
      const app = express();
      app.use(express.json());
      app.use(router!);

      // Send invalid data: scenario is a number instead of string
      const response = await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({ scenario: 123 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Invalid request body',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: expect.any(Array),
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should return 400 when scenario switch fails', async () => {
      const config = mockConfig();
      const manager = mockScenarioManager({
        switchScenario: () => ({
          success: false,
          error: new Error('Scenario not found'),
        }),
      });

      const router = createScenarioEndpoints(manager, config);
      const app = express();
      app.use(express.json());
      app.use(router!);

      const response = await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({ scenario: 'non-existent' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Scenario not found');
    });

    it('should return 500 when unexpected error occurs', async () => {
      const config = mockConfig();
      const manager = mockScenarioManager({
        switchScenario: () => {
          throw new Error('Unexpected error');
        },
      });

      const router = createScenarioEndpoints(manager, config);
      const app = express();
      app.use(express.json());
      app.use(router!);

      const response = await request(app)
        .post('/__scenario__')
        .set('x-test-id', 'test-123')
        .send({ scenario: 'test-scenario' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /__scenario__', () => {
    it('should return active scenario', async () => {
      const config = mockConfig();
      const manager = mockScenarioManager({
        getActiveScenario: () => ({
          scenarioId: 'happy-path',
        }),
        getScenarioById: () => ({
          id: 'happy-path',
          name: 'Happy Path Scenario',
          description: 'All requests succeed',
          mocks: [],
        }),
      });

      const router = createScenarioEndpoints(manager, config);
      const app = express();
      app.use(router!);

      const response = await request(app)
        .get('/__scenario__')
        .set('x-test-id', 'test-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        testId: 'test-123',
        scenarioId: 'happy-path',
        scenarioName: 'Happy Path Scenario',
      });
    });

    it('should return 404 when no active scenario', async () => {
      const config = mockConfig();
      const manager = mockScenarioManager({
        getActiveScenario: () => undefined,
      });

      const router = createScenarioEndpoints(manager, config);
      const app = express();
      app.use(router!);

      const response = await request(app)
        .get('/__scenario__')
        .set('x-test-id', 'test-123');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No active scenario for this test ID');
      expect(response.body.testId).toBe('test-123');
    });

    it('should handle missing scenario definition', async () => {
      const config = mockConfig();
      const manager = mockScenarioManager({
        getActiveScenario: () => ({ scenarioId: 'missing' }),
        getScenarioById: () => undefined,
      });

      const router = createScenarioEndpoints(manager, config);
      const app = express();
      app.use(router!);

      const response = await request(app)
        .get('/__scenario__')
        .set('x-test-id', 'test-123');

      expect(response.status).toBe(200);
      expect(response.body.scenarioName).toBeUndefined();
    });
  });
});
