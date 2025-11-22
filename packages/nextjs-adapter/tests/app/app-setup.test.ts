import { describe, it, expect } from 'vitest';
import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/core';
import { createScenarist } from '../../src/app/setup.js';

// Define all test scenarios upfront
const testScenarios = {
  default: {
    id: 'default',
    name: 'Default Scenario',
    description: 'Default test scenario',
    mocks: [],
  },
  premium: {
    id: 'premium',
    name: 'Premium Scenario',
    description: 'Premium test scenario',
    mocks: [],
  },
  scenario2: {
    id: 'scenario2',
    name: 'Scenario 2',
    description: 'Second test scenario',
    mocks: [],
  },
} as const satisfies ScenaristScenarios;

const createTestSetup = () => {
  const scenarist = createScenarist({
    enabled: true,
    scenarios: testScenarios,
  });

  return { scenarist };
};

describe('App Router createScenarist', () => {
  it('should create scenarist instance with config', () => {
    const { scenarist } = createTestSetup();

    expect(scenarist.config).toBeDefined();
    expect(scenarist.config.enabled).toBe(true);
  });

  it('should have all scenarios registered at initialization', () => {
    const { scenarist } = createTestSetup();

    const scenarios = scenarist.listScenarios();

    expect(scenarios).toHaveLength(3); // default + premium + scenario2
    expect(scenarios.map((s) => s.id)).toContain('default');
    expect(scenarios.map((s) => s.id)).toContain('premium');
    expect(scenarios.map((s) => s.id)).toContain('scenario2');
  });

  it('should switch scenarios', () => {
    const { scenarist } = createTestSetup();

    const result = scenarist.switchScenario('test-1', 'premium', undefined);

    expect(result.success).toBe(true);
  });

  it('should get active scenario', () => {
    const { scenarist } = createTestSetup();

    scenarist.switchScenario('test-2', 'premium', undefined);

    const active = scenarist.getActiveScenario('test-2');

    expect(active).toEqual({
      scenarioId: 'premium',
      variantName: undefined,
    });
  });

  it('should get scenario by ID', () => {
    const { scenarist } = createTestSetup();

    const scenario = scenarist.getScenarioById('premium');

    expect(scenario).toEqual(testScenarios.premium);
  });

  it('should clear scenario for test ID', () => {
    const { scenarist } = createTestSetup();

    scenarist.switchScenario('test-3', 'premium', undefined);

    scenarist.clearScenario('test-3');

    const active = scenarist.getActiveScenario('test-3');
    expect(active).toBeUndefined();
  });

  it('should provide scenario endpoint handler', () => {
    const { scenarist } = createTestSetup();

    expect(scenarist.createScenarioEndpoint).toBeDefined();
    expect(typeof scenarist.createScenarioEndpoint).toBe('function');
  });

  it('should create working scenario endpoint when called', async () => {
    const { scenarist } = createTestSetup();

    const endpoint = scenarist.createScenarioEndpoint();

    expect(endpoint).toBeDefined();
    expect(typeof endpoint).toBe('function');
  });

  it('should start MSW server', () => {
    const { scenarist } = createTestSetup();

    expect(() => scenarist.start()).not.toThrow();
  });

  it('should stop MSW server', async () => {
    const { scenarist } = createTestSetup();

    scenarist.start();
    await expect(scenarist.stop()).resolves.not.toThrow();
  });

  describe('Singleton guard for createScenarist() instance', () => {
    // Clean up all global state between tests
    const clearAllGlobals = () => {
      delete (global as any).__scenarist_instance;
      delete (global as any).__scenarist_registry;
      delete (global as any).__scenarist_store;
      delete (global as any).__scenarist_msw_started;
    };

    // Clear globals before each test to ensure test isolation
    beforeEach(() => {
      clearAllGlobals();
    });

    it('should return same instance when createScenarist() called multiple times', () => {

      const instance1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      const instance2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      // Both calls should return the exact same object reference
      expect(instance1).toBe(instance2);
    });

    it('should prevent duplicate scenario registration errors', () => {
      // First call registers all scenarios
      const instance1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      // Second call should return same instance, NOT try to re-register scenarios
      // Without singleton guard, this would throw DuplicateScenarioError
      expect(() => {
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        });
      }).not.toThrow();
    });

    it('should share scenario registry across all instances', () => {
      const instance1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      const instance2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      // Both instances should see the same scenarios
      const scenarios1 = instance1.listScenarios();
      const scenarios2 = instance2.listScenarios();

      expect(scenarios1).toEqual(scenarios2);
      expect(scenarios1).toHaveLength(3); // default + premium + scenario2
    });

    it('should share scenario store across all instances', () => {
      const instance1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      const instance2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      // Switch scenario using instance1
      instance1.switchScenario('test-singleton-store', 'premium', undefined);

      // Instance2 should see the same active scenario
      const active = instance2.getActiveScenario('test-singleton-store');
      expect(active).toEqual({
        scenarioId: 'premium',
        variantName: undefined,
      });
    });

    it('should maintain singleton across different scenario configurations', () => {
      const instance1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      // Even with different config, should return same instance
      const instance2 = createScenarist({
        enabled: false, // Different enabled flag
        scenarios: testScenarios,
      });

      expect(instance1).toBe(instance2);
      // Original config should be preserved
      expect(instance2.config.enabled).toBe(true); // Not false!
    });
  });

  describe('Singleton guard in start() method', () => {
    // Clean up global flag between tests
    const clearGlobalFlag = () => {
      delete (global as any).__scenarist_msw_started;
    };

    it('should start MSW on first start() call', () => {
      clearGlobalFlag();
      const { scenarist } = createTestSetup();

      // Should start MSW without throwing
      expect(() => scenarist.start()).not.toThrow();
    });

    it('should skip MSW initialization on subsequent start() calls from different instances', () => {
      clearGlobalFlag();
      const scenarist1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });
      const scenarist2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      scenarist1.start(); // First call - should start MSW

      // Second call from different instance - should skip but not throw
      expect(() => scenarist2.start()).not.toThrow();
    });

    it('should share scenario store across multiple instances', () => {
      clearGlobalFlag();
      const scenarist1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });
      const scenarist2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      scenarist1.start();
      scenarist2.start();

      // Switch scenario using instance 1
      scenarist1.switchScenario('test-singleton-1', 'premium', undefined);

      // Verify instance 2 sees the same scenario
      const active = scenarist2.getActiveScenario('test-singleton-1');
      expect(active).toEqual({
        scenarioId: 'premium',
        variantName: undefined,
      });
    });

    it('should allow multiple start() calls on same instance', () => {
      clearGlobalFlag();
      const { scenarist } = createTestSetup();

      // Multiple start() calls should not throw
      expect(() => {
        scenarist.start();
        scenarist.start();
        scenarist.start();
      }).not.toThrow();
    });
  });

  describe('getHeaders method', () => {
    // Clean up all global state between tests to allow different configs
    const clearAllGlobals = () => {
      delete (global as any).__scenarist_instance;
      delete (global as any).__scenarist_registry;
      delete (global as any).__scenarist_store;
      delete (global as any).__scenarist_msw_started;
    };

    it('should extract test ID from request using default configured header name', () => {
      clearAllGlobals();
      const { scenarist } = createTestSetup();
      const headers = new Headers({ 'x-test-id': 'test-123' });
      const req = new Request('http://localhost:3000', { headers });

      const result = scenarist.getHeaders(req);

      expect(result).toEqual({ 'x-test-id': 'test-123' });
    });

    it('should use default test ID when header is missing', () => {
      clearAllGlobals();
      const { scenarist } = createTestSetup();
      const req = new Request('http://localhost:3000');

      const result = scenarist.getHeaders(req);

      expect(result).toEqual({ 'x-test-id': 'default-test' });
    });

    it('should respect custom header name from config', () => {
      clearAllGlobals();
      const scenarist = createScenarist({
        enabled: true,
        scenarios: testScenarios,
        headers: { testId: 'x-custom-test-id' },
      });
      const headers = new Headers({ 'x-custom-test-id': 'custom-123' });
      const req = new Request('http://localhost:3000', { headers });

      const result = scenarist.getHeaders(req);

      expect(result).toEqual({ 'x-custom-test-id': 'custom-123' });
    });

    it('should respect custom default test ID from config', () => {
      clearAllGlobals();
      const scenarist = createScenarist({
        enabled: true,
        scenarios: testScenarios,
        defaultTestId: 'my-default',
      });
      const req = new Request('http://localhost:3000');

      const result = scenarist.getHeaders(req);

      expect(result).toEqual({ 'x-test-id': 'my-default' });
    });

    it('should handle both custom header name and custom default test ID', () => {
      clearAllGlobals();
      const scenarist = createScenarist({
        enabled: true,
        scenarios: testScenarios,
        headers: { testId: 'x-my-header' },
        defaultTestId: 'my-default',
      });
      const req = new Request('http://localhost:3000');

      const result = scenarist.getHeaders(req);

      expect(result).toEqual({ 'x-my-header': 'my-default' });
    });

    it('should handle case-insensitive header lookup', () => {
      clearAllGlobals();
      const { scenarist } = createTestSetup();
      const headers = new Headers({ 'X-TEST-ID': 'test-123' }); // uppercase
      const req = new Request('http://localhost:3000', { headers });

      const result = scenarist.getHeaders(req);

      expect(result).toEqual({ 'x-test-id': 'test-123' });
    });
  });

  describe('getHeadersFromReadonlyHeaders method', () => {
    // Clean up all global state between tests to allow different configs
    const clearAllGlobals = () => {
      delete (global as any).__scenarist_instance;
      delete (global as any).__scenarist_registry;
      delete (global as any).__scenarist_store;
      delete (global as any).__scenarist_msw_started;
    };

    // Mock ReadonlyHeaders (simplified version matching Next.js Headers interface)
    class MockReadonlyHeaders {
      private headers: Map<string, string>;

      constructor(init?: Record<string, string>) {
        this.headers = new Map();
        if (init) {
          Object.entries(init).forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value);
          });
        }
      }

      get(name: string): string | null {
        return this.headers.get(name.toLowerCase()) ?? null;
      }
    }

    it('should extract test ID from ReadonlyHeaders using default configured header name', () => {
      clearAllGlobals();
      const { scenarist } = createTestSetup();
      const headers = new MockReadonlyHeaders({ 'x-test-id': 'test-456' });

      // @ts-expect-error - Method doesn't exist yet (RED phase)
      const result = scenarist.getHeadersFromReadonlyHeaders(headers);

      expect(result).toEqual({ 'x-test-id': 'test-456' });
    });

    it('should use default test ID when header is missing from ReadonlyHeaders', () => {
      clearAllGlobals();
      const { scenarist } = createTestSetup();
      const headers = new MockReadonlyHeaders({}); // No headers

      // @ts-expect-error - Method doesn't exist yet (RED phase)
      const result = scenarist.getHeadersFromReadonlyHeaders(headers);

      expect(result).toEqual({ 'x-test-id': 'default-test' });
    });

    it('should respect custom header name from config with ReadonlyHeaders', () => {
      clearAllGlobals();
      const scenarist = createScenarist({
        enabled: true,
        scenarios: testScenarios,
        headers: { testId: 'x-custom-test-id' },
      });
      const headers = new MockReadonlyHeaders({ 'x-custom-test-id': 'custom-789' });

      // @ts-expect-error - Method doesn't exist yet (RED phase)
      const result = scenarist.getHeadersFromReadonlyHeaders(headers);

      expect(result).toEqual({ 'x-custom-test-id': 'custom-789' });
    });

    it('should handle lowercase header names with ReadonlyHeaders', () => {
      clearAllGlobals();
      const { scenarist } = createTestSetup();
      // ReadonlyHeaders.get() is case-insensitive, store as uppercase
      const headers = new MockReadonlyHeaders({ 'X-TEST-ID': 'test-uppercase' });

      // @ts-expect-error - Method doesn't exist yet (RED phase)
      const result = scenarist.getHeadersFromReadonlyHeaders(headers);

      // Should still extract correctly despite uppercase input
      expect(result).toEqual({ 'x-test-id': 'test-uppercase' });
    });

    it('should return object with single header entry', () => {
      clearAllGlobals();
      const { scenarist } = createTestSetup();
      const headers = new MockReadonlyHeaders({
        'x-test-id': 'test-single',
        'x-other-header': 'other-value', // Should be ignored
      });

      // @ts-expect-error - Method doesn't exist yet (RED phase)
      const result = scenarist.getHeadersFromReadonlyHeaders(headers);

      // Should only contain test ID header, nothing else
      expect(result).toEqual({ 'x-test-id': 'test-single' });
      expect(Object.keys(result)).toHaveLength(1);
    });
  });
});
