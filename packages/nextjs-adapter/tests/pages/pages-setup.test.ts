import { describe, it, expect, vi } from "vitest";
import type { Logger, ScenaristScenarios } from "@scenarist/core";
import { createScenarist } from "../../src/pages/setup.js";

const requireDefined = <T>(value: T | undefined): T => {
  expect(value).toBeDefined();
  return value as T;
};

const clearAllGlobals = () => {
  delete (global as unknown as Record<string, unknown>)
    .__scenarist_instance_pages;
  delete (global as unknown as Record<string, unknown>)
    .__scenarist_registry_pages;
  delete (global as unknown as Record<string, unknown>).__scenarist_store_pages;
  delete (global as unknown as Record<string, unknown>)
    .__scenarist_msw_started_pages;
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

  it("should provide state endpoint handler", async () => {
    const { scenarist } = await createTestSetup();

    expect(scenarist.createStateEndpoint).toBeDefined();
    expect(typeof scenarist.createStateEndpoint).toBe("function");
  });

  it("should create working state endpoint when called", async () => {
    const { scenarist } = await createTestSetup();

    const endpoint = scenarist.createStateEndpoint();

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
          enabled: true,
          strictMode: true, // Different strictMode
          scenarios: testScenarios,
        }),
      );

      expect(instance1).toBe(instance2);
      // Original config should be preserved
      expect(instance2.config.strictMode).toBe(false);
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
        .__scenarist_registry_pages;
      const originalStore = (global as unknown as Record<string, unknown>)
        .__scenarist_store_pages;

      // Clear ONLY the instance, leaving registry and store intact
      // This simulates HMR clearing some globals but not others
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_instance_pages;

      // Second call should reuse existing registry and store
      const instance2 = requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      // Verify the same registry and store are being used
      expect(
        (global as unknown as Record<string, unknown>)
          .__scenarist_registry_pages,
      ).toBe(originalRegistry);
      expect(
        (global as unknown as Record<string, unknown>).__scenarist_store_pages,
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
        .__scenarist_registry_pages;

      // Clear instance and store, leaving only registry
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_instance_pages;
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_store_pages;

      // Second call should reuse registry and create new store
      requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      // Registry should be reused, store should be new
      expect(
        (global as unknown as Record<string, unknown>)
          .__scenarist_registry_pages,
      ).toBe(originalRegistry);
      expect(
        (global as unknown as Record<string, unknown>).__scenarist_store_pages,
      ).toBeDefined();
    });

    it("should reuse existing store when registry is missing", async () => {
      // First call creates everything
      createScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      const originalStore = (global as unknown as Record<string, unknown>)
        .__scenarist_store_pages;

      // Clear instance and registry, leaving only store
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_instance_pages;
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_registry_pages;

      // Second call should create new registry and reuse store
      requireDefined(
        createScenarist({
          enabled: true,
          scenarios: testScenarios,
        }),
      );

      // Store should be reused, registry should be new
      expect(
        (global as unknown as Record<string, unknown>).__scenarist_store_pages,
      ).toBe(originalStore);
      expect(
        (global as unknown as Record<string, unknown>)
          .__scenarist_registry_pages,
      ).toBeDefined();
    });
  });

  describe("Singleton guard in start() method", () => {
    // Clean up global flag between tests
    const clearGlobalFlag = () => {
      delete (global as unknown as Record<string, unknown>)
        .__scenarist_msw_started_pages;
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
});

const createMockLogger = (): Logger => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
  isEnabled: () => true,
});

describe("Pages Router createScenarist runtime configuration", () => {
  it("returns undefined when enabled is false", () => {
    clearAllGlobals();

    const scenarist = createScenarist({
      enabled: false,
      scenarios: testScenarios,
    });

    expect(scenarist).toBeUndefined();
  });

  it("returns undefined when enabled is false even after an enabled instance exists", () => {
    clearAllGlobals();
    requireDefined(createScenarist({ enabled: true, scenarios: testScenarios }));

    const scenarist = createScenarist({
      enabled: false,
      scenarios: testScenarios,
    });

    expect(scenarist).toBeUndefined();
    clearAllGlobals();
  });

  it("responds 500 with NO_MOCK_FOUND when onNoMockFound is throw", async () => {
    clearAllGlobals();
    const scenarist = requireDefined(
      createScenarist({
        enabled: true,
        scenarios: testScenarios,
        errorBehaviors: { onNoMockFound: "throw" },
      }),
    );

    scenarist.start();
    try {
      const response = await fetch(
        "https://pages-no-mock-throw.example.test/data",
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual(
        expect.objectContaining({ code: "NO_MOCK_FOUND" }),
      );
    } finally {
      await scenarist.stop();
      clearAllGlobals();
    }
  });

  it("logs a warning through the configured logger when onNoMockFound is warn", async () => {
    clearAllGlobals();
    const logger = createMockLogger();
    const scenarist = requireDefined(
      createScenarist({
        enabled: true,
        strictMode: true,
        scenarios: testScenarios,
        logger,
        errorBehaviors: { onNoMockFound: "warn" },
      }),
    );

    scenarist.start();
    try {
      const response = await fetch(
        "https://pages-no-mock-warn.example.test/data",
        { headers: { "x-scenarist-test-id": "pages-warn" } },
      );

      expect(response.status).toBe(501);
      expect(logger.warn).toHaveBeenCalledWith(
        "matching",
        "No mock matched for GET https://pages-no-mock-warn.example.test/data",
        expect.objectContaining({ testId: "pages-warn" }),
      );
    } finally {
      await scenarist.stop();
      clearAllGlobals();
    }
  });

  it("responds 500 with MISSING_TEST_ID when no test ID resolves and onMissingTestId is throw", async () => {
    clearAllGlobals();
    const scenarist = requireDefined(
      createScenarist({
        enabled: true,
        scenarios: testScenarios,
        defaultTestId: "",
        errorBehaviors: { onMissingTestId: "throw" },
      }),
    );

    scenarist.start();
    try {
      const response = await fetch(
        "https://pages-missing-test-id.example.test/data",
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual(
        expect.objectContaining({ code: "MISSING_TEST_ID" }),
      );
    } finally {
      await scenarist.stop();
      clearAllGlobals();
    }
  });
});
