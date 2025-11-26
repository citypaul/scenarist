import { describe, it, expect } from 'vitest';
import { createScenarioEndpoint } from '../../src/app/endpoints.js';
import { createEndpointTestSetup } from '../common/test-setup.js';

const createTestSetup = () =>
  createEndpointTestSetup(createScenarioEndpoint);

describe('App Router Scenario Endpoints', () => {
  describe('POST (switch scenario)', () => {
    it('should switch to a valid scenario', async () => {
      const { handler } = createTestSetup();

      const req = new Request('http://localhost:3000/__scenario__', {
        method: 'POST',
        headers: {
          'x-scenarist-test-id': 'test-123',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scenario: 'premium',
        }),
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        testId: 'test-123',
        scenarioId: 'premium',
      });
    });

    it('should switch scenario with variant', async () => {
      const { handler } = createTestSetup();

      const req = new Request('http://localhost:3000/__scenario__', {
        method: 'POST',
        headers: {
          'x-scenarist-test-id': 'test-456',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scenario: 'premium',
          variant: 'high-tier',
        }),
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        testId: 'test-456',
        scenarioId: 'premium',
        variant: 'high-tier',
      });
    });

    it('should return 400 when scenario does not exist', async () => {
      const { handler } = createTestSetup();

      const req = new Request('http://localhost:3000/__scenario__', {
        method: 'POST',
        headers: {
          'x-scenarist-test-id': 'test-789',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scenario: 'nonexistent',
        }),
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('not found');
    });

    it('should return 400 when request body is invalid', async () => {
      const { handler } = createTestSetup();

      const req = new Request('http://localhost:3000/__scenario__', {
        method: 'POST',
        headers: {
          'x-scenarist-test-id': 'test-bad',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          // Missing 'scenario' field
        }),
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should return 500 for unexpected errors during request handling', async () => {
      const { handler, manager } = createTestSetup();

      // Mock switchScenario to throw an unexpected error
      vi.spyOn(manager, 'switchScenario').mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const req = new Request('http://localhost:3000/__scenario__', {
        method: 'POST',
        headers: {
          'x-scenarist-test-id': 'test-error',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scenario: 'premium',
        }),
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET (retrieve active scenario)', () => {
    it('should return active scenario for test ID', async () => {
      const { handler, manager } = createTestSetup();

      // First, switch to a scenario
      manager.switchScenario('test-abc', 'premium', undefined);

      const req = new Request('http://localhost:3000/__scenario__', {
        method: 'GET',
        headers: {
          'x-scenarist-test-id': 'test-abc',
        },
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        testId: 'test-abc',
        scenarioId: 'premium',
        scenarioName: 'Premium Scenario',
      });
    });

    it('should return 404 when no active scenario exists', async () => {
      const { handler } = createTestSetup();

      const req = new Request('http://localhost:3000/__scenario__', {
        method: 'GET',
        headers: {
          'x-scenarist-test-id': 'test-no-scenario',
        },
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('No active scenario');
      expect(data.testId).toBe('test-no-scenario');
    });

    it('should include variant name when present', async () => {
      const { handler, manager } = createTestSetup();

      // Switch to scenario with variant
      manager.switchScenario('test-variant', 'premium', 'high-tier');

      const req = new Request('http://localhost:3000/__scenario__', {
        method: 'GET',
        headers: {
          'x-scenarist-test-id': 'test-variant',
        },
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        testId: 'test-variant',
        scenarioId: 'premium',
        scenarioName: 'Premium Scenario',
        variantName: 'high-tier',
      });
    });
  });

  describe('unsupported methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const { handler } = createTestSetup();

      const req = new Request('http://localhost:3000/__scenario__', {
        method: 'PUT',
        headers: {
          'x-scenarist-test-id': 'test-put',
        },
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });
  });
});
