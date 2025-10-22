import type { ScenarioDefinition } from "@scenarist/core";
import type { Test } from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createScenaristTestClient } from "../src/test-client.js";

/**
 * Mock scenario definitions for testing
 */
const mockScenario = (
  overrides?: Partial<ScenarioDefinition>
): ScenarioDefinition => ({
  id: "test-scenario",
  name: "Test Scenario",
  description: "A test scenario",
  mocks: [],
  ...overrides,
});

describe("createScenaristTestClient", () => {
  describe("Type safety", () => {
    it("should provide type-safe scenario keys", () => {
      const scenarios = {
        success: mockScenario({ id: "success" }),
        error: mockScenario({ id: "error" }),
      } as const;

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios);

      client.switchTo("success");
      // These should compile without errors
      client.switchTo("success");
      client.switchTo("error");

      // This would be a TypeScript error if uncommented:
      // client.switchTo('nonexistent');
    });
  });

  describe("switchTo", () => {
    it("should POST to scenario endpoint with scenario ID", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios);

      client.switchTo("success");

      expect(mockRequest.post).toHaveBeenCalledWith("/__scenario__");
      expect(mockRequest.send).toHaveBeenCalledWith({
        scenario: "success-scenario",
      });
    });

    it("should include test ID header when provided", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios);

      client.switchTo("success", "test-123");

      expect(mockRequest.set).toHaveBeenCalledWith("x-test-id", "test-123");
    });

    it("should not include test ID header when not provided", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios);

      client.switchTo("success");

      expect(mockRequest.set).not.toHaveBeenCalled();
    });

    it("should use custom scenario endpoint when configured", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios, {
        scenarioEndpoint: "/custom-endpoint",
      });

      client.switchTo("success");

      expect(mockRequest.post).toHaveBeenCalledWith("/custom-endpoint");
    });

    it("should use custom test ID header when configured", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios, {
        testIdHeader: "x-custom-test-id",
      });

      client.switchTo("success", "test-123");

      expect(mockRequest.set).toHaveBeenCalledWith(
        "x-custom-test-id",
        "test-123"
      );
    });
  });

  describe("getCurrent", () => {
    it("should GET from scenario endpoint", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios);

      client.getCurrent();

      expect(mockRequest.get).toHaveBeenCalledWith("/__scenario__");
    });

    it("should include test ID header when provided", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios);

      client.getCurrent("test-123");

      expect(mockRequest.set).toHaveBeenCalledWith("x-test-id", "test-123");
    });

    it("should not include test ID header when not provided", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios);

      client.getCurrent();

      expect(mockRequest.set).not.toHaveBeenCalled();
    });

    it("should use custom scenario endpoint when configured", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios, {
        scenarioEndpoint: "/custom-endpoint",
      });

      client.getCurrent();

      expect(mockRequest.get).toHaveBeenCalledWith("/custom-endpoint");
    });
  });

  describe("scenarios property", () => {
    it("should expose the scenarios registry", () => {
      const scenarios = {
        success: mockScenario({ id: "success-scenario" }),
        error: mockScenario({ id: "error-scenario" }),
      };

      const mockRequest = {
        post: vi.fn(() => mockRequest as unknown as Test),
        get: vi.fn(() => mockRequest as unknown as Test),
        send: vi.fn(() => mockRequest as unknown as Test),
        set: vi.fn(() => mockRequest as unknown as Test),
      };

      const client = createScenaristTestClient(() => mockRequest, scenarios);

      expect(client.scenarios).toBe(scenarios);
      expect(client.scenarios.success.id).toBe("success-scenario");
      expect(client.scenarios.error.id).toBe("error-scenario");
    });
  });
});
