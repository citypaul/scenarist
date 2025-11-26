import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/core';

// Test scenarios
const mockDefaultScenario: ScenaristScenario = {
  id: 'default',
  name: 'Default Scenario',
  description: 'Default test scenario',
  mocks: [],
};

const testScenarios = {
  default: mockDefaultScenario,
  'test-scenario': {
    id: 'test-scenario',
    name: 'Test Scenario',
    description: 'Test',
    mocks: [],
  },
} as const satisfies ScenaristScenarios;

describe('setup-scenarist.ts - Production Tree-Shaking', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Clear module cache to ensure fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  describe('Production mode (NODE_ENV=production)', () => {
    it('should return undefined when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      // Dynamic import to get fresh module with updated env
      const { createScenarist } = await import('../src/setup/setup-scenarist.js');

      const result = await createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      expect(result).toBeUndefined();
    });
  });

  describe('Non-production mode (development/test)', () => {
    it('should return ExpressScenarist instance when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';

      const { createScenarist } = await import('../src/setup/setup-scenarist.js');

      const result = await createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('middleware');
      expect(result).toHaveProperty('switchScenario');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('stop');
    });

    it('should return instance when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';

      const { createScenarist } = await import('../src/setup/setup-scenarist.js');

      const result = await createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      expect(result).toBeDefined();
    });

    it('should return instance when NODE_ENV is undefined', async () => {
      delete process.env.NODE_ENV;

      const { createScenarist } = await import('../src/setup/setup-scenarist.js');

      const result = await createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      expect(result).toBeDefined();
    });

    it('should maintain type safety with generic parameter', async () => {
      process.env.NODE_ENV = 'development';

      const { createScenarist } = await import('../src/setup/setup-scenarist.js');

      const result = await createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      // TypeScript will error if result doesn't have correct type
      if (result) {
        // Should be ExpressScenarist<typeof testScenarios>
        const scenarioIds: ('default' | 'test-scenario')[] = ['default', 'test-scenario'];
        scenarioIds.forEach(id => {
          // This verifies type-safe scenario IDs work
          result.switchScenario('test-123', id);
        });
      }

      expect(result).toBeDefined();
    });

    it('should have working config with correct default values', async () => {
      process.env.NODE_ENV = 'development';

      const { createScenarist } = await import('../src/setup/setup-scenarist.js');

      const result = await createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      expect(result).toBeDefined();
      if (result) {
        expect(result.config.endpoints.setScenario).toBe('/__scenario__');
        expect(result.config.endpoints.getScenario).toBe('/__scenario__');
        expect(result.config.strictMode).toBe(false);
      }
    });
  });

  describe('Type checking', () => {
    it('should have correct return type Promise<ExpressScenarist | undefined>', async () => {
      process.env.NODE_ENV = 'development';

      const { createScenarist } = await import('../src/setup/setup-scenarist.js');

      // This test verifies TypeScript types are correct
      const result = await createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      // Must handle both undefined and defined cases
      if (result === undefined) {
        expect(result).toBeUndefined();
      } else {
        expect(result).toHaveProperty('config');
      }
    });
  });
});
