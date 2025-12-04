import { describe, expect, it } from "vitest";
import type { ScenaristMock, HttpRequestContext } from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
import { createInMemoryStateManager } from "../src/adapters/in-memory-state-manager.js";
import { createInMemorySequenceTracker } from "../src/adapters/in-memory-sequence-tracker.js";
import { wrapMocks } from "./helpers/wrap-mocks.js";

describe("ResponseSelector - State Response", () => {
  describe("State-Based Mock Selection (match.state)", () => {
    it("should select mock when match.state matches current test state", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          match: { state: { step: "reviewed" } },
          response: { status: 200, body: { status: "in-review" } },
        },
        {
          method: "GET",
          url: "/api/status",
          response: { status: 200, body: { status: "initial" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ status: "in-review" });
      }
    });

    it("should not match when state key is missing", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      // No state set - "step" key is missing

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          match: { state: { step: "reviewed" } },
          response: { status: 200, body: { status: "in-review" } },
        },
        {
          method: "GET",
          url: "/api/status",
          response: { status: 200, body: { status: "initial" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ status: "initial" }); // Fallback
      }
    });

    it("should not match when state value differs", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "pending"); // Different value

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          match: { state: { step: "reviewed" } },
          response: { status: 200, body: { status: "in-review" } },
        },
        {
          method: "GET",
          url: "/api/status",
          response: { status: 200, body: { status: "initial" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ status: "initial" }); // Fallback
      }
    });

    it("should match when state has extra keys beyond criteria (partial match)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");
      stateManager.set("test-1", "userId", "user-123"); // Extra key
      stateManager.set("test-1", "timestamp", Date.now()); // Another extra key

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          match: { state: { step: "reviewed" } }, // Only requires "step"
          response: { status: 200, body: { status: "in-review" } },
        },
        {
          method: "GET",
          url: "/api/status",
          response: { status: 200, body: { status: "initial" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ status: "in-review" });
      }
    });

    it("should match multiple state keys (all must match)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");
      stateManager.set("test-1", "approved", true);

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          match: { state: { step: "reviewed", approved: true } },
          response: { status: 200, body: { status: "approved" } },
        },
        {
          method: "GET",
          url: "/api/status",
          match: { state: { step: "reviewed" } },
          response: { status: 200, body: { status: "in-review" } },
        },
        {
          method: "GET",
          url: "/api/status",
          response: { status: 200, body: { status: "initial" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // More specific mock (2 state keys) should win
        expect(result.data.body).toEqual({ status: "approved" });
      }
    });

    it("should include state keys in specificity calculation", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");
      stateManager.set("test-1", "approved", false);

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          match: { state: { step: "reviewed", approved: false } }, // 2 state keys
          response: { status: 200, body: { status: "pending-approval" } },
        },
        {
          method: "GET",
          url: "/api/status",
          match: { state: { step: "reviewed" } }, // 1 state key
          response: { status: 200, body: { status: "in-review" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Mock with more state keys (higher specificity) wins
        expect(result.data.body).toEqual({ status: "pending-approval" });
      }
    });

    it("should combine state matching with body matching", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/action",
        body: { action: "approve" },
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "pending_review");

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/action",
          match: {
            state: { step: "pending_review" },
            body: { action: "approve" },
          },
          response: { status: 200, body: { result: "approved" } },
        },
        {
          method: "POST",
          url: "/api/action",
          match: { body: { action: "approve" } },
          response: { status: 200, body: { result: "no-state-match" } },
        },
        {
          method: "POST",
          url: "/api/action",
          response: { status: 200, body: { result: "fallback" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Mock with state + body (higher specificity) wins
        expect(result.data.body).toEqual({ result: "approved" });
      }
    });

    it("should combine state matching with header matching", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: { "x-tier": "premium" },
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "authenticated", true);

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/data",
          match: {
            state: { authenticated: true },
            headers: { "x-tier": "premium" },
          },
          response: { status: 200, body: { data: "premium-authenticated" } },
        },
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "x-tier": "premium" } },
          response: { status: 200, body: { data: "premium-only" } },
        },
        {
          method: "GET",
          url: "/api/data",
          response: { status: 200, body: { data: "default" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ data: "premium-authenticated" });
      }
    });

    it("should isolate state matching by test ID", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");
      stateManager.set("test-2", "step", "initial");

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          match: { state: { step: "reviewed" } },
          response: { status: 200, body: { status: "in-review" } },
        },
        {
          method: "GET",
          url: "/api/status",
          response: { status: 200, body: { status: "initial" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });

      // test-1 has step: reviewed - should match
      const result1 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      // test-2 has step: initial - should not match, use fallback
      const result2 = selector.selectResponse(
        "test-2",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.body).toEqual({ status: "in-review" });
        expect(result2.data.body).toEqual({ status: "initial" }); // Fallback
      }
    });

    it("should handle state matching without stateManager (always fails)", () => {
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
          match: { state: { step: "reviewed" } },
          response: { status: 200, body: { status: "in-review" } },
        },
        {
          method: "GET",
          url: "/api/status",
          response: { status: 200, body: { status: "initial" } },
        },
      ];

      // No stateManager provided
      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Without stateManager, state matching always fails -> fallback
        expect(result.data.body).toEqual({ status: "initial" });
      }
    });

    it("should support boolean state values", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/feature",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "featureEnabled", true);

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/feature",
          match: { state: { featureEnabled: true } },
          response: { status: 200, body: { feature: "enabled" } },
        },
        {
          method: "GET",
          url: "/api/feature",
          match: { state: { featureEnabled: false } },
          response: { status: 200, body: { feature: "disabled" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ feature: "enabled" });
      }
    });

    it("should support numeric state values", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/cart",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "itemCount", 5);

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/cart",
          match: { state: { itemCount: 5 } },
          response: { status: 200, body: { items: 5 } },
        },
        {
          method: "GET",
          url: "/api/cart",
          response: { status: 200, body: { items: 0 } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ items: 5 });
      }
    });

    it("should support null state values", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/user",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "currentUser", null);

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/user",
          match: { state: { currentUser: null } },
          response: { status: 200, body: { user: "anonymous" } },
        },
        {
          method: "GET",
          url: "/api/user",
          response: { status: 200, body: { user: "unknown" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ user: "anonymous" });
      }
    });
  });

  describe("State Response Resolution (stateResponse)", () => {
    it("should return default response when no conditions match", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      // No state set

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

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ state: "initial" });
      }
    });

    it("should return matching condition response when state matches", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");

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

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ state: "reviewed" });
      }
    });

    it("should select most specific condition when multiple match", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");
      stateManager.set("test-1", "approved", true);

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
              {
                when: { step: "reviewed", approved: true },
                then: { status: 200, body: { state: "approved" } },
              },
            ],
          },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // More specific condition (2 keys) wins
        expect(result.data.body).toEqual({ state: "approved" });
      }
    });

    it("should apply template replacement to stateResponse", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");
      stateManager.set("test-1", "userId", "user-123");

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          stateResponse: {
            default: { status: 200, body: { state: "initial" } },
            conditions: [
              {
                when: { step: "reviewed" },
                then: {
                  status: 200,
                  body: {
                    state: "reviewed",
                    reviewedBy: "{{state.userId}}",
                  },
                },
              },
            ],
          },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          state: "reviewed",
          reviewedBy: "user-123",
        });
      }
    });

    it("should isolate stateResponse by test ID", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");
      stateManager.set("test-2", "step", "pending");

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

      const selector = createResponseSelector({ stateManager });

      const result1 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      const result2 = selector.selectResponse(
        "test-2",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.body).toEqual({ state: "reviewed" });
        expect(result2.data.body).toEqual({ state: "initial" }); // Default
      }
    });

    it("should return default when stateManager not provided", () => {
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
      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Without stateManager, always returns default
        expect(result.data.body).toEqual({ state: "initial" });
      }
    });

    it("should handle empty conditions array", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "step", "reviewed");

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          stateResponse: {
            default: { status: 200, body: { state: "default-only" } },
            conditions: [],
          },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ state: "default-only" });
      }
    });

    it("should work with match criteria and stateResponse together", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/action",
        body: { action: "approve" },
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "authorized", true);

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/action",
          match: { body: { action: "approve" } },
          stateResponse: {
            default: { status: 403, body: { error: "unauthorized" } },
            conditions: [
              {
                when: { authorized: true },
                then: { status: 200, body: { result: "approved" } },
              },
            ],
          },
        },
        {
          method: "POST",
          url: "/api/action",
          response: { status: 400, body: { error: "bad request" } },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ result: "approved" });
      }
    });
  });

  describe("After Response State Mutation (afterResponse.setState)", () => {
    it("should mutate state after response is returned", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/action",
        body: { action: "start" },
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/action",
          response: { status: 200, body: { success: true } },
          afterResponse: {
            setState: { step: "started", timestamp: 12345 },
          },
        },
      ];

      const selector = createResponseSelector({ stateManager });

      // Before: no state
      expect(stateManager.getAll("test-1")).toEqual({});

      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);

      // After: state should be mutated
      expect(stateManager.getAll("test-1")).toEqual({
        step: "started",
        timestamp: 12345,
      });
    });

    it("should merge setState with existing state", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/action",
        body: {},
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "existingKey", "existingValue");
      stateManager.set("test-1", "step", "initial");

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/action",
          response: { status: 200, body: { success: true } },
          afterResponse: {
            setState: { step: "updated", newKey: "newValue" },
          },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      // Should merge: overwrite step, keep existingKey, add newKey
      expect(stateManager.getAll("test-1")).toEqual({
        existingKey: "existingValue",
        step: "updated",
        newKey: "newValue",
      });
    });

    it("should isolate afterResponse state by test ID", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/action",
        body: {},
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();

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

      const selector = createResponseSelector({ stateManager });

      // test-1 triggers afterResponse
      selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      // test-1 should have state, test-2 should not
      expect(stateManager.getAll("test-1")).toEqual({ step: "completed" });
      expect(stateManager.getAll("test-2")).toEqual({});
    });

    it("should not apply afterResponse without stateManager", () => {
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

      // No stateManager provided - should still return response successfully
      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ success: true });
      }
    });

    it("should work with response and afterResponse", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/review",
        body: {},
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/review",
          response: { status: 200, body: { reviewed: true } },
          afterResponse: {
            setState: { reviewed: true },
          },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ reviewed: true });
      }
      expect(stateManager.getAll("test-1")).toEqual({ reviewed: true });
    });

    it("should work with stateResponse and afterResponse", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/approve",
        body: {},
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "authorized", true);

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/approve",
          stateResponse: {
            default: { status: 403, body: { error: "unauthorized" } },
            conditions: [
              {
                when: { authorized: true },
                then: { status: 200, body: { approved: true } },
              },
            ],
          },
          afterResponse: {
            setState: { step: "approved" },
          },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ approved: true });
      }
      expect(stateManager.getAll("test-1")).toEqual({
        authorized: true,
        step: "approved",
      });
    });

    it("should work with sequence and afterResponse", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/poll",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/poll",
          sequence: {
            responses: [
              { status: 200, body: { status: "pending" } },
              { status: 200, body: { status: "complete" } },
            ],
          },
          afterResponse: {
            setState: { polled: true },
          },
        },
      ];

      const selector = createResponseSelector({
        stateManager,
        sequenceTracker,
      });

      // First request
      const result1 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ status: "pending" });
      }
      expect(stateManager.getAll("test-1")).toEqual({ polled: true });

      // Second request
      const result2 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({ status: "complete" });
      }
    });

    it("should enable state machine patterns with afterResponse and match.state", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/workflow",
        body: {},
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();

      const mocks: ReadonlyArray<ScenaristMock> = [
        // Step 2: reviewed -> approved
        {
          method: "POST",
          url: "/api/workflow",
          match: { state: { step: "reviewed" } },
          response: { status: 200, body: { step: "approved" } },
          afterResponse: {
            setState: { step: "approved" },
          },
        },
        // Step 1: initial -> reviewed
        {
          method: "POST",
          url: "/api/workflow",
          match: { state: { step: "initial" } },
          response: { status: 200, body: { step: "reviewed" } },
          afterResponse: {
            setState: { step: "reviewed" },
          },
        },
        // Initial state (fallback)
        {
          method: "POST",
          url: "/api/workflow",
          response: { status: 200, body: { step: "initial" } },
          afterResponse: {
            setState: { step: "initial" },
          },
        },
      ];

      const selector = createResponseSelector({ stateManager });

      // First call: no state -> sets initial
      const result1 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ step: "initial" });
      }
      expect(stateManager.get("test-1", "step")).toBe("initial");

      // Second call: initial -> reviewed
      const result2 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({ step: "reviewed" });
      }
      expect(stateManager.get("test-1", "step")).toBe("reviewed");

      // Third call: reviewed -> approved
      const result3 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.body).toEqual({ step: "approved" });
      }
      expect(stateManager.get("test-1", "step")).toBe("approved");
    });
  });

  describe("Self-Modifying stateResponse Pattern (Issue #328)", () => {
    /**
     * Issue #328: State-Aware Mocking Not Evaluating Conditions
     *
     * This tests a single mock that BOTH reads state (stateResponse.conditions)
     * AND writes state (afterResponse.setState) on the same request.
     *
     * Expected behavior:
     * 1. First request: No state → returns default → afterResponse sets state
     * 2. Second request: State matches condition → returns conditional response
     */
    it("should evaluate conditions on second request after afterResponse.setState", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      // Single mock with BOTH stateResponse (read) and afterResponse.setState (write)
      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          stateResponse: {
            default: { status: 200, body: { value: "initial" } },
            conditions: [
              {
                when: { visited: true },
                then: { status: 200, body: { value: "visited" } },
              },
            ],
          },
          afterResponse: {
            setState: { visited: true },
          },
        },
      ];

      // First request: No state -> returns default, then sets visited=true
      const result1 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ value: "initial" });
      }
      // State should be set AFTER response selection
      expect(stateManager.get("test-1", "visited")).toBe(true);

      // Second request: State has visited=true -> should match condition
      const result2 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result2.success).toBe(true);
      if (result2.success) {
        // THIS IS THE KEY ASSERTION from Issue #328
        // The condition { when: { visited: true } } should match
        expect(result2.data.body).toEqual({ value: "visited" });
      }
    });

    it("should support multi-step state progression on same mock", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/workflow",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      // Mock that advances through steps: none -> step1 -> step2 -> step3
      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/workflow",
          stateResponse: {
            default: { status: 200, body: { step: "none" } },
            conditions: [
              {
                when: { step: "step1" },
                then: { status: 200, body: { step: "step1" } },
              },
              {
                when: { step: "step2" },
                then: { status: 200, body: { step: "step2" } },
              },
              {
                when: { step: "step3" },
                then: { status: 200, body: { step: "step3" } },
              },
            ],
          },
          afterResponse: {
            setState: { step: "step1" },
          },
        },
      ];

      // First request: no state -> "none", sets step="step1"
      const result1 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ step: "none" });
      }
      expect(stateManager.get("test-1", "step")).toBe("step1");

      // Second request: step="step1" matches condition
      const result2 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({ step: "step1" });
      }
      // afterResponse still sets step="step1" (overwrites same value)
    });

    it("should isolate self-modifying state by test ID", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          stateResponse: {
            default: { status: 200, body: { value: "initial" } },
            conditions: [
              {
                when: { visited: true },
                then: { status: 200, body: { value: "visited" } },
              },
            ],
          },
          afterResponse: {
            setState: { visited: true },
          },
        },
      ];

      // test-1: First request sets state
      selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      // test-1: Second request should see state
      const result1 = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      // test-2: First request should NOT see test-1's state
      const result2 = selector.selectResponse(
        "test-2",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.body).toEqual({ value: "visited" }); // test-1 sees state
        expect(result2.data.body).toEqual({ value: "initial" }); // test-2 fresh state
      }
    });
  });

  describe("Separate Mocks Pattern (Issue #328 - plum-bff reproduction)", () => {
    /**
     * This test reproduces the exact pattern from Acquisition.Web.Monorepo's plum-bff:
     * - Mock 1: POST /eligibility sets state via afterResponse.setState
     * - Mock 2: GET /applications uses stateResponse to read state and return conditional response
     *
     * This is different from the self-modifying pattern because the mocks are SEPARATE.
     * POST sets state, GET reads state.
     */
    it("should evaluate stateResponse conditions after separate mock sets state via afterResponse.setState", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      // Mock 1: POST /eligibility - sets phase via afterResponse.setState
      const eligibilityMock: ScenaristMock = {
        method: "POST",
        url: "/api/eligibility",
        response: {
          status: 200,
          body: { state: "quoteAccept", customerRef: "CUST12345" },
        },
        afterResponse: {
          setState: { phase: "quoteAccept" },
        },
      };

      // Mock 2: GET /applications - uses stateResponse to return based on phase
      const applicationsMock: ScenaristMock = {
        method: "GET",
        url: "/api/applications/:id",
        stateResponse: {
          default: { status: 200, body: { state: "appStarted" } },
          conditions: [
            {
              when: { phase: "quoteAccept" },
              then: { status: 200, body: { state: "quoteAccept" } },
            },
            {
              when: { phase: "sign" },
              then: { status: 200, body: { state: "sign" } },
            },
          ],
        },
      };

      // Step 1: GET /applications BEFORE eligibility - should return default
      const getContext1: HttpRequestContext = {
        method: "GET",
        url: "/api/applications/123",
        body: undefined,
        headers: {},
        query: {},
      };

      const result1 = selector.selectResponse(
        "test-1",
        "eligible-stateful",
        getContext1,
        wrapMocks([applicationsMock]),
      );

      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ state: "appStarted" });
      }

      // Step 2: POST /eligibility - sets state { phase: 'quoteAccept' }
      const postContext: HttpRequestContext = {
        method: "POST",
        url: "/api/eligibility",
        body: { applicationId: "123" },
        headers: {},
        query: {},
      };

      const postResult = selector.selectResponse(
        "test-1",
        "eligible-stateful",
        postContext,
        wrapMocks([eligibilityMock]),
      );

      expect(postResult.success).toBe(true);
      // Verify state was set
      expect(stateManager.get("test-1", "phase")).toBe("quoteAccept");

      // Step 3: GET /applications AFTER eligibility - should match condition
      const result2 = selector.selectResponse(
        "test-1",
        "eligible-stateful",
        getContext1,
        wrapMocks([applicationsMock]),
      );

      expect(result2.success).toBe(true);
      if (result2.success) {
        // THIS IS THE KEY ASSERTION - Issue #328 says this returns "appStarted" instead of "quoteAccept"
        expect(result2.data.body).toEqual({ state: "quoteAccept" });
      }
    });

    it("should transition through multiple states with separate POST mocks", () => {
      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });

      // GET /applications - uses stateResponse
      const applicationsMock: ScenaristMock = {
        method: "GET",
        url: "/api/applications/:id",
        stateResponse: {
          default: { status: 200, body: { state: "appStarted" } },
          conditions: [
            {
              when: { phase: "appComplete" },
              then: { status: 200, body: { state: "appComplete" } },
            },
            {
              when: { phase: "sign" },
              then: { status: 200, body: { state: "sign" } },
            },
            {
              when: { phase: "quoteAccept" },
              then: { status: 200, body: { state: "quoteAccept" } },
            },
          ],
        },
      };

      // POST /eligibility - transitions to quoteAccept
      const eligibilityMock: ScenaristMock = {
        method: "POST",
        url: "/api/eligibility",
        response: { status: 200, body: { success: true } },
        afterResponse: { setState: { phase: "quoteAccept" } },
      };

      // POST /decision - transitions to sign
      const decisionMock: ScenaristMock = {
        method: "POST",
        url: "/api/decision",
        response: { status: 200, body: { success: true } },
        afterResponse: { setState: { phase: "sign" } },
      };

      // POST /signature - transitions to appComplete
      const signatureMock: ScenaristMock = {
        method: "POST",
        url: "/api/signature",
        response: { status: 200, body: { success: true } },
        afterResponse: { setState: { phase: "appComplete" } },
      };

      const getContext: HttpRequestContext = {
        method: "GET",
        url: "/api/applications/123",
        body: undefined,
        headers: {},
        query: {},
      };

      // Initial state: appStarted
      const r1 = selector.selectResponse(
        "test-1",
        "s",
        getContext,
        wrapMocks([applicationsMock]),
      );
      expect(r1.success && r1.data.body).toEqual({ state: "appStarted" });

      // POST /eligibility
      selector.selectResponse(
        "test-1",
        "s",
        {
          method: "POST",
          url: "/api/eligibility",
          body: {},
          headers: {},
          query: {},
        },
        wrapMocks([eligibilityMock]),
      );
      expect(stateManager.get("test-1", "phase")).toBe("quoteAccept");

      // After eligibility: quoteAccept
      const r2 = selector.selectResponse(
        "test-1",
        "s",
        getContext,
        wrapMocks([applicationsMock]),
      );
      expect(r2.success && r2.data.body).toEqual({ state: "quoteAccept" });

      // POST /decision
      selector.selectResponse(
        "test-1",
        "s",
        {
          method: "POST",
          url: "/api/decision",
          body: {},
          headers: {},
          query: {},
        },
        wrapMocks([decisionMock]),
      );
      expect(stateManager.get("test-1", "phase")).toBe("sign");

      // After decision: sign
      const r3 = selector.selectResponse(
        "test-1",
        "s",
        getContext,
        wrapMocks([applicationsMock]),
      );
      expect(r3.success && r3.data.body).toEqual({ state: "sign" });

      // POST /signature
      selector.selectResponse(
        "test-1",
        "s",
        {
          method: "POST",
          url: "/api/signature",
          body: {},
          headers: {},
          query: {},
        },
        wrapMocks([signatureMock]),
      );
      expect(stateManager.get("test-1", "phase")).toBe("appComplete");

      // After signature: appComplete
      const r4 = selector.selectResponse(
        "test-1",
        "s",
        getContext,
        wrapMocks([applicationsMock]),
      );
      expect(r4.success && r4.data.body).toEqual({ state: "appComplete" });
    });
  });

  describe("Default Sequence + Active stateResponse Overlap (plum-bff exact reproduction)", () => {
    /**
     * This test reproduces the EXACT plum-bff pattern where:
     * 1. Default scenario has a sequence mock for GET /applications
     * 2. Active scenario has a stateResponse mock for the SAME URL
     * 3. BOTH mocks are in the mocks array (like getMocksFromScenarios does)
     *
     * Expected: stateResponse mock should win because it's added LAST
     * (active scenario mocks are added after default mocks)
     */
    it("should select stateResponse mock over sequence mock when both match same URL", () => {
      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        stateManager,
        sequenceTracker,
      });

      // Default scenario's mock: sequence for GET /applications
      const defaultSequenceMock: ScenaristMock = {
        method: "GET",
        url: "/api/applications/:id",
        sequence: {
          responses: [
            { status: 200, body: { state: "appStarted" } },
            { status: 200, body: { state: "appStarted" } },
            { status: 200, body: { state: "quoteAccept" } },
          ],
          repeat: "last",
        },
      };

      // Active scenario's mock: stateResponse for GET /applications
      const activeStateResponseMock: ScenaristMock = {
        method: "GET",
        url: "/api/applications/:id",
        stateResponse: {
          default: {
            status: 200,
            body: { state: "appStarted", source: "stateResponse" },
          },
          conditions: [
            {
              when: { phase: "quoteAccept" },
              then: {
                status: 200,
                body: { state: "quoteAccept", source: "stateResponse" },
              },
            },
          ],
        },
      };

      // POST mock to set state
      const eligibilityMock: ScenaristMock = {
        method: "POST",
        url: "/api/eligibility",
        response: { status: 200, body: { success: true } },
        afterResponse: { setState: { phase: "quoteAccept" } },
      };

      const getContext: HttpRequestContext = {
        method: "GET",
        url: "/api/applications/123",
        body: undefined,
        headers: {},
        query: {},
      };

      // CRITICAL: Simulate getMocksFromScenarios behavior
      // Default mocks FIRST, then active scenario mocks
      const combinedMocks = wrapMocks([
        defaultSequenceMock, // Index 0: from default scenario
        activeStateResponseMock, // Index 1: from active scenario (eligible-stateful)
      ]);

      // Step 1: GET /applications before state is set
      // The stateResponse mock (index 1) should be selected because it's last
      // and both have specificity 1 (SEQUENCE_FALLBACK)
      const result1 = selector.selectResponse(
        "test-1",
        "eligible-stateful",
        getContext,
        combinedMocks,
      );

      expect(result1.success).toBe(true);
      if (result1.success) {
        // Should be stateResponse's default, NOT sequence's first response
        expect(result1.data.body).toEqual({
          state: "appStarted",
          source: "stateResponse",
        });
      }

      // Step 2: POST /eligibility to set state
      selector.selectResponse(
        "test-1",
        "eligible-stateful",
        {
          method: "POST",
          url: "/api/eligibility",
          body: {},
          headers: {},
          query: {},
        },
        wrapMocks([eligibilityMock]),
      );
      expect(stateManager.get("test-1", "phase")).toBe("quoteAccept");

      // Step 3: GET /applications after state is set
      // The stateResponse mock should match the condition
      const result2 = selector.selectResponse(
        "test-1",
        "eligible-stateful",
        getContext,
        combinedMocks,
      );

      expect(result2.success).toBe(true);
      if (result2.success) {
        // Should be stateResponse's condition match, NOT sequence
        expect(result2.data.body).toEqual({
          state: "quoteAccept",
          source: "stateResponse",
        });
      }
    });

    it("should correctly handle specificity when both sequence and stateResponse mocks exist", () => {
      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        stateManager,
        sequenceTracker,
      });

      // Default scenario: simple response (specificity 0)
      const defaultSimpleMock: ScenaristMock = {
        method: "GET",
        url: "/api/status",
        response: { status: 200, body: { source: "default-simple" } },
      };

      // Active scenario: stateResponse (specificity 1)
      const activeStateResponseMock: ScenaristMock = {
        method: "GET",
        url: "/api/status",
        stateResponse: {
          default: { status: 200, body: { source: "active-stateResponse" } },
          conditions: [],
        },
      };

      const getContext: HttpRequestContext = {
        method: "GET",
        url: "/api/status",
        body: undefined,
        headers: {},
        query: {},
      };

      // stateResponse (specificity 1) should beat simple response (specificity 0)
      const combinedMocks = wrapMocks([
        defaultSimpleMock,
        activeStateResponseMock,
      ]);

      const result = selector.selectResponse(
        "test-1",
        "active-scenario",
        getContext,
        combinedMocks,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // stateResponse should win due to higher specificity
        expect(result.data.body).toEqual({ source: "active-stateResponse" });
      }
    });
  });
});
