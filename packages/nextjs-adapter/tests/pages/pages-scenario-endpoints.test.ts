import { describe, it, expect, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createScenarioEndpoint } from '../../src/pages/endpoints.js';
import { createEndpointTestSetup } from '../common/test-setup.js';

const createTestSetup = () =>
  createEndpointTestSetup(createScenarioEndpoint);

describe('Pages Router Scenario Endpoints', () => {

  describe('POST (switch scenario)', () => {
    it('should switch to a valid scenario', async () => {
      const { handler } = createTestSetup();

      const req = {
        method: 'POST',
        headers: {
          'x-scenarist-test-id': 'test-123',
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

    it('should return 400 when scenario does not exist', async () => {
      const { handler } = createTestSetup();

      const req = {
        method: 'POST',
        headers: {
          'x-scenarist-test-id': 'test-789',
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
          'x-scenarist-test-id': 'test-bad',
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

    it('should return 500 for unexpected errors during request handling', async () => {
      const { handler, manager } = createTestSetup();

      // Mock switchScenario to throw an unexpected error
      vi.spyOn(manager, 'switchScenario').mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const req = {
        method: 'POST',
        headers: {
          'x-scenarist-test-id': 'test-error',
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

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
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
          'x-scenarist-test-id': 'test-abc',
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
          'x-scenarist-test-id': 'test-no-scenario',
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

  });

  describe('unsupported methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const { handler } = createTestSetup();

      const req = {
        method: 'PUT',
        headers: {
          'x-scenarist-test-id': 'test-put',
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
