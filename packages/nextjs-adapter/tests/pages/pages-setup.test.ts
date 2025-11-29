import { describe, it, expect } from "vitest";
import type { ScenaristScenarios } from "@scenarist/core";
import { createScenarist } from "../../src/pages/setup.js";

// Define all test scenarios upfront
const testScenarios = {
  default: {
    id: "default",
    name: "Default Scenario",
    description: "Default test scenario",
    mocks: [],
  },
  premium: {
    id: "premium",
    name: "Premium Scenario",
    description: "Premium test scenario",
    mocks: [],
  },
  scenario2: {
    id: "scenario2",
    name: "Scenario 2",
    description: "Second test scenario",
    mocks: [],
  },
} as const satisfies ScenaristScenarios;

const createTestSetup = async () => {
  const scenarist = createScenarist({
    enabled: true,
    scenarios: testScenarios,
  });

  // Should never be undefined in tests (NODE_ENV !== 'production')
  if (!scenarist) {
    throw new Error("createScenarist returned undefined in test environment");
  }

  return { scenarist };
};

describe("Pages Router createScenarist", () => {
  it("should create scenarist instance with config", async () => {
    const { scenarist } = await createTestSetup();

    expect(scenarist.config).toBeDefined();
    expect(scenarist.config.enabled).toBe(true);
  });

  it("should have all scenarios registered at initialization", async () => {
    const { scenarist } = await createTestSetup();

    const scenarios = scenarist.listScenarios();

    expect(scenarios).toHaveLength(3); // default + premium + scenario2
    expect(scenarios.map((s) => s.id)).toContain("default");
    expect(scenarios.map((s) => s.id)).toContain("premium");
    expect(scenarios.map((s) => s.id)).toContain("scenario2");
  });

  it("should switch scenarios", async () => {
    const { scenarist } = await createTestSetup();

    const result = scenarist.switchScenario("test-1", "premium");

    expect(result.success).toBe(true);
  });

  it("should get active scenario", async () => {
    const { scenarist } = await createTestSetup();

    scenarist.switchScenario("test-2", "premium");

    const active = scenarist.getActiveScenario("test-2");

    expect(active).toEqual({
      scenarioId: "premium",
    });
  });

  it("should get scenario by ID", async () => {
    const { scenarist } = await createTestSetup();

    const scenario = scenarist.getScenarioById("premium");

    expect(scenario).toEqual(testScenarios.premium);
  });

  it("should clear scenario for test ID", async () => {
    const { scenarist } = await createTestSetup();

    scenarist.switchScenario("test-3", "premium");

    scenarist.clearScenario("test-3");

    const active = scenarist.getActiveScenario("test-3");
    expect(active).toBeUndefined();
  });

  it("should provide scenario endpoint handler", async () => {
    const { scenarist } = await createTestSetup();

    expect(scenarist.createScenarioEndpoint).toBeDefined();
    expect(typeof scenarist.createScenarioEndpoint).toBe("function");
  });

  it("should create working scenario endpoint when called", async () => {
    const { scenarist } = await createTestSetup();

    const endpoint = scenarist.createScenarioEndpoint();

    expect(endpoint).toBeDefined();
    expect(typeof endpoint).toBe("function");
  });

  it("should start MSW server", async () => {
    const { scenarist } = await createTestSetup();

    expect(() => scenarist.start()).not.toThrow();
  });

  it("should stop MSW server", async () => {
    const { scenarist } = await createTestSetup();

    scenarist.start();
    await expect(scenarist.stop()).resolves.not.toThrow();
  });

  describe("Singleton guard for createScenarist() instance", () => {
    // Clean up all global state between tests
    const clearAllGlobals = () => {
      delete (global as any).__scenarist_instance_pages;
      delete (global as any).__scenarist_registry_pages;
      delete (global as any).__scenarist_store_pages;
      delete (global as any).__scenarist_msw_started_pages;
    };

    // Clear globals before each test to ensure test isolation
    beforeEach(() => {
      clearAllGlobals();
    });

    it("should return same instance when createScenarist() called multiple times", async () => {
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

    it("should prevent duplicate scenario registration errors", async () => {
      // First call registers all scenarios
      const instance1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      // Second call should return same instance, NOT try to re-register scenarios
      // Without singleton guard, this would throw DuplicateScenarioError
      const instance2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      // Verify same instance is returned
      expect(instance2).toBe(instance1);
    });

    it("should share scenario registry across all instances", async () => {
      const instance1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      const instance2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      if (!instance1 || !instance2) {
        throw new Error("Instances should not be undefined in tests");
      }

      // Both instances should see the same scenarios
      const scenarios1 = instance1.listScenarios();
      const scenarios2 = instance2.listScenarios();

      expect(scenarios1).toEqual(scenarios2);
      expect(scenarios1).toHaveLength(3); // default + premium + scenario2
    });

    it("should share scenario store across all instances", async () => {
      const instance1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      const instance2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      if (!instance1 || !instance2) {
        throw new Error("Instances should not be undefined in tests");
      }

      // Switch scenario using instance1
      instance1.switchScenario("test-singleton-store", "premium");

      // Instance2 should see the same active scenario
      const active = instance2.getActiveScenario("test-singleton-store");
      expect(active).toEqual({
        scenarioId: "premium",
      });
    });

    it("should maintain singleton across different scenario configurations", async () => {
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
      if (!instance2) {
        throw new Error("Instance should not be undefined in tests");
      }
      // Original config should be preserved
      expect(instance2.config.enabled).toBe(true); // Not false!
    });
  });

  describe("Singleton guard in start() method", () => {
    // Clean up global flag between tests
    const clearGlobalFlag = () => {
      delete (global as any).__scenarist_msw_started_pages;
    };

    it("should start MSW on first start() call", async () => {
      clearGlobalFlag();
      const { scenarist } = await createTestSetup();

      // Should start MSW without throwing
      expect(() => scenarist.start()).not.toThrow();
    });

    it("should skip MSW initialization on subsequent start() calls from different instances", async () => {
      clearGlobalFlag();
      const scenarist1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });
      const scenarist2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      if (!scenarist1 || !scenarist2) {
        throw new Error("Instances should not be undefined in tests");
      }

      scenarist1.start(); // First call - should start MSW

      // Second call from different instance - should skip but not throw
      expect(() => scenarist2.start()).not.toThrow();
    });

    it("should share scenario store across multiple instances", async () => {
      clearGlobalFlag();
      const scenarist1 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });
      const scenarist2 = createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      if (!scenarist1 || !scenarist2) {
        throw new Error("Instances should not be undefined in tests");
      }

      scenarist1.start();
      scenarist2.start();

      // Switch scenario using instance 1
      scenarist1.switchScenario("test-singleton-1", "premium");

      // Verify instance 2 sees the same scenario
      const active = scenarist2.getActiveScenario("test-singleton-1");
      expect(active).toEqual({
        scenarioId: "premium",
      });
    });

    it("should allow multiple start() calls on same instance", async () => {
      clearGlobalFlag();
      const { scenarist } = await createTestSetup();

      // Multiple start() calls should not throw
      expect(() => {
        scenarist.start();
        scenarist.start();
        scenarist.start();
      }).not.toThrow();
    });
  });
});
