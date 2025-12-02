import { describe, expect, it } from "vitest";
import type {
  ScenaristMock,
  ScenaristMockWithParams,
  HttpRequestContext,
} from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
import { createInMemoryStateManager } from "../src/adapters/in-memory-state-manager.js";
import { createInMemorySequenceTracker } from "../src/adapters/in-memory-sequence-tracker.js";

/**
 * Helper to wrap mocks in ScenaristMockWithParams format.
 * The ResponseSelector expects mocks with extracted path params, but these tests don't use path params, so we wrap with empty params.
 */
const wrapMocks = (
  mocks: ReadonlyArray<ScenaristMock>,
): ReadonlyArray<ScenaristMockWithParams> => {
  return mocks.map((mock) => ({ mock, params: {} }));
};

describe("ResponseSelector - State Capture & Templates", () => {
  describe("ResponseSelector - State Capture (Phase 3)", () => {
    it("should capture value from request body", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { userId: "user-123" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          captureState: { userId: "body.userId" },
          response: { status: 200, body: { success: true } },
        },
      ];

      selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(stateManager.get("test-1", "userId")).toBe("user-123");
    });

    it("should capture value from request headers", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        headers: { "x-session-id": "session-456" },
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          captureState: { sessionId: "headers.x-session-id" },
          response: { status: 200, body: { success: true } },
        },
      ];

      selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(stateManager.get("test-1", "sessionId")).toBe("session-456");
    });

    it("should capture value from query params", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        headers: {},
        query: { page: "2" },
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          captureState: { currentPage: "query.page" },
          response: { status: 200, body: { success: true } },
        },
      ];

      selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(stateManager.get("test-1", "currentPage")).toBe("2");
    });

    it("should handle array append syntax", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/cart/add",
          captureState: { "items[]": "body.item" },
          response: { status: 200, body: { added: true } },
        },
      ];

      // First request
      const context1: HttpRequestContext = {
        method: "POST",
        url: "/api/cart/add",
        body: { item: "Widget" },
        headers: {},
        query: {},
      };
      selector.selectResponse(
        "test-1",
        "scenario-1",
        context1,
        wrapMocks(mocks),
      );

      // Second request
      const context2: HttpRequestContext = {
        method: "POST",
        url: "/api/cart/add",
        body: { item: "Gadget" },
        headers: {},
        query: {},
      };
      selector.selectResponse(
        "test-1",
        "scenario-1",
        context2,
        wrapMocks(mocks),
      );

      expect(stateManager.get("test-1", "items")).toEqual(["Widget", "Gadget"]);
    });

    it("should capture multiple values from single request", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { userId: "user-123", action: "login" },
        headers: { "x-session-id": "session-456" },
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          captureState: {
            userId: "body.userId",
            action: "body.action",
            sessionId: "headers.x-session-id",
          },
          response: { status: 200, body: { success: true } },
        },
      ];

      selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(stateManager.get("test-1", "userId")).toBe("user-123");
      expect(stateManager.get("test-1", "action")).toBe("login");
      expect(stateManager.get("test-1", "sessionId")).toBe("session-456");
    });

    it("should isolate captured state per test ID", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          captureState: { count: "body.value" },
          response: { status: 200, body: { success: true } },
        },
      ];

      const context1: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { value: 5 },
        headers: {},
        query: {},
      };
      selector.selectResponse(
        "test-1",
        "scenario-1",
        context1,
        wrapMocks(mocks),
      );

      const context2: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { value: 10 },
        headers: {},
        query: {},
      };
      selector.selectResponse(
        "test-2",
        "scenario-1",
        context2,
        wrapMocks(mocks),
      );

      expect(stateManager.get("test-1", "count")).toBe(5);
      expect(stateManager.get("test-2", "count")).toBe(10);
    });

    it("should not capture when path returns undefined", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { foo: "bar" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          captureState: { missing: "body.nonexistent" },
          response: { status: 200, body: { success: true } },
        },
      ];

      selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(stateManager.get("test-1", "missing")).toBeUndefined();
    });

    it("should work with match criteria and capture together", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { tier: "premium", userId: "user-123" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          match: { body: { tier: "premium" } },
          captureState: { userId: "body.userId" },
          response: { status: 200, body: { price: 100 } },
        },
        {
          method: "POST",
          url: "/api/test",
          response: { status: 200, body: { price: 50 } },
        },
      ];

      selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(stateManager.get("test-1", "userId")).toBe("user-123");
    });
  });

  describe("ResponseSelector - Template Injection (Phase 3)", () => {
    it("should inject state into response body string templates", () => {
      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "userId", "user-456");
      stateManager.set("test-1", "itemCount", 3);

      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          response: {
            status: 200,
            body: {
              message: "User {{state.userId}} has {{state.itemCount}} items",
            },
          },
        },
      ];

      const result = selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          message: "User user-456 has 3 items",
        });
      }
    });

    it("should inject nested state paths", () => {
      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "user", {
        profile: {
          name: "Alice",
          email: "alice@example.com",
        },
      });

      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/profile",
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/profile",
          response: {
            status: 200,
            body: {
              greeting: "Hello, {{state.user.profile.name}}!",
              contact: "{{state.user.profile.email}}",
            },
          },
        },
      ];

      const result = selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          greeting: "Hello, Alice!",
          contact: "alice@example.com",
        });
      }
    });

    it("should inject array length", () => {
      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "cartItems", ["apple", "banana", "orange"]);

      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/cart",
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/cart",
          response: {
            status: 200,
            body: {
              message: "You have {{state.cartItems.length}} items in your cart",
            },
          },
        },
      ];

      const result = selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          message: "You have 3 items in your cart",
        });
      }
    });

    it("should leave templates unchanged when state key is missing", () => {
      const stateManager = createInMemoryStateManager();

      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: {
            status: 200,
            body: {
              message: "User {{state.userId}} not found",
            },
          },
        },
      ];

      const result = selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          message: "User {{state.userId}} not found",
        });
      }
    });

    it("should capture and inject in same request", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/echo",
        body: { userName: "Bob", message: "Hello" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/echo",
          captureState: { userName: "body.userName" },
          response: {
            status: 200,
            body: {
              echo: "Received from {{state.userName}}",
            },
          },
        },
      ];

      const result = selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          echo: "Received from Bob",
        });
      }
    });

    it("should work without state manager (no template replacement)", () => {
      const selector = createResponseSelector(); // No state manager

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: {
            status: 200,
            body: {
              message: "User {{state.userId}} here",
            },
          },
        },
      ];

      const result = selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Without state manager, templates remain unchanged
        expect(result.data.body).toEqual({
          message: "User {{state.userId}} here",
        });
      }
    });

    it("should inject templates in sequence responses", () => {
      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "jobId", "job-789");

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/job/status",
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/job/status",
          sequence: {
            responses: [
              {
                status: 200,
                body: { status: "pending", id: "{{state.jobId}}" },
              },
              {
                status: 200,
                body: { status: "complete", id: "{{state.jobId}}" },
              },
            ],
            repeat: "last",
          },
        },
      ];

      // First call - pending
      const result1 = selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({
          status: "pending",
          id: "job-789",
        });
      }

      // Second call - complete
      const result2 = selector.selectResponse(
        "test-1",
        "scenario-1",
        context,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({
          status: "complete",
          id: "job-789",
        });
      }
    });
  });
});
