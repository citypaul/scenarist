import { describe, expect, it } from "vitest";
import { createScenarioManager } from "../src/domain/scenario-manager.js";
import type { ScenarioRegistry, ScenarioStore, StateManager } from "../src/ports/index.js";
import type { ActiveScenario, ScenarioDefinition } from "../src/types/index.js";

// In-memory registry for testing (simple Map-based implementation)
const createTestRegistry = (): ScenarioRegistry => {
  const registry = new Map<string, ScenarioDefinition>();

  return {
    register: (definition) => registry.set(definition.id, definition),
    get: (id) => registry.get(id),
    has: (id) => registry.has(id),
    list: () => Array.from(registry.values()),
    unregister: (id) => {
      registry.delete(id);
    },
  };
};

// In-memory store for testing (simple Map-based implementation)
const createTestStore = (): ScenarioStore => {
  const store = new Map<string, ActiveScenario>();

  return {
    set: (testId, scenario) => store.set(testId, scenario),
    get: (testId) => store.get(testId),
    has: (testId) => store.has(testId),
    delete: (testId) => {
      store.delete(testId);
    },
    clear: () => store.clear(),
  };
};

// In-memory state manager for testing (simple Map-based implementation)
const createTestStateManager = (): StateManager => {
  const storage = new Map<string, Record<string, unknown>>();

  return {
    get: (testId, key) => {
      const testState = storage.get(testId);
      return testState?.[key];
    },
    set: (testId, key, value) => {
      const testState = storage.get(testId) || {};
      testState[key] = value;
      storage.set(testId, testState);
    },
    getAll: (testId) => {
      return storage.get(testId) ?? {};
    },
    reset: (testId) => {
      storage.delete(testId);
    },
  };
};

// Test scenario definition factory
const createTestScenarioDefinition = (
  id: string,
  name: string = "Test Scenario"
): ScenarioDefinition => ({
  id,
  name,
  description: `Description for ${name}`,
  mocks: [
    {
      method: "GET",
      url: "https://api.example.com/test",
      response: {
        status: 200,
        body: { message: "mocked" },
      },
    },
  ],
});

/**
 * Factory function to create test setup with fresh dependencies.
 * This functional approach avoids mutation and provides clean isolation between tests.
 */
const createTestSetup = (options?: { stateManager?: StateManager }) => {
  const registry = createTestRegistry();
  const store = createTestStore();
  const stateManager = options?.stateManager;

  const manager = createScenarioManager({ registry, store, stateManager });

  return { registry, store, stateManager, manager };
};

describe("ScenarioManager", () => {
  describe("registerScenario", () => {
    it("should register a new scenario", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenarioDefinition(
        "happy-path",
        "Happy Path"
      );

      manager.registerScenario(definition);

      const registered = manager.getScenarioById("happy-path");
      expect(registered).toEqual(definition);
    });

    it("should delegate to registry", () => {
      const { manager, registry } = createTestSetup();
      const definition = createTestScenarioDefinition("test", "Test");

      manager.registerScenario(definition);

      expect(registry.has("test")).toBe(true);
    });

    it("should throw error when registering duplicate scenario ID", () => {
      const { manager } = createTestSetup();
      const definition1 = createTestScenarioDefinition("duplicate", "First");
      const definition2 = createTestScenarioDefinition("duplicate", "Second");

      manager.registerScenario(definition1);

      expect(() => manager.registerScenario(definition2)).toThrow(
        "Scenario 'duplicate' is already registered"
      );
    });

    it("should not overwrite existing scenario when duplicate detected", () => {
      const { manager } = createTestSetup();
      const definition1 = createTestScenarioDefinition("duplicate", "First");
      const definition2 = createTestScenarioDefinition("duplicate", "Second");

      manager.registerScenario(definition1);

      try {
        manager.registerScenario(definition2);
      } catch {
        // Expected to throw
      }

      const registered = manager.getScenarioById("duplicate");
      expect(registered?.name).toBe("First");
    });

    it("should allow re-registering the exact same scenario (idempotent)", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenarioDefinition("test", "Test Scenario");

      manager.registerScenario(definition);
      // Re-registering the same object should not throw
      expect(() => manager.registerScenario(definition)).not.toThrow();

      const registered = manager.getScenarioById("test");
      expect(registered).toEqual(definition);
    });
  });

  describe("switchScenario", () => {
    it("should switch to a registered scenario for a test ID", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenarioDefinition(
        "error-state",
        "Error State"
      );
      manager.registerScenario(definition);

      const result = manager.switchScenario("test-123", "error-state");

      expect(result.success).toBe(true);
      const active = manager.getActiveScenario("test-123");
      expect(active?.scenarioId).toBe("error-state");
    });

    it("should return error when switching to unregistered scenario", () => {
      const { manager } = createTestSetup();

      const result = manager.switchScenario("test-123", "non-existent");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("not found");
        expect(result.error.message).toContain("non-existent");
      }
    });

    it("should support scenario variants", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenarioDefinition(
        "with-variant",
        "With Variant"
      );
      manager.registerScenario(definition);

      const result = manager.switchScenario(
        "test-123",
        "with-variant",
        "premium-user"
      );

      expect(result.success).toBe(true);
      const active = manager.getActiveScenario("test-123");
      expect(active?.variantName).toBe("premium-user");
    });

    it("should isolate scenarios by test ID", () => {
      const { manager } = createTestSetup();
      const definition1 = createTestScenarioDefinition(
        "scenario-1",
        "Scenario 1"
      );
      const definition2 = createTestScenarioDefinition(
        "scenario-2",
        "Scenario 2"
      );

      manager.registerScenario(definition1);
      manager.registerScenario(definition2);

      manager.switchScenario("test-A", "scenario-1");
      manager.switchScenario("test-B", "scenario-2");

      const activeA = manager.getActiveScenario("test-A");
      const activeB = manager.getActiveScenario("test-B");

      expect(activeA?.scenarioId).toBe("scenario-1");
      expect(activeB?.scenarioId).toBe("scenario-2");
    });

    it("should store only reference not full definition", () => {
      const { manager, store } = createTestSetup();
      const definition = createTestScenarioDefinition("test", "Test");
      manager.registerScenario(definition);

      manager.switchScenario("test-123", "test", "variant-1");

      const active = store.get("test-123");
      expect(active).toEqual({
        scenarioId: "test",
        variantName: "variant-1",
      });
    });
  });

  describe("getActiveScenario", () => {
    it("should return undefined when no scenario is active", () => {
      const { manager } = createTestSetup();

      const active = manager.getActiveScenario("test-123");

      expect(active).toBeUndefined();
    });

    it("should delegate to store", () => {
      const { manager, store } = createTestSetup();
      const definition = createTestScenarioDefinition("test", "Test");
      manager.registerScenario(definition);
      manager.switchScenario("test-123", "test");

      const active = manager.getActiveScenario("test-123");

      expect(store.get("test-123")).toEqual(active);
    });
  });

  describe("listScenarios", () => {
    it("should list all registered scenarios", () => {
      const { manager } = createTestSetup();
      manager.registerScenario(
        createTestScenarioDefinition("scenario-1", "Scenario 1")
      );
      manager.registerScenario(
        createTestScenarioDefinition("scenario-2", "Scenario 2")
      );

      const scenarios = manager.listScenarios();

      expect(scenarios).toHaveLength(2);
      expect(scenarios.map((s) => s.id)).toEqual(["scenario-1", "scenario-2"]);
    });

    it("should return empty array when no scenarios registered", () => {
      const { manager } = createTestSetup();

      const scenarios = manager.listScenarios();

      expect(scenarios).toEqual([]);
    });

    it("should delegate to registry", () => {
      const { manager, registry } = createTestSetup();
      manager.registerScenario(createTestScenarioDefinition("test", "Test"));

      const scenarios = manager.listScenarios();

      expect(scenarios).toEqual(registry.list());
    });
  });

  describe("clearScenario", () => {
    it("should clear active scenario for a test ID", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenarioDefinition("test", "Test");
      manager.registerScenario(definition);
      manager.switchScenario("test-123", "test");

      manager.clearScenario("test-123");

      const active = manager.getActiveScenario("test-123");
      expect(active).toBeUndefined();
    });

    it("should not affect other test IDs when clearing", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenarioDefinition("test", "Test");
      manager.registerScenario(definition);
      manager.switchScenario("test-A", "test");
      manager.switchScenario("test-B", "test");

      manager.clearScenario("test-A");

      expect(manager.getActiveScenario("test-A")).toBeUndefined();
      expect(manager.getActiveScenario("test-B")).toBeDefined();
    });

    it("should delegate to store", () => {
      const { manager, store } = createTestSetup();
      const definition = createTestScenarioDefinition("test", "Test");
      manager.registerScenario(definition);
      manager.switchScenario("test-123", "test");

      manager.clearScenario("test-123");

      expect(store.has("test-123")).toBe(false);
    });
  });

  describe("getScenarioById", () => {
    it("should return scenario definition by ID", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenarioDefinition("test", "Test Scenario");
      manager.registerScenario(definition);

      const retrieved = manager.getScenarioById("test");

      expect(retrieved).toEqual(definition);
    });

    it("should return undefined for non-existent scenario", () => {
      const { manager } = createTestSetup();

      const retrieved = manager.getScenarioById("non-existent");

      expect(retrieved).toBeUndefined();
    });

    it("should delegate to registry", () => {
      const { manager, registry } = createTestSetup();
      const definition = createTestScenarioDefinition("test", "Test");
      manager.registerScenario(definition);

      const retrieved = manager.getScenarioById("test");

      expect(retrieved).toEqual(registry.get("test"));
    });
  });

  describe("State Reset on Scenario Switch", () => {
    it("should reset state when switching scenarios", () => {
      const stateManager = createTestStateManager();
      const { manager } = createTestSetup({ stateManager });

      const scenario1 = createTestScenarioDefinition("scenario-1", "Scenario 1");
      const scenario2 = createTestScenarioDefinition("scenario-2", "Scenario 2");

      manager.registerScenario(scenario1);
      manager.registerScenario(scenario2);

      // Set some state for test-1
      stateManager.set("test-1", "userId", "user-123");
      stateManager.set("test-1", "count", 5);

      // Verify state exists
      expect(stateManager.get("test-1", "userId")).toBe("user-123");
      expect(stateManager.get("test-1", "count")).toBe(5);

      // Switch to scenario-2
      manager.switchScenario("test-1", "scenario-2");

      // State should be cleared
      expect(stateManager.get("test-1", "userId")).toBeUndefined();
      expect(stateManager.get("test-1", "count")).toBeUndefined();
      expect(stateManager.getAll("test-1")).toEqual({});
    });

    it("should not reset state when switching fails", () => {
      const stateManager = createTestStateManager();
      const { manager } = createTestSetup({ stateManager });

      const scenario1 = createTestScenarioDefinition("scenario-1", "Scenario 1");
      manager.registerScenario(scenario1);

      // Set some state for test-1
      stateManager.set("test-1", "userId", "user-123");

      // Try to switch to non-existent scenario
      const result = manager.switchScenario("test-1", "non-existent");

      // Switch should fail
      expect(result.success).toBe(false);

      // State should NOT be cleared (switch failed)
      expect(stateManager.get("test-1", "userId")).toBe("user-123");
    });

    it("should work without state manager (backward compatibility)", () => {
      const { manager } = createTestSetup(); // No state manager

      const scenario1 = createTestScenarioDefinition("scenario-1", "Scenario 1");
      const scenario2 = createTestScenarioDefinition("scenario-2", "Scenario 2");

      manager.registerScenario(scenario1);
      manager.registerScenario(scenario2);

      // Should not throw when switching without state manager
      const result = manager.switchScenario("test-1", "scenario-2");

      expect(result.success).toBe(true);
    });

    it("should isolate state reset per test ID", () => {
      const stateManager = createTestStateManager();
      const { manager } = createTestSetup({ stateManager });

      const scenario1 = createTestScenarioDefinition("scenario-1", "Scenario 1");
      const scenario2 = createTestScenarioDefinition("scenario-2", "Scenario 2");

      manager.registerScenario(scenario1);
      manager.registerScenario(scenario2);

      // Set state for multiple test IDs
      stateManager.set("test-1", "userId", "user-123");
      stateManager.set("test-2", "userId", "user-456");

      // Switch only test-1
      manager.switchScenario("test-1", "scenario-2");

      // Only test-1 state should be cleared
      expect(stateManager.get("test-1", "userId")).toBeUndefined();
      // test-2 state should remain
      expect(stateManager.get("test-2", "userId")).toBe("user-456");
    });
  });
});
