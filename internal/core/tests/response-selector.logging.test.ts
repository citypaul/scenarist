import { describe, expect, it } from "vitest";
import type { ScenaristMock, HttpRequestContext } from "../src/types/index.js";
import type { Logger, LogCategory, LogContext } from "../src/ports/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
import { createInMemoryStateManager } from "../src/adapters/in-memory-state-manager.js";
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

  describe("state_set logging (debug)", () => {
    it("should log state_set when afterResponse.setState is applied", () => {
      const { logger, calls } = createTestLogger();
      const stateManager = createInMemoryStateManager();

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/action",
        body: {},
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/action",
          response: { status: 200, body: { success: true } },
          afterResponse: {
            setState: { step: "completed", count: 1 },
          },
        },
      ];

      const selector = createResponseSelector({ logger, stateManager });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const stateSetLog = calls.find((c) => c.message === "state_set");
      expect(stateSetLog).toBeDefined();
      expect(stateSetLog?.level).toBe("debug");
      expect(stateSetLog?.category).toBe("state");
      expect(stateSetLog?.data?.setState).toEqual({
        step: "completed",
        count: 1,
      });
      expect(stateSetLog?.context.testId).toBe("test-1");
      expect(stateSetLog?.context.scenarioId).toBe("default");
    });

    it("should not log state_set when stateManager is not provided", () => {
      const { logger, calls } = createTestLogger();

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/action",
        body: {},
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/action",
          response: { status: 200, body: { success: true } },
          afterResponse: {
            setState: { step: "completed" },
          },
        },
      ];

      // No stateManager provided
      const selector = createResponseSelector({ logger });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const stateSetLog = calls.find((c) => c.message === "state_set");
      expect(stateSetLog).toBeUndefined();
    });
  });

  describe("state_response_resolved logging (debug)", () => {
    it("should log state_response_resolved with default when no condition matches", () => {
      const { logger, calls } = createTestLogger();
      const stateManager = createInMemoryStateManager();

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          stateResponse: {
            default: { status: 200, body: { state: "initial" } },
            conditions: [
              {
                when: { step: "reviewed" },
                then: { status: 200, body: { state: "reviewed" } },
              },
            ],
          },
        },
      ];

      const selector = createResponseSelector({ logger, stateManager });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const stateResolvedLog = calls.find(
        (c) => c.message === "state_response_resolved",
      );
      expect(stateResolvedLog).toBeDefined();
      expect(stateResolvedLog?.level).toBe("debug");
      expect(stateResolvedLog?.category).toBe("state");
      expect(stateResolvedLog?.data?.result).toBe("default");
      expect(stateResolvedLog?.data?.currentState).toEqual({});
      expect(stateResolvedLog?.data?.conditionsCount).toBe(1);
      expect(stateResolvedLog?.data?.matchedWhen).toBeNull();
    });

    it("should log state_response_resolved with condition when state matches", () => {
      const { logger, calls } = createTestLogger();
      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          stateResponse: {
            default: { status: 200, body: { state: "initial" } },
            conditions: [
              {
                when: { step: "reviewed" },
                then: { status: 200, body: { state: "reviewed" } },
              },
            ],
          },
        },
      ];

      const selector = createResponseSelector({ logger, stateManager });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const stateResolvedLog = calls.find(
        (c) => c.message === "state_response_resolved",
      );
      expect(stateResolvedLog).toBeDefined();
      expect(stateResolvedLog?.level).toBe("debug");
      expect(stateResolvedLog?.category).toBe("state");
      expect(stateResolvedLog?.data?.result).toBe("condition");
      expect(stateResolvedLog?.data?.currentState).toEqual({
        step: "reviewed",
      });
      expect(stateResolvedLog?.data?.matchedWhen).toEqual({ step: "reviewed" });
    });

    it("should identify correct matchedWhen among multiple conditions", () => {
      const { logger, calls } = createTestLogger();
      const stateManager = createInMemoryStateManager();
      // Set state to match the SECOND condition, not the first
      stateManager.set("test-1", "phase", "approved");

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          stateResponse: {
            default: { status: 200, body: { phase: "pending" } },
            conditions: [
              {
                when: { phase: "submitted" },
                then: { status: 200, body: { phase: "submitted" } },
              },
              {
                when: { phase: "approved" },
                then: { status: 200, body: { phase: "approved" } },
              },
              {
                when: { phase: "rejected" },
                then: { status: 200, body: { phase: "rejected" } },
              },
            ],
          },
        },
      ];

      const selector = createResponseSelector({ logger, stateManager });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const stateResolvedLog = calls.find(
        (c) => c.message === "state_response_resolved",
      );
      expect(stateResolvedLog).toBeDefined();
      expect(stateResolvedLog?.data?.result).toBe("condition");
      expect(stateResolvedLog?.data?.conditionsCount).toBe(3);
      // Verify the correct condition is identified (second one, not first or third)
      expect(stateResolvedLog?.data?.matchedWhen).toEqual({
        phase: "approved",
      });
    });

    it("should log state_response_resolved with no_state_manager reason when stateManager is not provided", () => {
      const { logger, calls } = createTestLogger();

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          stateResponse: {
            default: { status: 200, body: { state: "initial" } },
            conditions: [
              {
                when: { step: "reviewed" },
                then: { status: 200, body: { state: "reviewed" } },
              },
            ],
          },
        },
      ];

      // No stateManager provided
      const selector = createResponseSelector({ logger });
      selector.selectResponse("test-1", "default", context, wrapMocks(mocks));

      const stateResolvedLog = calls.find(
        (c) => c.message === "state_response_resolved",
      );
      expect(stateResolvedLog).toBeDefined();
      expect(stateResolvedLog?.data?.result).toBe("default");
      expect(stateResolvedLog?.data?.reason).toBe("no_state_manager");
    });
  });
});
