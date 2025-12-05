import { describe, it, expect, vi } from "vitest";
import { setupServer } from "msw/node";
import { createDynamicHandler } from "../src/handlers/dynamic-handler.js";
import type {
  ActiveScenario,
  ScenaristScenario,
  ErrorBehaviors,
  Logger,
} from "@scenarist/core";
import {
  createResponseSelector,
  createInMemorySequenceTracker,
} from "@scenarist/core";
import { mockDefinition, mockScenario } from "./factories.js";

describe("Dynamic Handler", () => {
  // Create ResponseSelector once for all tests
  const responseSelector = createResponseSelector();

  describe("Basic handler setup", () => {
    it("should return mocked response when mock matches request", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "happy-path",
          mockScenario({
            id: "happy-path",
            mocks: [
              mockDefinition({
                response: { status: 200, body: { users: [] } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "happy-path",
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ users: [] });

      server.close();
    });
  });

  describe("Default scenario fallback", () => {
    it("should fall back to default scenario when no mock in active scenario", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        ["empty-scenario", mockScenario({ id: "empty-scenario" })],
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              mockDefinition({
                response: { status: 200, body: { source: "default" } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "empty-scenario",
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ source: "default" });

      server.close();
    });

    it("should fall back to default mock when active scenario mock match criteria fail", async () => {
      // This test reproduces the root cause:
      // - premiumUser scenario has mock with match: { headers: { 'x-user-tier': 'premium' } }
      // - Request comes with 'x-user-tier': 'standard' (doesn't match)
      // - Should fall back to default mock (not passthrough)
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              mockDefinition({
                method: "GET",
                url: "https://api.example.com/users",
                response: {
                  status: 200,
                  body: { source: "default", users: [] },
                },
              }),
            ],
          }),
        ],
        [
          "premiumUser",
          mockScenario({
            id: "premiumUser",
            mocks: [
              mockDefinition({
                method: "GET",
                url: "https://api.example.com/users",
                match: { headers: { "x-user-tier": "premium" } },
                response: {
                  status: 200,
                  body: { source: "premium", users: ["premium-user"] },
                },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "premiumUser",
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      // Request with 'standard' tier (doesn't match premium criteria)
      const response = await fetch("https://api.example.com/users", {
        headers: { "x-user-tier": "standard" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ source: "default", users: [] });

      server.close();
    });

    it("should use default scenario when no active scenario is set", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              mockDefinition({
                response: { status: 200, body: { source: "default" } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ source: "default" });

      server.close();
    });
  });

  describe("Passthrough and strict mode", () => {
    it("should passthrough when no mock found and strictMode is false", async () => {
      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      // Passthrough will attempt real network request which will fail for non-existent domain
      // This is expected behavior - passthrough means "let the real request happen"
      await expect(fetch("https://api.example.com/users")).rejects.toThrow();

      server.close();
    });

    it("should return error when no mock found and strictMode is true", async () => {
      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: true,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");

      expect(response.status).toBe(501);

      server.close();
    });
  });

  describe("Request context extraction (body, headers, query)", () => {
    it("should match mock based on request body content", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "premium-user",
          mockScenario({
            id: "premium-user",
            mocks: [
              mockDefinition({
                method: "POST",
                url: "https://api.example.com/items",
                match: { body: { tier: "premium" } },
                response: { status: 200, body: { price: 100 } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "premium-user",
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "premium", quantity: 5 }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ price: 100 });

      server.close();
    });

    it("should match mock based on request headers", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "auth-scenario",
          mockScenario({
            id: "auth-scenario",
            mocks: [
              mockDefinition({
                method: "GET",
                url: "https://api.example.com/protected",
                match: { headers: { authorization: "Bearer secret-token" } },
                response: { status: 200, body: { access: "granted" } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "auth-scenario",
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/protected", {
        headers: { authorization: "Bearer secret-token" },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ access: "granted" });

      server.close();
    });

    it("should handle non-JSON request body gracefully", async () => {
      // When request body cannot be parsed as JSON, handler should still match mocks
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "upload-scenario",
          mockScenario({
            id: "upload-scenario",
            mocks: [
              mockDefinition({
                method: "POST",
                url: "https://api.example.com/upload",
                response: { status: 200, body: { uploaded: true } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "upload-scenario",
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      // Send plain text body (not JSON)
      const response = await fetch("https://api.example.com/upload", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "plain text content",
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ uploaded: true });

      server.close();
    });

    it("should match mocks based on query parameters", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "search-scenario",
          mockScenario({
            id: "search-scenario",
            mocks: [
              mockDefinition({
                method: "GET",
                url: "https://api.example.com/search",
                match: { query: { term: "test", sort: "asc" } },
                response: {
                  status: 200,
                  body: { results: ["result1", "result2"] },
                },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "search-scenario",
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      // Request with query parameters
      const response = await fetch(
        "https://api.example.com/search?term=test&sort=asc",
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ results: ["result1", "result2"] });

      server.close();
    });

    it("should not match default scenario mocks with different HTTP method", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              // Mock with wrong method (GET when we'll send POST)
              mockDefinition({
                method: "GET",
                url: "https://api.example.com/users",
                response: { status: 200, body: { wrong: "method" } },
              }),
            ],
          }),
        ],
        [
          "post-scenario",
          mockScenario({
            id: "post-scenario",
            mocks: [
              // Correct mock with POST method
              mockDefinition({
                method: "POST",
                url: "https://api.example.com/users",
                response: { status: 201, body: { created: true } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "post-scenario",
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      // POST request should skip the default GET mock and use the active scenario POST mock
      const response = await fetch("https://api.example.com/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({ created: true });

      server.close();
    });

    it("should fall back to default scenario when active scenario does not exist", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              mockDefinition({
                method: "GET",
                url: "https://api.example.com/users",
                response: { status: 200, body: { source: "default" } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "non-existent-scenario", // Active scenario doesn't exist
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId); // Will return undefined for 'non-existent-scenario'

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      // Should fall back to default scenario since active scenario doesn't exist
      const response = await fetch("https://api.example.com/users");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ source: "default" });

      server.close();
    });

    it("should not match active scenario mocks with different URL", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              // Default mock for /users endpoint
              mockDefinition({
                method: "GET",
                url: "https://api.example.com/users",
                response: { status: 200, body: { source: "default" } },
              }),
            ],
          }),
        ],
        [
          "products-scenario",
          mockScenario({
            id: "products-scenario",
            mocks: [
              // Active scenario only has mock for /products (not /users)
              mockDefinition({
                method: "GET",
                url: "https://api.example.com/products",
                response: { status: 200, body: { products: [] } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "test-123";
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: "products-scenario",
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      // GET /users should skip active scenario mock (wrong URL) and use default mock
      const response = await fetch("https://api.example.com/users");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ source: "default" });

      server.close();
    });
  });

  describe("Error behaviors", () => {
    it("should return 500 with error details when onNoMockFound is 'throw' and no mock matches", async () => {
      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "throw",
        onSequenceExhausted: "throw",
        onMissingTestId: "throw",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: true, // strictMode should be ignored when errorBehaviors is 'throw'
        responseSelector,
        errorBehaviors,
      });

      const server = setupServer(handler);
      server.listen();

      // When error behavior is 'throw', the handler throws a ScenaristError
      // MSW catches this and returns a 500 response
      // This is different from strictMode=true which returns 501
      const response = await fetch("https://api.example.com/users");

      // Verify it's a 500 (MSW's error response) not 501 (our strictMode response)
      expect(response.status).toBe(500);

      server.close();
    });

    it("should return 501 when errorBehaviors is not set and strictMode is true", async () => {
      // This verifies that when errorBehaviors is not provided, existing behavior works
      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: true,
        responseSelector,
        // No errorBehaviors - should use default behavior (501 for strictMode)
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");

      expect(response.status).toBe(501);

      server.close();
    });

    it("should return 501 when onNoMockFound is 'ignore' and strictMode is true", async () => {
      // 'ignore' behavior should silently continue to strictMode logic
      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "ignore",
        onSequenceExhausted: "throw",
        onMissingTestId: "throw",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: true,
        responseSelector,
        errorBehaviors,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");

      // 'ignore' should let strictMode handle it → 501 response
      expect(response.status).toBe(501);

      server.close();
    });

    it("should passthrough when onNoMockFound is 'ignore' and strictMode is false", async () => {
      // 'ignore' behavior with strictMode=false should passthrough
      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "ignore",
        onSequenceExhausted: "throw",
        onMissingTestId: "throw",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
        errorBehaviors,
      });

      const server = setupServer(handler);
      server.listen();

      // 'ignore' + strictMode=false should passthrough (network error for non-existent domain)
      await expect(fetch("https://api.example.com/users")).rejects.toThrow();

      server.close();
    });

    it("should catch handler errors and return 500 with error details", async () => {
      // Simulate an unexpected error inside the handler by providing a responseSelector
      // that throws an unexpected error
      const mockLogger: Logger = {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        isEnabled: () => true,
      };

      const brokenResponseSelector = {
        selectResponse: () => {
          throw new Error("Unexpected internal error");
        },
      };

      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector: brokenResponseSelector as unknown as ReturnType<
          typeof createResponseSelector
        >,
        logger: mockLogger,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");

      // Handler should catch the error and return 500
      expect(response.status).toBe(500);

      // Error should be logged via Logger
      expect(mockLogger.error).toHaveBeenCalledWith(
        "request",
        expect.stringContaining("Handler error"),
        expect.objectContaining({
          testId: "test-123",
          requestMethod: "GET",
        }),
        expect.objectContaining({
          errorName: "Error",
        }),
      );

      server.close();
    });

    it("should return 500 even when no logger is provided", async () => {
      // Verify graceful degradation works even without a logger
      const brokenResponseSelector = {
        selectResponse: () => {
          throw new Error("Unexpected internal error");
        },
      };

      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector: brokenResponseSelector as unknown as ReturnType<
          typeof createResponseSelector
        >,
        // No logger provided
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");

      // Handler should still catch the error and return 500
      expect(response.status).toBe(500);

      // Verify the response body contains error details
      const body = await response.json();
      expect(body).toEqual({
        error: "Internal mock server error",
        message: "Unexpected internal error",
        code: "HANDLER_ERROR",
      });

      server.close();
    });

    it("should continue silently when onNoMockFound is 'warn' but no logger is provided", async () => {
      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "warn",
        onSequenceExhausted: "throw",
        onMissingTestId: "throw",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: true,
        responseSelector,
        errorBehaviors,
        // No logger provided - warn should silently continue
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");

      // Should continue to strictMode logic and return 501 (no crash, no warning logged)
      expect(response.status).toBe(501);

      server.close();
    });

    it("should log warning and continue to strictMode when onNoMockFound is 'warn' with logger", async () => {
      const mockLogger: Logger = {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        isEnabled: () => true,
      };

      const getTestId = () => "test-123";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "warn",
        onSequenceExhausted: "throw",
        onMissingTestId: "throw",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: true,
        responseSelector,
        errorBehaviors,
        logger: mockLogger,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");

      expect(response.status).toBe(501);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "matching",
        expect.stringContaining("No mock matched"),
        expect.objectContaining({
          testId: "test-123",
          scenarioId: "default",
          requestUrl: expect.stringContaining("api.example.com"),
          requestMethod: "GET",
        }),
      );

      server.close();
    });

    it("should use onSequenceExhausted behavior when sequence is exhausted", async () => {
      // Use unique test ID to avoid state pollution from other tests
      const testId = `sequence-exhaust-warn-${Date.now()}`;

      // Create fresh responseSelector with sequenceTracker to track sequence positions
      const sequenceTracker = createInMemorySequenceTracker();
      const isolatedResponseSelector = createResponseSelector({
        sequenceTracker,
      });

      const mockLogger: Logger = {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        isEnabled: () => true,
      };

      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              {
                method: "GET",
                url: "https://api.example.com/status",
                // sequence is top-level, not nested inside response
                sequence: {
                  responses: [{ status: 202, body: { state: "processing" } }],
                  repeat: "none",
                },
              },
            ],
          }),
        ],
      ]);

      const getTestId = () => testId;
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      // onNoMockFound is 'throw' but onSequenceExhausted is 'warn'
      // When sequence exhausts, it should use onSequenceExhausted behavior (warn), not onNoMockFound (throw)
      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "throw",
        onSequenceExhausted: "warn",
        onMissingTestId: "throw",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: true,
        responseSelector: isolatedResponseSelector,
        errorBehaviors,
        logger: mockLogger,
      });

      const server = setupServer(handler);
      server.listen();

      // First request exhausts the sequence
      const response1 = await fetch("https://api.example.com/status");
      expect(response1.status).toBe(202);

      // Second request should trigger SEQUENCE_EXHAUSTED
      // With onSequenceExhausted: 'warn', it should warn and continue to strictMode (501)
      // NOT throw (which would result in 500)
      const response2 = await fetch("https://api.example.com/status");

      // Should be 501 (strictMode), not 500 (thrown error)
      expect(response2.status).toBe(501);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "matching",
        expect.stringContaining("exhausted"),
        expect.objectContaining({
          testId,
          scenarioId: "default",
        }),
      );

      server.close();
    });

    it("should throw when onSequenceExhausted is 'throw' and sequence is exhausted", async () => {
      // Use unique test ID to avoid state pollution from other tests
      const testId = `sequence-exhaust-throw-${Date.now()}`;

      // Create fresh responseSelector with sequenceTracker to track sequence positions
      const sequenceTracker = createInMemorySequenceTracker();
      const isolatedResponseSelector = createResponseSelector({
        sequenceTracker,
      });

      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              {
                method: "GET",
                url: "https://api.example.com/status",
                // sequence is top-level, not nested inside response
                sequence: {
                  responses: [{ status: 202, body: { state: "processing" } }],
                  repeat: "none",
                },
              },
            ],
          }),
        ],
      ]);

      const getTestId = () => testId;
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "warn", // Set to warn so we can distinguish from SEQUENCE_EXHAUSTED throw
        onSequenceExhausted: "throw",
        onMissingTestId: "throw",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: true,
        responseSelector: isolatedResponseSelector,
        errorBehaviors,
      });

      const server = setupServer(handler);
      server.listen();

      // Exhaust the sequence
      await fetch("https://api.example.com/status");

      // Second request should throw SEQUENCE_EXHAUSTED → 500
      const response2 = await fetch("https://api.example.com/status");

      expect(response2.status).toBe(500);
      const body = await response2.json();
      expect(body.code).toBe("SEQUENCE_EXHAUSTED");

      server.close();
    });
  });

  describe("Missing test ID handling", () => {
    it("should return 500 with helpful error when test ID is missing and onMissingTestId is 'throw'", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              mockDefinition({
                response: { status: 200, body: { source: "default" } },
              }),
            ],
          }),
        ],
      ]);

      // getTestId returns empty string (missing test ID)
      const getTestId = () => "";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "throw",
        onSequenceExhausted: "throw",
        onMissingTestId: "throw",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
        errorBehaviors,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");
      const body = await response.json();

      // Should return 500 with error details about missing test ID
      expect(response.status).toBe(500);
      expect(body.code).toBe("MISSING_TEST_ID");
      expect(body.message).toContain("test ID");

      server.close();
    });

    it("should log warning and use default scenario when test ID is missing and onMissingTestId is 'warn'", async () => {
      const mockLogger: Logger = {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        isEnabled: () => true,
      };

      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              mockDefinition({
                response: { status: 200, body: { source: "default" } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "throw",
        onSequenceExhausted: "throw",
        onMissingTestId: "warn",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
        errorBehaviors,
        logger: mockLogger,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");
      const body = await response.json();

      // Should warn and continue with default scenario
      expect(response.status).toBe(200);
      expect(body).toEqual({ source: "default" });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "request",
        expect.stringContaining("Missing test ID"),
        expect.objectContaining({
          requestUrl: expect.stringContaining("api.example.com"),
          requestMethod: "GET",
        }),
      );

      server.close();
    });

    it("should silently use default scenario when test ID is missing and onMissingTestId is 'ignore'", async () => {
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              mockDefinition({
                response: { status: 200, body: { source: "default" } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const errorBehaviors: ErrorBehaviors = {
        onNoMockFound: "throw",
        onSequenceExhausted: "throw",
        onMissingTestId: "ignore",
      };

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
        errorBehaviors,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");
      const body = await response.json();

      // Should silently continue with default scenario
      expect(response.status).toBe(200);
      expect(body).toEqual({ source: "default" });

      server.close();
    });

    it("should continue normally when errorBehaviors is not configured and test ID is missing", async () => {
      // Default behavior: when errorBehaviors not set, missing test ID is tolerated
      const scenarios = new Map<string, ScenaristScenario>([
        [
          "default",
          mockScenario({
            id: "default",
            mocks: [
              mockDefinition({
                response: { status: 200, body: { source: "default" } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => "";
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
        // No errorBehaviors - missing test ID should be tolerated
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch("https://api.example.com/users");
      const body = await response.json();

      // Should continue normally with default scenario
      expect(response.status).toBe(200);
      expect(body).toEqual({ source: "default" });

      server.close();
    });
  });

  /**
   * Scenario Switching Priority Tests (Issue #335)
   *
   * These tests document the expected behavior for mock selection
   * when switching between scenarios. The key principle:
   *
   * 1. If no scenario is set → use default
   * 2. If scenario is set AND has a matching mock → use active (overrides default)
   * 3. If scenario is set AND no match → fall back to default
   *
   * "Match" means: URL+method matches AND (no match criteria OR criteria satisfied)
   */
  describe("Scenario switching priority (Issue #335)", () => {
    type MockType = "none" | "simple" | "sequence" | "conditional";

    type TestScenario = {
      readonly name: string;
      readonly activeScenarioId: string | undefined;
      readonly activeMockType: MockType;
      readonly defaultMockType: MockType;
      readonly requestMatchesCriteria: boolean;
      readonly expectedStatus: number;
      readonly expectedSource: string;
    };

    const testCases: readonly TestScenario[] = [
      {
        name: "No scenario set, default has fallback → use default",
        activeScenarioId: undefined,
        activeMockType: "none",
        defaultMockType: "simple",
        requestMatchesCriteria: true,
        expectedStatus: 200,
        expectedSource: "default",
      },
      {
        name: "Empty scenario (no mocks), default has fallback → use default",
        activeScenarioId: "empty",
        activeMockType: "none",
        defaultMockType: "simple",
        requestMatchesCriteria: true,
        expectedStatus: 200,
        expectedSource: "default",
      },
      {
        name: "Active has simple, default has simple → use active",
        activeScenarioId: "active",
        activeMockType: "simple",
        defaultMockType: "simple",
        requestMatchesCriteria: true,
        expectedStatus: 500,
        expectedSource: "active",
      },
      {
        name: "Active has simple, default has sequence → use active (BUG FIX #335)",
        activeScenarioId: "active",
        activeMockType: "simple",
        defaultMockType: "sequence",
        requestMatchesCriteria: true,
        expectedStatus: 500,
        expectedSource: "active",
      },
      {
        name: "Active has sequence, default has simple → use active",
        activeScenarioId: "active",
        activeMockType: "sequence",
        defaultMockType: "simple",
        requestMatchesCriteria: true,
        expectedStatus: 500,
        expectedSource: "active",
      },
      {
        name: "Active has conditional (matches), default has fallback → use active",
        activeScenarioId: "active",
        activeMockType: "conditional",
        defaultMockType: "simple",
        requestMatchesCriteria: true,
        expectedStatus: 500,
        expectedSource: "active",
      },
      {
        name: "Active has conditional (no match), default has fallback → use default",
        activeScenarioId: "active",
        activeMockType: "conditional",
        defaultMockType: "simple",
        requestMatchesCriteria: false,
        expectedStatus: 200,
        expectedSource: "default",
      },
      {
        name: "Active has fallback, no default mock → use active",
        activeScenarioId: "active",
        activeMockType: "simple",
        defaultMockType: "none",
        requestMatchesCriteria: true,
        expectedStatus: 500,
        expectedSource: "active",
      },
      {
        name: "Active has mock for different URL, default has fallback → use default",
        activeScenarioId: "different-url",
        activeMockType: "simple", // This mock is for /products, not /users
        defaultMockType: "simple",
        requestMatchesCriteria: true,
        expectedStatus: 200,
        expectedSource: "default",
      },
    ];

    const createMock = (
      type: MockType,
      source: string,
      url: string = "https://api.example.com/users",
    ): ScenaristScenario["mocks"] => {
      switch (type) {
        case "none":
          return [];
        case "simple":
          return [
            {
              method: "GET",
              url,
              response: {
                status: source === "active" ? 500 : 200,
                body: { source },
              },
            },
          ];
        case "sequence":
          return [
            {
              method: "GET",
              url,
              sequence: {
                responses: [
                  {
                    status: source === "active" ? 500 : 200,
                    body: { source, step: 1 },
                  },
                  {
                    status: source === "active" ? 500 : 200,
                    body: { source, step: 2 },
                  },
                ],
                repeat: "last",
              },
            },
          ];
        case "conditional":
          return [
            {
              method: "GET",
              url,
              match: { headers: { "x-test-match": "yes" } },
              response: {
                status: source === "active" ? 500 : 200,
                body: { source },
              },
            },
          ];
      }
    };

    it.each(testCases)(
      "$name",
      async ({
        activeScenarioId,
        activeMockType,
        defaultMockType,
        requestMatchesCriteria,
        expectedStatus,
        expectedSource,
      }) => {
        // Use unique test ID to avoid state pollution
        const testId = `priority-test-${Date.now()}-${Math.random()}`;

        // Create scenarios based on test case
        const scenarios = new Map<string, ScenaristScenario>();

        // Default scenario
        if (defaultMockType !== "none") {
          scenarios.set(
            "default",
            mockScenario({
              id: "default",
              mocks: createMock(defaultMockType, "default"),
            }),
          );
        }

        // Active scenario (if specified)
        if (activeScenarioId === "empty") {
          scenarios.set("empty", mockScenario({ id: "empty", mocks: [] }));
        } else if (activeScenarioId === "different-url") {
          scenarios.set(
            "different-url",
            mockScenario({
              id: "different-url",
              mocks: createMock(
                "simple",
                "active",
                "https://api.example.com/products",
              ),
            }),
          );
        } else if (activeScenarioId === "active") {
          scenarios.set(
            "active",
            mockScenario({
              id: "active",
              mocks: createMock(activeMockType, "active"),
            }),
          );
        }

        const getTestId = () => testId;
        const getActiveScenario = () =>
          activeScenarioId ? { scenarioId: activeScenarioId } : undefined;
        const getScenarioDefinition = (scenarioId: string) =>
          scenarios.get(scenarioId);

        // Create fresh sequence tracker for each test
        const sequenceTracker = createInMemorySequenceTracker();
        const testResponseSelector = createResponseSelector({
          sequenceTracker,
        });

        const handler = createDynamicHandler({
          getTestId,
          getActiveScenario,
          getScenarioDefinition,
          strictMode: false,
          responseSelector: testResponseSelector,
        });

        const server = setupServer(handler);
        server.listen();

        try {
          // Build request headers based on whether criteria should match
          const headers: Record<string, string> = {};
          if (requestMatchesCriteria) {
            headers["x-test-match"] = "yes";
          }

          const response = await fetch("https://api.example.com/users", {
            headers,
          });
          const data = await response.json();

          expect(response.status).toBe(expectedStatus);
          expect(data.source).toBe(expectedSource);
        } finally {
          server.close();
        }
      },
    );
  });
});
