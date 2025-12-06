import { describe, it, expect, vi } from "vitest";
import {
  createScenarioEndpoint,
  createStateEndpoint,
} from "../../src/app/endpoints.js";
import { createEndpointTestSetup } from "../common/test-setup.js";
import {
  buildConfig,
  createScenarioManager,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  InMemoryStateManager,
} from "@scenarist/core";

const createTestSetup = () => createEndpointTestSetup(createScenarioEndpoint);

describe("App Router Scenario Endpoints", () => {
  describe("POST (switch scenario)", () => {
    it("should switch to a valid scenario", async () => {
      const { handler } = createTestSetup();

      const req = new Request("http://localhost:3000/__scenario__", {
        method: "POST",
        headers: {
          "x-scenarist-test-id": "test-123",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenario: "premium",
        }),
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        testId: "test-123",
        scenarioId: "premium",
      });
    });

    it("should return 400 when scenario does not exist", async () => {
      const { handler } = createTestSetup();

      const req = new Request("http://localhost:3000/__scenario__", {
        method: "POST",
        headers: {
          "x-scenarist-test-id": "test-789",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenario: "nonexistent",
        }),
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("not found");
    });

    it("should return 400 when request body is invalid", async () => {
      const { handler } = createTestSetup();

      const req = new Request("http://localhost:3000/__scenario__", {
        method: "POST",
        headers: {
          "x-scenarist-test-id": "test-bad",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          // Missing 'scenario' field
        }),
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("should return 500 for unexpected errors during request handling", async () => {
      const { handler, manager } = createTestSetup();

      // Mock switchScenario to throw an unexpected error
      vi.spyOn(manager, "switchScenario").mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      const req = new Request("http://localhost:3000/__scenario__", {
        method: "POST",
        headers: {
          "x-scenarist-test-id": "test-error",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenario: "premium",
        }),
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("GET (retrieve active scenario)", () => {
    it("should return active scenario for test ID", async () => {
      const { handler, manager } = createTestSetup();

      // First, switch to a scenario
      manager.switchScenario("test-abc", "premium", undefined);

      const req = new Request("http://localhost:3000/__scenario__", {
        method: "GET",
        headers: {
          "x-scenarist-test-id": "test-abc",
        },
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        testId: "test-abc",
        scenarioId: "premium",
        scenarioName: "Premium Scenario",
      });
    });

    it("should return 404 when no active scenario exists", async () => {
      const { handler } = createTestSetup();

      const req = new Request("http://localhost:3000/__scenario__", {
        method: "GET",
        headers: {
          "x-scenarist-test-id": "test-no-scenario",
        },
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("No active scenario");
      expect(data.testId).toBe("test-no-scenario");
    });
  });

  describe("unsupported methods", () => {
    it("should return 405 for unsupported methods", async () => {
      const { handler } = createTestSetup();

      const req = new Request("http://localhost:3000/__scenario__", {
        method: "PUT",
        headers: {
          "x-scenarist-test-id": "test-put",
        },
      });

      const response = await handler(req);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe("Method not allowed");
    });
  });
});

describe("App Router State Endpoint", () => {
  const createStateTestSetup = () => {
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

    const handler = createStateEndpoint(manager, config);

    return { handler, manager, config, stateManager };
  };

  it("should return current state for test ID", async () => {
    const { handler, stateManager } = createStateTestSetup();

    stateManager.set("test-123", "userId", "user-456");
    stateManager.set("test-123", "phase", "submitted");

    const req = new Request("http://localhost:3000/__scenarist__/state", {
      method: "GET",
      headers: {
        "x-scenarist-test-id": "test-123",
      },
    });

    const response = await handler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      testId: "test-123",
      state: {
        userId: "user-456",
        phase: "submitted",
      },
    });
  });

  it("should return empty state when no state has been set", async () => {
    const { handler } = createStateTestSetup();

    const req = new Request("http://localhost:3000/__scenarist__/state", {
      method: "GET",
      headers: {
        "x-scenarist-test-id": "test-new",
      },
    });

    const response = await handler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      testId: "test-new",
      state: {},
    });
  });

  it("should use default test ID when header is missing", async () => {
    const { handler, stateManager } = createStateTestSetup();

    stateManager.set("default-test", "count", 5);

    const req = new Request("http://localhost:3000/__scenarist__/state", {
      method: "GET",
    });

    const response = await handler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      testId: "default-test",
      state: { count: 5 },
    });
  });
});
