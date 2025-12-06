import { describe, it, expect } from "vitest";
import {
  handlePostLogic,
  handleGetStateLogic,
} from "../../src/common/endpoint-handlers.js";
import {
  buildConfig,
  createScenarioManager,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  InMemoryStateManager,
  type RequestContext,
} from "@scenarist/core";

const createTestSetup = () => {
  const defaultScenario = {
    id: "default",
    name: "Default Scenario",
    description: "Default test scenario",
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
    getTestId: () => "test-123",
  };

  return { manager, config, context };
};

describe("Common Endpoint Handlers", () => {
  describe("handlePostLogic", () => {
    it("should return validation error details when request body is invalid", async () => {
      const { manager, context } = createTestSetup();

      // Invalid body: missing required 'scenario' field
      const invalidBody = { invalidField: "value" };

      const result = await handlePostLogic(invalidBody, context, manager);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toBe("Invalid request body");
        // This is the critical assertion - we need error.issues not error.errors
        expect(result.details).toBeDefined();
        expect(Array.isArray(result.details)).toBe(true);
      }
    });

    it("should return validation error for empty scenario string", async () => {
      const { manager, context } = createTestSetup();

      // Invalid body: scenario is empty string (violates min(1))
      const invalidBody = { scenario: "" };

      const result = await handlePostLogic(invalidBody, context, manager);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toBe("Invalid request body");
        expect(result.details).toBeDefined();
        expect(Array.isArray(result.details)).toBe(true);
        // Verify we get specific validation error for empty string
        const details = result.details as Array<{ path: string[] }>;
        expect(details.some((d) => d.path.includes("scenario"))).toBe(true);
      }
    });
  });

  describe("handleGetStateLogic", () => {
    const createTestSetupWithState = () => {
      const defaultScenario = {
        id: "default",
        name: "Default Scenario",
        description: "Default test scenario",
        mocks: [],
      };

      const registry = new InMemoryScenarioRegistry();
      const store = new InMemoryScenarioStore();
      const stateManager = new InMemoryStateManager();
      const config = buildConfig({
        enabled: true,
        scenarios: { default: defaultScenario },
      });
      const manager = createScenarioManager({ registry, store, stateManager });

      manager.registerScenario(defaultScenario);

      return { manager, config, stateManager };
    };

    it("should return current state for test ID", () => {
      const { manager, stateManager } = createTestSetupWithState();
      const context: RequestContext = {
        getTestId: () => "test-123",
      };

      // Set some state
      stateManager.set("test-123", "userId", "user-456");
      stateManager.set("test-123", "phase", "submitted");

      const result = handleGetStateLogic(context, manager);

      expect(result).toEqual({
        testId: "test-123",
        state: {
          userId: "user-456",
          phase: "submitted",
        },
      });
    });

    it("should return empty state when no state has been set", () => {
      const { manager } = createTestSetupWithState();
      const context: RequestContext = {
        getTestId: () => "test-new",
      };

      const result = handleGetStateLogic(context, manager);

      expect(result).toEqual({
        testId: "test-new",
        state: {},
      });
    });

    it("should isolate state per test ID", () => {
      const { manager, stateManager } = createTestSetupWithState();

      stateManager.set("test-1", "userId", "user-1");
      stateManager.set("test-2", "userId", "user-2");

      const context1: RequestContext = { getTestId: () => "test-1" };
      const context2: RequestContext = { getTestId: () => "test-2" };

      const result1 = handleGetStateLogic(context1, manager);
      const result2 = handleGetStateLogic(context2, manager);

      expect(result1.state).toEqual({ userId: "user-1" });
      expect(result2.state).toEqual({ userId: "user-2" });
    });
  });
});
