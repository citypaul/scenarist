import { describe, it, expect, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  createScenarioEndpoint,
  createStateEndpoint,
} from "../../src/pages/endpoints.js";
import { createEndpointTestSetup } from "../common/test-setup.js";
import {
  buildConfig,
  createScenarioManager,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  InMemoryStateManager,
} from "@scenarist/core";

const createTestSetup = () => createEndpointTestSetup(createScenarioEndpoint);

describe("Pages Router Scenario Endpoints", () => {
  describe("POST (switch scenario)", () => {
    it("should switch to a valid scenario", async () => {
      const { handler } = createTestSetup();

      const req = {
        method: "POST",
        headers: {
          "x-scenarist-test-id": "test-123",
        },
        body: {
          scenario: "premium",
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        testId: "test-123",
        scenarioId: "premium",
      });
    });

    it("should return 400 when scenario does not exist", async () => {
      const { handler } = createTestSetup();

      const req = {
        method: "POST",
        headers: {
          "x-scenarist-test-id": "test-789",
        },
        body: {
          scenario: "nonexistent",
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("not found"),
        }),
      );
    });

    it("should return 400 when request body is invalid", async () => {
      const { handler } = createTestSetup();

      const req = {
        method: "POST",
        headers: {
          "x-scenarist-test-id": "test-bad",
        },
        body: {
          // Missing 'scenario' field
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid request body",
        }),
      );
    });

    it("should return 500 for unexpected errors during request handling", async () => {
      const { handler, manager } = createTestSetup();

      // Mock switchScenario to throw an unexpected error
      vi.spyOn(manager, "switchScenario").mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      const req = {
        method: "POST",
        headers: {
          "x-scenarist-test-id": "test-error",
        },
        body: {
          scenario: "premium",
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("GET (retrieve active scenario)", () => {
    it("should return active scenario for test ID", async () => {
      const { handler, manager } = createTestSetup();

      // First, switch to a scenario
      manager.switchScenario("test-abc", "premium", undefined);

      const req = {
        method: "GET",
        headers: {
          "x-scenarist-test-id": "test-abc",
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        testId: "test-abc",
        scenarioId: "premium",
        scenarioName: "Premium Scenario",
      });
    });

    it("should return 404 when no active scenario exists", async () => {
      const { handler } = createTestSetup();

      const req = {
        method: "GET",
        headers: {
          "x-scenarist-test-id": "test-no-scenario",
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("No active scenario"),
          testId: "test-no-scenario",
        }),
      );
    });
  });

  describe("unsupported methods", () => {
    it("should return 405 for unsupported methods", async () => {
      const { handler } = createTestSetup();

      const req = {
        method: "PUT",
        headers: {
          "x-scenarist-test-id": "test-put",
        },
      } as NextApiRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as NextApiResponse;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: "Method not allowed",
      });
    });
  });
});

describe("Pages Router State Endpoint", () => {
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

    const req = {
      method: "GET",
      headers: {
        "x-scenarist-test-id": "test-123",
      },
    } as NextApiRequest;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      testId: "test-123",
      state: {
        userId: "user-456",
        phase: "submitted",
      },
    });
  });

  it("should return empty state when no state has been set", async () => {
    const { handler } = createStateTestSetup();

    const req = {
      method: "GET",
      headers: {
        "x-scenarist-test-id": "test-new",
      },
    } as NextApiRequest;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      testId: "test-new",
      state: {},
    });
  });

  it("should use default test ID when header is missing", async () => {
    const { handler, stateManager } = createStateTestSetup();

    stateManager.set("default-test", "count", 5);

    const req = {
      method: "GET",
      headers: {},
    } as NextApiRequest;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      testId: "default-test",
      state: { count: 5 },
    });
  });
});
