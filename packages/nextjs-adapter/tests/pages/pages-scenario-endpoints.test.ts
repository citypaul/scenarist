import { describe, it, expect, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  buildConfig,
  createScenarioManager,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  type ScenarioDefinition,
} from '@scenarist/core';
import { createScenarioEndpoint } from '../../src/pages/endpoints.js';

const createTestSetup = () => {
  const defaultScenario: ScenarioDefinition = {
    id: 'default',
    name: 'Default Scenario',
    mocks: [],
  };

  const premiumScenario: ScenarioDefinition = {
    id: 'premium',
    name: 'Premium Scenario',
    mocks: [],
  };

  const registry = new InMemoryScenarioRegistry();
  const store = new InMemoryScenarioStore();
  const config = buildConfig({ enabled: true, defaultScenario });
  const manager = createScenarioManager({ registry, store });

  manager.registerScenario(defaultScenario);
  manager.registerScenario(premiumScenario);

  const handler = createScenarioEndpoint(manager, config);

  return { handler, manager, config };
};

describe('Pages Router Scenario Endpoints', () => {

  describe('POST (switch scenario)', () => {
    it('should switch to a valid scenario', async () => {
      const { handler } = createTestSetup();

      const req = {
        method: 'POST',
        headers: {
          'x-test-id': 'test-123',
        },
        body: {
          scenario: 'premium',
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        testId: 'test-123',
        scenarioId: 'premium',
      });
    });

    it('should switch scenario with variant', async () => {
      const { handler } = createTestSetup();

      const req = {
        method: 'POST',
        headers: {
          'x-test-id': 'test-456',
        },
        body: {
          scenario: 'premium',
          variant: 'high-tier',
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        testId: 'test-456',
        scenarioId: 'premium',
        variant: 'high-tier',
      });
    });

    it('should return 400 when scenario does not exist', async () => {
      const { handler } = createTestSetup();

      const req = {
        method: 'POST',
        headers: {
          'x-test-id': 'test-789',
        },
        body: {
          scenario: 'nonexistent',
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('not found'),
        })
      );
    });

    it('should return 400 when request body is invalid', async () => {
      const { handler } = createTestSetup();

      const req = {
        method: 'POST',
        headers: {
          'x-test-id': 'test-bad',
        },
        body: {
          // Missing 'scenario' field
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid request body',
        })
      );
    });
  });

  describe('GET (retrieve active scenario)', () => {
    it('should return active scenario for test ID', async () => {
      const { handler, manager } = createTestSetup();

      // First, switch to a scenario
      manager.switchScenario('test-abc', 'premium', undefined);

      const req = {
        method: 'GET',
        headers: {
          'x-test-id': 'test-abc',
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        testId: 'test-abc',
        scenarioId: 'premium',
        scenarioName: 'Premium Scenario',
      });
    });

    it('should return 404 when no active scenario exists', async () => {
      const { handler } = createTestSetup();

      const req = {
        method: 'GET',
        headers: {
          'x-test-id': 'test-no-scenario',
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('No active scenario'),
          testId: 'test-no-scenario',
        })
      );
    });

    it('should include variant name when present', async () => {
      const { handler, manager } = createTestSetup();

      // Switch to scenario with variant
      manager.switchScenario('test-variant', 'premium', 'high-tier');

      const req = {
        method: 'GET',
        headers: {
          'x-test-id': 'test-variant',
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
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

      const req = {
        method: 'PUT',
        headers: {
          'x-test-id': 'test-put',
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
      });
    });
  });
});
