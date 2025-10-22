import { describe, it, expect } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { createScenaristTestClient } from '../src/test-client.js';
import type { ScenarioDefinition } from '@scenarist/core';

/**
 * Mock scenario definitions for testing
 */
const mockScenario = (
  overrides?: Partial<ScenarioDefinition>
): ScenarioDefinition => ({
  id: 'test-scenario',
  name: 'Test Scenario',
  description: 'A test scenario',
  mocks: [],
  ...overrides,
});

/**
 * Create a minimal Express app that mimics Scenarist's scenario endpoints
 */
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Store for tracking requests (for assertions)
  const requestLog: Array<{
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: unknown;
  }> = [];

  // Helper to get last request
  app.get('/__test__/last-request', (_req, res) => {
    const last = requestLog[requestLog.length - 1];
    return res.json(last || {});
  });

  // Helper to clear log
  app.post('/__test__/clear', (_req, res) => {
    requestLog.length = 0;
    return res.json({ cleared: true });
  });

  // Mock scenario endpoint (POST)
  app.post('/__scenario__', (req, res) => {
    requestLog.push({
      method: 'POST',
      path: '/__scenario__',
      headers: req.headers as Record<string, string>,
      body: req.body,
    });

    return res.json({
      success: true,
      testId: req.headers['x-test-id'] || 'default',
      scenario: req.body.scenario,
    });
  });

  // Mock scenario endpoint (GET)
  app.get('/__scenario__', (req, res) => {
    requestLog.push({
      method: 'GET',
      path: '/__scenario__',
      headers: req.headers as Record<string, string>,
    });

    return res.json({
      testId: req.headers['x-test-id'] || 'default',
      scenarioId: 'test-scenario',
    });
  });

  // Custom endpoint for testing configuration
  app.post('/custom-endpoint', (req, res) => {
    requestLog.push({
      method: 'POST',
      path: '/custom-endpoint',
      headers: req.headers as Record<string, string>,
      body: req.body,
    });

    return res.json({ success: true });
  });

  app.get('/custom-endpoint', (req, res) => {
    requestLog.push({
      method: 'GET',
      path: '/custom-endpoint',
      headers: req.headers as Record<string, string>,
    });

    return res.json({ success: true });
  });

  return app;
};

describe('createScenaristTestClient', () => {
  describe('Type safety', () => {
    it('should provide type-safe scenario keys', () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success' }),
        error: mockScenario({ id: 'error' }),
      } as const;

      const client = createScenaristTestClient(() => request(app), scenarios);

      // These should compile without errors
      client.switchTo('success');
      client.switchTo('error');

      // This would be a TypeScript error if uncommented:
      // client.switchTo('nonexistent');

      expect(client).toBeDefined();
    });
  });

  describe('switchTo', () => {
    it('should POST to scenario endpoint with scenario ID', async () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(() => request(app), scenarios);

      const response = await client.switchTo('success');

      expect(response.status).toBe(200);
      expect(response.body.scenario).toBe('success-scenario');

      // Verify the request was made correctly
      const lastReq = await request(app).get('/__test__/last-request');
      expect(lastReq.body.method).toBe('POST');
      expect(lastReq.body.path).toBe('/__scenario__');
      expect(lastReq.body.body).toEqual({ scenario: 'success-scenario' });
    });

    it('should include test ID header when provided', async () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(() => request(app), scenarios);

      const response = await client.switchTo('success', 'test-123');

      expect(response.status).toBe(200);
      expect(response.body.testId).toBe('test-123');

      // Verify the header was sent
      const lastReq = await request(app).get('/__test__/last-request');
      expect(lastReq.body.headers['x-test-id']).toBe('test-123');
    });

    it('should not include test ID header when not provided', async () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(() => request(app), scenarios);

      await request(app).post('/__test__/clear'); // Clear log
      await client.switchTo('success');

      const lastReq = await request(app).get('/__test__/last-request');
      expect(lastReq.body.headers['x-test-id']).toBeUndefined();
    });

    it('should use custom scenario endpoint when configured', async () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(
        () => request(app),
        scenarios,
        { scenarioEndpoint: '/custom-endpoint' }
      );

      const response = await client.switchTo('success');

      expect(response.status).toBe(200);

      // Verify it used the custom endpoint
      const lastReq = await request(app).get('/__test__/last-request');
      expect(lastReq.body.path).toBe('/custom-endpoint');
    });

    it('should use custom test ID header when configured', async () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(
        () => request(app),
        scenarios,
        { testIdHeader: 'x-custom-test-id' }
      );

      await request(app).post('/__test__/clear'); // Clear log
      await client.switchTo('success', 'test-123');

      const lastReq = await request(app).get('/__test__/last-request');
      expect(lastReq.body.headers['x-custom-test-id']).toBe('test-123');
      expect(lastReq.body.headers['x-test-id']).toBeUndefined();
    });

    it('should throw error when scenario not found in registry', () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(() => request(app), scenarios);

      // Simulate accessing a non-existent key by casting
      const invalidKey = 'nonexistent' as keyof typeof scenarios;

      expect(() => {
        client.switchTo(invalidKey);
      }).toThrow("Scenario 'nonexistent' not found in registry");
    });
  });

  describe('getCurrent', () => {
    it('should GET from scenario endpoint', async () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(() => request(app), scenarios);

      await request(app).post('/__test__/clear'); // Clear log
      const response = await client.getCurrent();

      expect(response.status).toBe(200);

      // Verify GET request was made
      const lastReq = await request(app).get('/__test__/last-request');
      expect(lastReq.body.method).toBe('GET');
      expect(lastReq.body.path).toBe('/__scenario__');
    });

    it('should include test ID header when provided', async () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(() => request(app), scenarios);

      await request(app).post('/__test__/clear'); // Clear log
      await client.getCurrent('test-123');

      const lastReq = await request(app).get('/__test__/last-request');
      expect(lastReq.body.headers['x-test-id']).toBe('test-123');
    });

    it('should not include test ID header when not provided', async () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(() => request(app), scenarios);

      await request(app).post('/__test__/clear'); // Clear log
      await client.getCurrent();

      const lastReq = await request(app).get('/__test__/last-request');
      expect(lastReq.body.headers['x-test-id']).toBeUndefined();
    });

    it('should use custom scenario endpoint when configured', async () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
      };

      const client = createScenaristTestClient(
        () => request(app),
        scenarios,
        { scenarioEndpoint: '/custom-endpoint' }
      );

      await request(app).post('/__test__/clear'); // Clear log
      await client.getCurrent();

      const lastReq = await request(app).get('/__test__/last-request');
      expect(lastReq.body.path).toBe('/custom-endpoint');
    });
  });

  describe('scenarios property', () => {
    it('should expose the scenarios registry', () => {
      const app = createTestApp();
      const scenarios = {
        success: mockScenario({ id: 'success-scenario' }),
        error: mockScenario({ id: 'error-scenario' }),
      };

      const client = createScenaristTestClient(() => request(app), scenarios);

      expect(client.scenarios).toBe(scenarios);
      expect(client.scenarios.success.id).toBe('success-scenario');
      expect(client.scenarios.error.id).toBe('error-scenario');
    });
  });
});
