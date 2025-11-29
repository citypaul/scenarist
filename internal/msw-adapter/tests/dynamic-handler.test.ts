import { describe, it, expect } from "vitest";
import { setupServer } from "msw/node";
import { createDynamicHandler } from "../src/handlers/dynamic-handler.js";
import type { ActiveScenario, ScenaristScenario } from "@scenarist/core";
import { createResponseSelector } from "@scenarist/core";
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

    it("should handle non-JSON request body", async () => {
      // This test ensures the catch block at line 39 is executed
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

    it("should extract query parameters from request", async () => {
      // This test ensures the forEach loop at line 56 is executed
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

    it("should skip default scenario mocks that do not match method", async () => {
      // This test ensures the false branch of line 94 is executed
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

    it("should handle active scenario definition not found", async () => {
      // This test ensures line 104 false branch is executed
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

    it("should skip active scenario mocks that do not match URL", async () => {
      // This test ensures the false branch of line 108 is executed
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
});
