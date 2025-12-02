import { describe, expect, it } from "vitest";
import type {
  ScenaristMock,
  ScenaristMockWithParams,
  HttpRequestContext,
} from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
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

describe("ResponseSelector - Sequences", () => {
  describe("Response Sequences (Phase 2)", () => {
    it("should return responses from sequence in order", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/job/123",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/job/:id",
          sequence: {
            responses: [
              { status: 200, body: { status: "pending" } },
              { status: 200, body: { status: "processing" } },
              { status: 200, body: { status: "complete" } },
            ],
            repeat: "last",
          },
        },
      ];

      const selector = createResponseSelector({
        sequenceTracker: createInMemorySequenceTracker(),
      });

      // First call
      const result1 = selector.selectResponse(
        "test-1",
        "job-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ status: "pending" });
      }

      // Second call
      const result2 = selector.selectResponse(
        "test-1",
        "job-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({ status: "processing" });
      }

      // Third call
      const result3 = selector.selectResponse(
        "test-1",
        "job-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.body).toEqual({ status: "complete" });
      }
    });

    it("should default to 'last' repeat mode when not specified", () => {
      const selector = createResponseSelector({
        sequenceTracker: createInMemorySequenceTracker(),
      });

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          sequence: {
            responses: [
              { status: 200, body: { attempt: 1 } },
              { status: 200, body: { attempt: 2 } },
            ],
            // No repeat mode specified - should default to 'last'
          },
        },
      ];

      const context = {
        method: "GET" as const,
        url: "/api/status",
        body: null,
        headers: {},
        query: {},
      };

      // First two calls go through sequence
      const result1 = selector.selectResponse(
        "test-default",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect((result1.data.body as { attempt: number }).attempt).toBe(1);
      }

      const result2 = selector.selectResponse(
        "test-default",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect((result2.data.body as { attempt: number }).attempt).toBe(2);
      }

      // Third call should repeat last response (default behavior)
      const result3 = selector.selectResponse(
        "test-default",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect((result3.data.body as { attempt: number }).attempt).toBe(2);
      }
    });

    it("should repeat last response infinitely when repeat mode is 'last'", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/poll",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/poll",
          sequence: {
            responses: [
              { status: 200, body: { value: 1 } },
              { status: 200, body: { value: 2 } },
            ],
            repeat: "last",
          },
        },
      ];

      const selector = createResponseSelector({
        sequenceTracker: createInMemorySequenceTracker(),
      });

      // Exhaust the sequence
      selector.selectResponse(
        "test-2",
        "poll-scenario",
        context,
        wrapMocks(mocks),
      );
      selector.selectResponse(
        "test-2",
        "poll-scenario",
        context,
        wrapMocks(mocks),
      );

      // Calls beyond the sequence should repeat the last response
      const result3 = selector.selectResponse(
        "test-2",
        "poll-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.body).toEqual({ value: 2 });
      }

      const result4 = selector.selectResponse(
        "test-2",
        "poll-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result4.success).toBe(true);
      if (result4.success) {
        expect(result4.data.body).toEqual({ value: 2 });
      }
    });

    it("should cycle back to first response when repeat mode is 'cycle'", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/toggle",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/toggle",
          sequence: {
            responses: [
              { status: 200, body: { state: "on" } },
              { status: 200, body: { state: "off" } },
            ],
            repeat: "cycle",
          },
        },
      ];

      const selector = createResponseSelector({
        sequenceTracker: createInMemorySequenceTracker(),
      });

      // First cycle
      const result1 = selector.selectResponse(
        "test-3",
        "toggle-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ state: "on" });
      }

      const result2 = selector.selectResponse(
        "test-3",
        "toggle-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({ state: "off" });
      }

      // Should cycle back to first
      const result3 = selector.selectResponse(
        "test-3",
        "toggle-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.body).toEqual({ state: "on" });
      }

      const result4 = selector.selectResponse(
        "test-3",
        "toggle-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result4.success).toBe(true);
      if (result4.success) {
        expect(result4.data.body).toEqual({ state: "off" });
      }
    });

    it("should fallback to next mock after sequence exhausted (repeat: 'none')", () => {
      // When sequence is exhausted (repeat: 'none'), it should be skipped
      // and the next mock (fallback) should be selected

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/limited",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        // Fallback mock - comes first but has lower priority than sequence (next)
        {
          method: "GET",
          url: "/api/limited",
          response: { status: 410, body: { error: "Sequence exhausted" } },
        },
        // Sequence mock with repeat: 'none' - last fallback wins
        {
          method: "GET",
          url: "/api/limited",
          sequence: {
            responses: [
              { status: 200, body: { attempt: 1 } },
              { status: 200, body: { attempt: 2 } },
            ],
            repeat: "none",
          },
        },
      ];

      const selector = createResponseSelector({
        sequenceTracker: createInMemorySequenceTracker(),
      });

      // First two calls go through sequence (sequence is last = wins as fallback)
      const result1 = selector.selectResponse(
        "test-4",
        "limited-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ attempt: 1 });
      }

      const result2 = selector.selectResponse(
        "test-4",
        "limited-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({ attempt: 2 });
      }

      // Third call: sequence exhausted and skipped, fallback mock selected
      const result3 = selector.selectResponse(
        "test-4",
        "limited-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.status).toBe(410);
        expect(result3.data.body).toEqual({ error: "Sequence exhausted" });
      }
    });

    it("should maintain independent sequence positions per test ID", () => {
      const selector = createResponseSelector({
        sequenceTracker: createInMemorySequenceTracker(),
      });

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/status",
          sequence: {
            responses: [
              { status: 200, body: { step: 1 } },
              { status: 200, body: { step: 2 } },
              { status: 200, body: { step: 3 } },
            ],
            repeat: "last",
          },
        },
      ];

      const context = {
        method: "GET" as const,
        url: "/api/status",
        body: null,
        headers: {},
        query: {},
      };

      // Test ID "test-a" makes first call
      const result1 = selector.selectResponse(
        "test-a",
        "status-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect((result1.data.body as { step: number }).step).toBe(1);
      }

      // Test ID "test-b" makes first call (should also get step 1)
      const result2 = selector.selectResponse(
        "test-b",
        "status-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect((result2.data.body as { step: number }).step).toBe(1);
      }

      // Test ID "test-a" makes second call (should get step 2)
      const result3 = selector.selectResponse(
        "test-a",
        "status-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect((result3.data.body as { step: number }).step).toBe(2);
      }

      // Test ID "test-b" makes second call (should also get step 2, not step 3)
      const result4 = selector.selectResponse(
        "test-b",
        "status-scenario",
        context,
        wrapMocks(mocks),
      );
      expect(result4.success).toBe(true);
      if (result4.success) {
        expect((result4.data.body as { step: number }).step).toBe(2);
      }
    });

    it("should work correctly with match criteria and specificity", () => {
      const selector = createResponseSelector({
        sequenceTracker: createInMemorySequenceTracker(),
      });

      const mocks: ReadonlyArray<ScenaristMock> = [
        // Generic sequence (no match criteria)
        {
          method: "POST",
          url: "/api/process",
          sequence: {
            responses: [
              { status: 200, body: { type: "generic", attempt: 1 } },
              { status: 200, body: { type: "generic", attempt: 2 } },
            ],
            repeat: "last",
          },
        },
        // Premium sequence (matches tier: premium)
        {
          method: "POST",
          url: "/api/process",
          match: {
            body: { tier: "premium" },
          },
          sequence: {
            responses: [
              { status: 200, body: { type: "premium", attempt: 1 } },
              { status: 200, body: { type: "premium", attempt: 2 } },
            ],
            repeat: "last",
          },
        },
      ];

      const genericContext = {
        method: "POST" as const,
        url: "/api/process",
        body: { tier: "standard" },
        headers: {},
        query: {},
      };

      const premiumContext = {
        method: "POST" as const,
        url: "/api/process",
        body: { tier: "premium" },
        headers: {},
        query: {},
      };

      // Generic request should use generic sequence
      const result1 = selector.selectResponse(
        "test-match",
        "process-scenario",
        genericContext,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        const body = result1.data.body as { type: string; attempt: number };
        expect(body.type).toBe("generic");
        expect(body.attempt).toBe(1);
      }

      // Premium request should use premium sequence (more specific)
      const result2 = selector.selectResponse(
        "test-match",
        "process-scenario",
        premiumContext,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        const body = result2.data.body as { type: string; attempt: number };
        expect(body.type).toBe("premium");
        expect(body.attempt).toBe(1);
      }

      // Second generic request should advance generic sequence
      const result3 = selector.selectResponse(
        "test-match",
        "process-scenario",
        genericContext,
        wrapMocks(mocks),
      );
      expect(result3.success).toBe(true);
      if (result3.success) {
        const body = result3.data.body as { type: string; attempt: number };
        expect(body.type).toBe("generic");
        expect(body.attempt).toBe(2);
      }

      // Second premium request should advance premium sequence
      const result4 = selector.selectResponse(
        "test-match",
        "process-scenario",
        premiumContext,
        wrapMocks(mocks),
      );
      expect(result4.success).toBe(true);
      if (result4.success) {
        const body = result4.data.body as { type: string; attempt: number };
        expect(body.type).toBe("premium");
        expect(body.attempt).toBe(2);
      }
    });

    it("should NOT advance sequence when request doesn't match criteria", () => {
      const selector = createResponseSelector({
        sequenceTracker: createInMemorySequenceTracker(),
      });

      const mocks: ReadonlyArray<ScenaristMock> = [
        // Sequence with match criteria (premium only)
        {
          method: "POST",
          url: "/api/action",
          match: {
            body: { tier: "premium" },
          },
          sequence: {
            responses: [
              { status: 200, body: { step: 1, type: "premium" } },
              { status: 200, body: { step: 2, type: "premium" } },
              { status: 200, body: { step: 3, type: "premium" } },
            ],
            repeat: "last",
          },
        },
        // Fallback mock (no match criteria)
        {
          method: "POST",
          url: "/api/action",
          response: { status: 200, body: { step: 0, type: "fallback" } },
        },
      ];

      const premiumContext = {
        method: "POST" as const,
        url: "/api/action",
        body: { tier: "premium" },
        headers: {},
        query: {},
      };

      const standardContext = {
        method: "POST" as const,
        url: "/api/action",
        body: { tier: "standard" },
        headers: {},
        query: {},
      };

      // Request 1: Premium request → matches → returns step 1, advances to position 1
      const result1 = selector.selectResponse(
        "test-no-advance",
        "action-scenario",
        premiumContext,
        wrapMocks(mocks),
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        const body = result1.data.body as { step: number; type: string };
        expect(body.step).toBe(1);
        expect(body.type).toBe("premium");
      }

      // Request 2: Standard request → doesn't match → uses fallback
      // CRITICAL: This should NOT advance the premium sequence
      const result2 = selector.selectResponse(
        "test-no-advance",
        "action-scenario",
        standardContext,
        wrapMocks(mocks),
      );
      expect(result2.success).toBe(true);
      if (result2.success) {
        const body = result2.data.body as { step: number; type: string };
        expect(body.step).toBe(0);
        expect(body.type).toBe("fallback");
      }

      // Request 3: Premium request again → matches → should return step 2
      // This proves the non-matching request didn't advance the sequence
      const result3 = selector.selectResponse(
        "test-no-advance",
        "action-scenario",
        premiumContext,
        wrapMocks(mocks),
      );
      expect(result3.success).toBe(true);
      if (result3.success) {
        const body = result3.data.body as { step: number; type: string };
        expect(body.step).toBe(2); // Position 1, not position 2
        expect(body.type).toBe("premium");
      }

      // Request 4: Another standard request → still uses fallback
      // Sequence still at position 2 (not advanced by this non-matching request)
      const result4 = selector.selectResponse(
        "test-no-advance",
        "action-scenario",
        standardContext,
        wrapMocks(mocks),
      );
      expect(result4.success).toBe(true);
      if (result4.success) {
        const body = result4.data.body as { step: number; type: string };
        expect(body.step).toBe(0);
        expect(body.type).toBe("fallback");
      }

      // Request 5: Premium request → should return step 3
      // Proves previous non-matching request didn't advance
      const result5 = selector.selectResponse(
        "test-no-advance",
        "action-scenario",
        premiumContext,
        wrapMocks(mocks),
      );
      expect(result5.success).toBe(true);
      if (result5.success) {
        const body = result5.data.body as { step: number; type: string };
        expect(body.step).toBe(3); // Position 2
        expect(body.type).toBe("premium");
      }
    });
  });

  describe("Error handling", () => {
    const selector = createResponseSelector();
    const context = {
      method: "GET" as const,
      url: "/api/test",
      body: null,
      headers: {},
      query: {},
    };

    it("should return error for mock with neither response nor sequence", () => {
      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          // No response or sequence field - invalid mock
        } as ScenaristMock,
      ];

      const result = selector.selectResponse(
        "test-invalid",
        "scenario-invalid",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          "Mock has neither response nor sequence field",
        );
      }
    });

    it("should return error for sequence with empty responses array", () => {
      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [], // Empty array
            repeat: "last",
          },
        },
      ];

      const result = selector.selectResponse(
        "test-empty",
        "scenario-empty",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          "Mock has neither response nor sequence field",
        );
      }
    });
  });
});
