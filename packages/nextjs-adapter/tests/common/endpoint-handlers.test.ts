import { describe, it, expect } from 'vitest';
import { handlePostLogic } from '../../src/common/endpoint-handlers.js';
import {
  buildConfig,
  createScenarioManager,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  type RequestContext,
} from '@scenarist/core';

const createTestSetup = () => {
  const defaultScenario = {
    id: 'default',
    name: 'Default Scenario',
    description: 'Default test scenario',
    mocks: [],
  };

  const registry = new InMemoryScenarioRegistry();
  const store = new InMemoryScenarioStore();
  const config = buildConfig({
    enabled: true,
    scenarios: { default: defaultScenario },
  });
  const manager = createScenarioManager({ registry, store });

  manager.registerScenario(defaultScenario);

  // Mock request context
  const context: RequestContext = {
    getTestId: () => 'test-123',
  };

  return { manager, config, context };
};

describe('Common Endpoint Handlers', () => {
  describe('handlePostLogic', () => {
    it('should return validation error details when request body is invalid', async () => {
      const { manager, context } = createTestSetup();

      // Invalid body: missing required 'scenario' field
      const invalidBody = { invalidField: 'value' };

      const result = await handlePostLogic(invalidBody, context, manager);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toBe('Invalid request body');
        // This is the critical assertion - we need error.issues not error.errors
        expect(result.details).toBeDefined();
        expect(Array.isArray(result.details)).toBe(true);
      }
    });

    it('should return validation error for empty scenario string', async () => {
      const { manager, context } = createTestSetup();

      // Invalid body: scenario is empty string (violates min(1))
      const invalidBody = { scenario: '' };

      const result = await handlePostLogic(invalidBody, context, manager);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toBe('Invalid request body');
        expect(result.details).toBeDefined();
        expect(Array.isArray(result.details)).toBe(true);
        // Verify we get specific validation error for empty string
        const details = result.details as Array<{ path: string[] }>;
        expect(details.some(d => d.path.includes('scenario'))).toBe(true);
      }
    });
  });
});
