import { describe, expect, it } from "vitest";
import type { ScenaristMock, HttpRequestContext } from "../src/types/index.js";
import type { Logger, LogCategory, LogContext } from "../src/ports/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
import { wrapMocks } from "./helpers/wrap-mocks.js";

/**
 * Test logger that captures all log calls for assertions.
 */
type LogCall = {
  level: "error" | "warn" | "info" | "debug" | "trace";
  category: LogCategory;
  message: string;
  context: LogContext;
  data?: Record<string, unknown>;
};

const createTestLogger = () => {
  const calls: LogCall[] = [];

  const logger: Logger = {
    error: (category, message, context, data) =>
      calls.push({ level: "error", category, message, context, data }),
    warn: (category, message, context, data) =>
      calls.push({ level: "warn", category, message, context, data }),
    info: (category, message, context, data) =>
      calls.push({ level: "info", category, message, context, data }),
    debug: (category, message, context, data) =>
      calls.push({ level: "debug", category, message, context, data }),
    trace: (category, message, context, data) =>
      calls.push({ level: "trace", category, message, context, data }),
    isEnabled: () => true,
  };

  return { logger, calls };
};

describe("ResponseSelector - Logging", () => {
  describe("mock_selected logging", () => {
    it("should log mock_selected at info level when a mock is selected", () => {
      const { logger, calls } = createTestLogger();

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector({ logger });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const mockSelectedLog = calls.find((c) => c.message === "mock_selected");
      expect(mockSelectedLog).toBeDefined();
      expect(mockSelectedLog?.level).toBe("info");
      expect(mockSelectedLog?.category).toBe("matching");
      expect(mockSelectedLog?.data?.mockIndex).toBe(0);
      expect(mockSelectedLog?.data?.specificity).toBeGreaterThan(0);
    });

    it("should include testId and scenarioId in log context", () => {
      const { logger, calls } = createTestLogger();

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/data",
          response: { status: 200, body: {} },
        },
      ];

      const selector = createResponseSelector({ logger });
      selector.selectResponse(
        "test-id-123",
        "scenario-456",
        context,
        wrapMocks(mocks),
      );

      const mockSelectedLog = calls.find((c) => c.message === "mock_selected");
      expect(mockSelectedLog?.context.testId).toBe("test-id-123");
      expect(mockSelectedLog?.context.scenarioId).toBe("scenario-456");
    });
  });

  describe("mock_no_match logging", () => {
    it("should log mock_no_match at warn level when no mock matches", () => {
      const { logger, calls } = createTestLogger();

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "unknown" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector({ logger });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const noMatchLog = calls.find((c) => c.message === "mock_no_match");
      expect(noMatchLog).toBeDefined();
      expect(noMatchLog?.level).toBe("warn");
      expect(noMatchLog?.category).toBe("matching");
      expect(noMatchLog?.data?.url).toBe("/api/items");
      expect(noMatchLog?.data?.candidateCount).toBe(0);
    });
  });

  describe("mock_match_evaluated logging (debug)", () => {
    it("should log mock_match_evaluated for each mock at debug level", () => {
      const { logger, calls } = createTestLogger();

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "standard" } },
          response: { status: 200, body: { price: 50 } },
        },
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector({ logger });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const evalLogs = calls.filter(
        (c) => c.message === "mock_match_evaluated",
      );
      expect(evalLogs.length).toBe(2);

      // First mock should not match
      expect(evalLogs[0]?.level).toBe("debug");
      expect(evalLogs[0]?.category).toBe("matching");
      expect(evalLogs[0]?.data?.mockIndex).toBe(0);
      expect(evalLogs[0]?.data?.matched).toBe(false);

      // Second mock should match
      expect(evalLogs[1]?.data?.mockIndex).toBe(1);
      expect(evalLogs[1]?.data?.matched).toBe(true);
    });
  });

  describe("mock_candidates_found logging (debug)", () => {
    it("should log mock_candidates_found at debug level before evaluation", () => {
      const { logger, calls } = createTestLogger();

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: {},
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          response: { status: 200, body: {} },
        },
        {
          method: "POST",
          url: "/api/items",
          response: { status: 201, body: {} },
        },
      ];

      const selector = createResponseSelector({ logger });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const candidatesLog = calls.find(
        (c) => c.message === "mock_candidates_found",
      );
      expect(candidatesLog).toBeDefined();
      expect(candidatesLog?.level).toBe("debug");
      expect(candidatesLog?.category).toBe("matching");
      expect(candidatesLog?.data?.count).toBe(2);
    });
  });
});
