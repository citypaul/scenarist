import {
  createInMemorySequenceTracker,
  createInMemoryStateManager,
  SCENARIST_TEST_ID_HEADER,
  type ScenaristScenarios,
} from "@scenarist/core";
import { describe, expect, it } from "vitest";
import { createScenarist } from "../../src/app/setup.js";

const requireDefined = <T>(value: T | undefined): T => {
  expect(value).toBeDefined();
  return value as T;
};

const clearAllGlobals = () => {
  delete (global as unknown as Record<string, unknown>).__scenarist_instance;
  delete (global as unknown as Record<string, unknown>).__scenarist_registry;
  delete (global as unknown as Record<string, unknown>).__scenarist_store;
  delete (global as unknown as Record<string, unknown>).__scenarist_msw_started;
};

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

const createTestSetup = () => {
  const scenarist = requireDefined(
    createScenarist({
      enabled: true,
      scenarios: testScenarios,
    }),
  );
  return { scenarist };
};

describe("App Router createScenarist", () => {
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
      const instance1 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      const instance2 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      // Both instances should see the same scenarios
      const scenarios1 = instance1.listScenarios();
      const scenarios2 = instance2.listScenarios();

      expect(scenarios1).toEqual(scenarios2);
      expect(scenarios1).toHaveLength(3); // default + premium + scenario2
    });

    it("should share scenario store across all instances", async () => {
      const instance1 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      const instance2 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

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
      const instance2 = requireDefined(
        createScenarist({
          enabled: false, // Different enabled flag
          scenarios: testScenarios,
        }),
      );

      expect(instance1).toBe(instance2);
      // Original config should be preserved
      expect(instance2.config.enabled).toBe(true); // Not false!
    });

    it("should reuse existing registry/store when instance is cleared but globals persist", async () => {
      // First call creates everything
      requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      // Store references to the global registry and store
      const originalRegistry = (global as unknown as Record<string, unknown>)
        .__scenarist_registry;
      const originalStore = (global as unknown as Record<string, unknown>)
        .__scenarist_store;

      // Clear ONLY the instance, leaving registry and store intact
      // This simulates HMR clearing some globals but not others
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_instance;

      // Second call should reuse existing registry and store
      const instance2 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      // Verify the same registry and store are being used
      expect(
        (global as unknown as Record<string, unknown>).__scenarist_registry,
      ).toBe(originalRegistry);
      expect(
        (global as unknown as Record<string, unknown>).__scenarist_store,
      ).toBe(originalStore);

      // New instance should work with the reused registry/store
      instance2.switchScenario("test-reuse-1", "premium");
      const active = instance2.getActiveScenario("test-reuse-1");
      expect(active).toEqual({
        scenarioId: "premium",
      });
    });

    it("should reuse existing registry when store is missing", async () => {
      // First call creates everything
      createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      const originalRegistry = (global as unknown as Record<string, unknown>)
        .__scenarist_registry;

      // Clear instance and store, leaving only registry
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_instance;
      delete (global as unknown as Record<string, unknown>).__scenarist_store;

      // Second call should reuse registry and create new store
      requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      // Registry should be reused, store should be new
      expect(
        (global as unknown as Record<string, unknown>).__scenarist_registry,
      ).toBe(originalRegistry);
      expect(
        (global as unknown as Record<string, unknown>).__scenarist_store,
      ).toBeDefined();
    });

    it("should reuse existing store when registry is missing", async () => {
      // First call creates everything
      createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      const originalStore = (global as unknown as Record<string, unknown>)
        .__scenarist_store;

      // Clear instance and registry, leaving only store
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_instance;
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_registry;

      // Second call should create new registry and reuse store
      requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      // Store should be reused, registry should be new
      expect(
        (global as unknown as Record<string, unknown>).__scenarist_store,
      ).toBe(originalStore);
      expect(
        (global as unknown as Record<string, unknown>).__scenarist_registry,
      ).toBeDefined();
    });
  });

  describe("Singleton guard in start() method", () => {
    // Clean up global flag between tests
    const clearGlobalFlag = () => {
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_msw_started;
    };

    it("should start MSW on first start() call", async () => {
      clearGlobalFlag();
      const { scenarist } = await createTestSetup();

      // Should start MSW without throwing
      expect(() => scenarist.start()).not.toThrow();
    });

    it("should skip MSW initialization on subsequent start() calls from different instances", async () => {
      clearGlobalFlag();
      const scenarist1 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );
      const scenarist2 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      scenarist1.start(); // First call - should start MSW

      // Second call from different instance - should skip but not throw
      expect(() => scenarist2.start()).not.toThrow();
    });

    it("should share scenario store across multiple instances", async () => {
      clearGlobalFlag();
      const scenarist1 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );
      const scenarist2 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

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

  describe("Dependency injection", () => {
    beforeEach(() => {
      clearAllGlobals();
    });

    it("should clear injected stateManager state when switching scenarios", () => {
      const stateManager = createInMemoryStateManager();
      stateManager.set("test-di-1", "userId", "user-123");
      stateManager.set("test-di-1", "cartItems", "item1,item2");

      const scenarist = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
          stateManager,
        }),
      );

      // Verify state exists before switch
      expect(stateManager.get("test-di-1", "userId")).toBe("user-123");

      scenarist.switchScenario("test-di-1", "premium");

      // If adapter correctly used our stateManager, state should be cleared
      // If adapter created its own internal one, our state would be unchanged
      expect(stateManager.get("test-di-1", "userId")).toBeUndefined();
      expect(stateManager.get("test-di-1", "cartItems")).toBeUndefined();
    });

    it("should reset injected sequenceTracker positions when switching scenarios", () => {
      const sequenceTracker = createInMemorySequenceTracker();
      sequenceTracker.advance("test-di-2", "login-sequence");
      sequenceTracker.advance("test-di-2", "login-sequence");

      const scenarist = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
          sequenceTracker,
        }),
      );

      // Verify sequence is advanced before switch
      expect(
        sequenceTracker.getPosition("test-di-2", "login-sequence").position,
      ).toBe(2);

      scenarist.switchScenario("test-di-2", "premium");

      // If adapter correctly used our sequenceTracker, position should be reset
      // If adapter created its own internal one, our position would be unchanged
      expect(
        sequenceTracker.getPosition("test-di-2", "login-sequence").position,
      ).toBe(0);
    });
  });

  describe("MSW request handling", () => {
    // Scenarios with actual mock responses for HTTP testing
    const httpTestScenarios = {
      default: {
        id: "default",
        name: "Default",
        description: "Default scenario",
        mocks: [
          {
            method: "GET" as const,
            url: "https://api.example.com/user",
            response: { status: 200, body: { tier: "free" } },
          },
        ],
      },
      premium: {
        id: "premium",
        name: "Premium",
        description: "Premium scenario",
        mocks: [
          {
            method: "GET" as const,
            url: "https://api.example.com/user",
            response: { status: 200, body: { tier: "premium" } },
          },
        ],
      },
    } as const satisfies ScenaristScenarios;

    it("should route requests to correct scenario based on test ID header", async () => {
      clearAllGlobals();

      const scenarist = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: httpTestScenarios,
          defaultTestId: "fallback-test",
        }),
      );

      scenarist.start();

      // Set up different scenarios for different test IDs
      scenarist.switchScenario("test-free", "default");
      scenarist.switchScenario("test-premium", "premium");
      scenarist.switchScenario("fallback-test", "premium");

      // Request with test-free header should get free tier response
      const freeResponse = await fetch("https://api.example.com/user", {
        headers: { [SCENARIST_TEST_ID_HEADER]: "test-free" },
      });
      const freeData = await freeResponse.json();
      expect(freeData.tier).toBe("free");

      // Request with test-premium header should get premium tier response
      const premiumResponse = await fetch("https://api.example.com/user", {
        headers: { [SCENARIST_TEST_ID_HEADER]: "test-premium" },
      });
      const premiumData = await premiumResponse.json();
      expect(premiumData.tier).toBe("premium");

      // Request WITHOUT header should fall back to defaultTestId
      const fallbackResponse = await fetch("https://api.example.com/user");
      const fallbackData = await fallbackResponse.json();
      expect(fallbackData.tier).toBe("premium");

      await scenarist.stop();
    });
  });
});
