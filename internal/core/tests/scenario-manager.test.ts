import { describe, expect, it } from "vitest";
import { createScenarioManager } from "../src/domain/scenario-manager.js";
import type { ScenarioRegistry, ScenarioStore, StateManager, SequenceTracker, SequencePosition } from "../src/ports/index.js";
import type { ActiveScenario, ScenaristScenario } from "../src/types/index.js";

// In-memory registry for testing (simple Map-based implementation)
const createTestRegistry = (): ScenarioRegistry => {
  const registry = new Map<string, ScenaristScenario>();

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

// In-memory sequence tracker for testing (simple Map-based implementation)
const createTestSequenceTracker = (): SequenceTracker => {
  const positions = new Map<string, SequencePosition>();

  const getKey = (testId: string, scenarioId: string, mockIndex: number): string => {
    return `${testId}:${scenarioId}:${mockIndex}`;
  };

  return {
    getPosition: (testId, scenarioId, mockIndex) => {
      const key = getKey(testId, scenarioId, mockIndex);
      return positions.get(key) ?? { position: 0, exhausted: false };
    },
    advance: (testId, scenarioId, mockIndex, totalResponses, repeatMode) => {
      const key = getKey(testId, scenarioId, mockIndex);
      const current = positions.get(key) ?? { position: 0, exhausted: false };
      const nextPosition = current.position + 1;

      if (nextPosition >= totalResponses) {
        switch (repeatMode) {
          case 'last':
            positions.set(key, { position: totalResponses - 1, exhausted: false });
            break;
          case 'cycle':
            positions.set(key, { position: 0, exhausted: false });
            break;
          case 'none':
            positions.set(key, { position: totalResponses, exhausted: true });
            break;
        }
      } else {
        positions.set(key, { position: nextPosition, exhausted: false });
      }
    },
    reset: (testId) => {
      const keysToDelete: string[] = [];
      for (const key of positions.keys()) {
        if (key.startsWith(`${testId}:`)) {
          keysToDelete.push(key);
        }
      }
      for (const key of keysToDelete) {
        positions.delete(key);
      }
    },
  };
};

// Test scenario definition factory
const createTestScenaristScenario = (
  id: string,
  name: string = "Test Scenario"
): ScenaristScenario => ({
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
const createTestSetup = (options?: { stateManager?: StateManager; sequenceTracker?: SequenceTracker }) => {
  const registry = createTestRegistry();
  const store = createTestStore();
  const stateManager = options?.stateManager;
  const sequenceTracker = options?.sequenceTracker;

  const manager = createScenarioManager({ registry, store, stateManager, sequenceTracker });

  return { registry, store, stateManager, sequenceTracker, manager };
};

describe("ScenarioManager", () => {
  describe("registerScenario", () => {
    it("should register a new scenario", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenaristScenario(
        "happy-path",
        "Happy Path"
      );

      manager.registerScenario(definition);

      const registered = manager.getScenarioById("happy-path");
      expect(registered).toEqual(definition);
    });

    it("should delegate to registry", () => {
      const { manager, registry } = createTestSetup();
      const definition = createTestScenaristScenario("test", "Test");

      manager.registerScenario(definition);

      expect(registry.has("test")).toBe(true);
    });

    it("should throw error when registering duplicate scenario ID", () => {
      const { manager } = createTestSetup();
      const definition1 = createTestScenaristScenario("duplicate", "First");
      const definition2 = createTestScenaristScenario("duplicate", "Second");

      manager.registerScenario(definition1);

      expect(() => manager.registerScenario(definition2)).toThrow(
        "Scenario 'duplicate' is already registered"
      );
    });

    it("should not overwrite existing scenario when duplicate detected", () => {
      const { manager } = createTestSetup();
      const definition1 = createTestScenaristScenario("duplicate", "First");
      const definition2 = createTestScenaristScenario("duplicate", "Second");

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
      const definition = createTestScenaristScenario("test", "Test Scenario");

      manager.registerScenario(definition);
      // Re-registering the same object should not throw
      expect(() => manager.registerScenario(definition)).not.toThrow();

      const registered = manager.getScenarioById("test");
      expect(registered).toEqual(definition);
    });

    describe("validation", () => {
      it("should reject scenario with unsafe ReDoS pattern in regex", () => {
        const { manager } = createTestSetup();
        const unsafeScenario: ScenaristScenario = {
          id: "unsafe-regex",
          name: "Unsafe Regex",
          description: "Scenario with ReDoS vulnerability",
          mocks: [
            {
              method: "GET",
              url: "/api/test",
              match: {
                headers: {
                  "x-campaign": {
                    regex: { source: "(a+)+b", flags: "" }, // Classic ReDoS pattern
                  },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(unsafeScenario);
        }).toThrow(/unsafe/i);
      });

      it("should accept scenario with safe regex pattern", () => {
        const { manager } = createTestSetup();
        const safeScenario: ScenaristScenario = {
          id: "safe-regex",
          name: "Safe Regex",
          description: "Scenario with safe regex pattern",
          mocks: [
            {
              method: "GET",
              url: "/api/test",
              match: {
                headers: {
                  "x-campaign": {
                    regex: { source: "premium|vip", flags: "i" },
                  },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(safeScenario);
        }).not.toThrow();

        const registered = manager.getScenarioById("safe-regex");
        expect(registered).toBeDefined();
      });

      it("should reject scenario with empty regex source", () => {
        const { manager } = createTestSetup();
        const emptySourceScenario: ScenaristScenario = {
          id: "empty-source",
          name: "Empty Source",
          description: "Scenario with empty regex source",
          mocks: [
            {
              method: "GET",
              url: "/api/test",
              match: {
                headers: {
                  "x-campaign": {
                    regex: { source: "", flags: "" },
                  },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(emptySourceScenario);
        }).toThrow();
      });

      it("should reject scenario with invalid regex flags", () => {
        const { manager } = createTestSetup();
        const invalidFlagsScenario: ScenaristScenario = {
          id: "invalid-flags",
          name: "Invalid Flags",
          description: "Scenario with invalid regex flags",
          mocks: [
            {
              method: "GET",
              url: "/api/test",
              match: {
                headers: {
                  "x-campaign": {
                    regex: { source: "test", flags: "x" }, // 'x' is not a valid flag
                  },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(invalidFlagsScenario);
        }).toThrow();
      });

      it("should validate multiple unsafe patterns in same scenario", () => {
        const { manager } = createTestSetup();
        const multipleUnsafeScenario: ScenaristScenario = {
          id: "multiple-unsafe",
          name: "Multiple Unsafe",
          description: "Scenario with multiple unsafe patterns",
          mocks: [
            {
              method: "GET",
              url: "/api/test1",
              match: {
                headers: {
                  "x-pattern": {
                    regex: { source: "(x+x+)+y", flags: "" }, // Exponential backtracking
                  },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(multipleUnsafeScenario);
        }).toThrow(/unsafe/i);
      });

      it("should accept regex with safe complex pattern", () => {
        const { manager } = createTestSetup();
        const complexSafeScenario: ScenaristScenario = {
          id: "complex-safe",
          name: "Complex Safe",
          description: "Scenario with complex but safe pattern",
          mocks: [
            {
              method: "GET",
              url: "/api/test",
              match: {
                headers: {
                  "x-campaign": {
                    regex: { source: "^/api/(products|categories)/\\d+$", flags: "i" },
                  },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(complexSafeScenario);
        }).not.toThrow();
      });

      it('should show <unknown> in error message when scenario has no id', () => {
        const { manager } = createTestSetup();
        // Pass definition without id field (will fail validation)
        const invalidScenario = {
          name: 'Test',
          description: 'Test',
          mocks: [],
        } as any;

        expect(() => {
          manager.registerScenario(invalidScenario);
        }).toThrow(/Invalid scenario definition for '<unknown>'/);
      });

      it("should accept scenario with contains string matching strategy", () => {
        const { manager } = createTestSetup();
        const containsScenario: ScenaristScenario = {
          id: "contains-strategy",
          name: "Contains Strategy",
          description: "Scenario with contains matching",
          mocks: [
            {
              method: "GET",
              url: "/api/products",
              match: {
                headers: {
                  "x-campaign": { contains: "premium" },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(containsScenario);
        }).not.toThrow();

        const registered = manager.getScenarioById("contains-strategy");
        expect(registered).toBeDefined();
      });

      it("should accept scenario with startsWith string matching strategy", () => {
        const { manager } = createTestSetup();
        const startsWithScenario: ScenaristScenario = {
          id: "startsWith-strategy",
          name: "StartsWith Strategy",
          description: "Scenario with startsWith matching",
          mocks: [
            {
              method: "GET",
              url: "/api/keys",
              match: {
                headers: {
                  "x-api-key": { startsWith: "sk_" },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(startsWithScenario);
        }).not.toThrow();

        const registered = manager.getScenarioById("startsWith-strategy");
        expect(registered).toBeDefined();
      });

      it("should accept scenario with endsWith string matching strategy", () => {
        const { manager } = createTestSetup();
        const endsWithScenario: ScenaristScenario = {
          id: "endsWith-strategy",
          name: "EndsWith Strategy",
          description: "Scenario with endsWith matching",
          mocks: [
            {
              method: "GET",
              url: "/api/users",
              match: {
                query: {
                  email: { endsWith: "@company.com" },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(endsWithScenario);
        }).not.toThrow();

        const registered = manager.getScenarioById("endsWith-strategy");
        expect(registered).toBeDefined();
      });

      it("should accept scenario with equals string matching strategy", () => {
        const { manager } = createTestSetup();
        const equalsScenario: ScenaristScenario = {
          id: "equals-strategy",
          name: "Equals Strategy",
          description: "Scenario with equals matching",
          mocks: [
            {
              method: "GET",
              url: "/api/status",
              match: {
                headers: {
                  "x-exact": { equals: "exact-value" },
                },
              },
              response: { status: 200, body: {} },
            },
          ],
        };

        expect(() => {
          manager.registerScenario(equalsScenario);
        }).not.toThrow();

        const registered = manager.getScenarioById("equals-strategy");
        expect(registered).toBeDefined();
      });
    });
  });

  describe("switchScenario", () => {
    it("should switch to a registered scenario for a test ID", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenaristScenario(
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

    it("should isolate scenarios by test ID", () => {
      const { manager } = createTestSetup();
      const definition1 = createTestScenaristScenario(
        "scenario-1",
        "Scenario 1"
      );
      const definition2 = createTestScenaristScenario(
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
      const definition = createTestScenaristScenario("test", "Test");
      manager.registerScenario(definition);

      manager.switchScenario("test-123", "test");

      const active = store.get("test-123");
      expect(active).toEqual({
        scenarioId: "test",
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
      const definition = createTestScenaristScenario("test", "Test");
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
        createTestScenaristScenario("scenario-1", "Scenario 1")
      );
      manager.registerScenario(
        createTestScenaristScenario("scenario-2", "Scenario 2")
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
      manager.registerScenario(createTestScenaristScenario("test", "Test"));

      const scenarios = manager.listScenarios();

      expect(scenarios).toEqual(registry.list());
    });
  });

  describe("clearScenario", () => {
    it("should clear active scenario for a test ID", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenaristScenario("test", "Test");
      manager.registerScenario(definition);
      manager.switchScenario("test-123", "test");

      manager.clearScenario("test-123");

      const active = manager.getActiveScenario("test-123");
      expect(active).toBeUndefined();
    });

    it("should not affect other test IDs when clearing", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenaristScenario("test", "Test");
      manager.registerScenario(definition);
      manager.switchScenario("test-A", "test");
      manager.switchScenario("test-B", "test");

      manager.clearScenario("test-A");

      expect(manager.getActiveScenario("test-A")).toBeUndefined();
      expect(manager.getActiveScenario("test-B")).toBeDefined();
    });

    it("should delegate to store", () => {
      const { manager, store } = createTestSetup();
      const definition = createTestScenaristScenario("test", "Test");
      manager.registerScenario(definition);
      manager.switchScenario("test-123", "test");

      manager.clearScenario("test-123");

      expect(store.has("test-123")).toBe(false);
    });
  });

  describe("getScenarioById", () => {
    it("should return scenario definition by ID", () => {
      const { manager } = createTestSetup();
      const definition = createTestScenaristScenario("test", "Test Scenario");
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
      const definition = createTestScenaristScenario("test", "Test");
      manager.registerScenario(definition);

      const retrieved = manager.getScenarioById("test");

      expect(retrieved).toEqual(registry.get("test"));
    });
  });

  describe("State Reset on Scenario Switch", () => {
    it("should reset state when switching scenarios", () => {
      const stateManager = createTestStateManager();
      const { manager } = createTestSetup({ stateManager });

      const scenario1 = createTestScenaristScenario("scenario-1", "Scenario 1");
      const scenario2 = createTestScenaristScenario("scenario-2", "Scenario 2");

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

      const scenario1 = createTestScenaristScenario("scenario-1", "Scenario 1");
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

      const scenario1 = createTestScenaristScenario("scenario-1", "Scenario 1");
      const scenario2 = createTestScenaristScenario("scenario-2", "Scenario 2");

      manager.registerScenario(scenario1);
      manager.registerScenario(scenario2);

      // Should not throw when switching without state manager
      const result = manager.switchScenario("test-1", "scenario-2");

      expect(result.success).toBe(true);
    });

    it("should isolate state reset per test ID", () => {
      const stateManager = createTestStateManager();
      const { manager } = createTestSetup({ stateManager });

      const scenario1 = createTestScenaristScenario("scenario-1", "Scenario 1");
      const scenario2 = createTestScenaristScenario("scenario-2", "Scenario 2");

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

  describe("Sequence Reset on Scenario Switch", () => {
    it("should reset sequence positions when switching scenarios", () => {
      const sequenceTracker = createTestSequenceTracker();
      const { manager } = createTestSetup({ sequenceTracker });

      const scenario1 = createTestScenaristScenario("scenario-1", "Scenario 1");
      const scenario2 = createTestScenaristScenario("scenario-2", "Scenario 2");

      manager.registerScenario(scenario1);
      manager.registerScenario(scenario2);

      // Advance sequences for test-1 in scenario-1
      sequenceTracker.advance("test-1", "scenario-1", 0, 3, "last");
      sequenceTracker.advance("test-1", "scenario-1", 1, 3, "last");

      // Verify sequences are advanced
      expect(sequenceTracker.getPosition("test-1", "scenario-1", 0).position).toBe(1);
      expect(sequenceTracker.getPosition("test-1", "scenario-1", 1).position).toBe(1);

      // Switch to scenario-2
      manager.switchScenario("test-1", "scenario-2");

      // All sequences for test-1 should be reset
      expect(sequenceTracker.getPosition("test-1", "scenario-1", 0).position).toBe(0);
      expect(sequenceTracker.getPosition("test-1", "scenario-1", 1).position).toBe(0);
      expect(sequenceTracker.getPosition("test-1", "scenario-1", 0).exhausted).toBe(false);
    });

    it("should not reset sequences when switching fails", () => {
      const sequenceTracker = createTestSequenceTracker();
      const { manager } = createTestSetup({ sequenceTracker });

      const scenario1 = createTestScenaristScenario("scenario-1", "Scenario 1");
      manager.registerScenario(scenario1);

      // Advance sequence for test-1
      sequenceTracker.advance("test-1", "scenario-1", 0, 3, "last");

      // Verify sequence is advanced
      expect(sequenceTracker.getPosition("test-1", "scenario-1", 0).position).toBe(1);

      // Try to switch to non-existent scenario
      const result = manager.switchScenario("test-1", "non-existent");

      // Switch should fail
      expect(result.success).toBe(false);

      // Sequence position should NOT be reset (switch failed)
      expect(sequenceTracker.getPosition("test-1", "scenario-1", 0).position).toBe(1);
    });

    it("should work without sequence tracker (backward compatibility)", () => {
      const { manager } = createTestSetup(); // No sequence tracker

      const scenario1 = createTestScenaristScenario("scenario-1", "Scenario 1");
      const scenario2 = createTestScenaristScenario("scenario-2", "Scenario 2");

      manager.registerScenario(scenario1);
      manager.registerScenario(scenario2);

      // Should not throw when switching without sequence tracker
      const result = manager.switchScenario("test-1", "scenario-2");

      expect(result.success).toBe(true);
    });

    it("should isolate sequence reset per test ID", () => {
      const sequenceTracker = createTestSequenceTracker();
      const { manager } = createTestSetup({ sequenceTracker });

      const scenario1 = createTestScenaristScenario("scenario-1", "Scenario 1");
      const scenario2 = createTestScenaristScenario("scenario-2", "Scenario 2");

      manager.registerScenario(scenario1);
      manager.registerScenario(scenario2);

      // Advance sequences for multiple test IDs
      sequenceTracker.advance("test-1", "scenario-1", 0, 3, "last");
      sequenceTracker.advance("test-2", "scenario-1", 0, 3, "last");

      // Verify both are advanced
      expect(sequenceTracker.getPosition("test-1", "scenario-1", 0).position).toBe(1);
      expect(sequenceTracker.getPosition("test-2", "scenario-1", 0).position).toBe(1);

      // Switch only test-1
      manager.switchScenario("test-1", "scenario-2");

      // Only test-1 sequences should be reset
      expect(sequenceTracker.getPosition("test-1", "scenario-1", 0).position).toBe(0);
      // test-2 sequences should remain
      expect(sequenceTracker.getPosition("test-2", "scenario-1", 0).position).toBe(1);
    });
  });
});
