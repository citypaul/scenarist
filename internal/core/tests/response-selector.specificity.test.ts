import { describe, expect, it } from "vitest";
import type { ScenaristMock, HttpRequestContext } from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
import { createInMemorySequenceTracker } from "../src/adapters/in-memory-sequence-tracker.js";
import { wrapMocks } from "./helpers/wrap-mocks.js";

describe("ResponseSelector - Specificity", () => {
  describe("First Matching Mock Wins (Precedence)", () => {
    it("should return first mock when multiple mocks match", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "premium", quantity: 5 },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100, source: "first" } },
        },
        {
          method: "POST",
          url: "/api/items",
          match: { body: { quantity: 5 } },
          response: { status: 200, body: { price: 50, source: "second" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ price: 100, source: "first" });
      }
    });

    it("should return more specific mock regardless of position (specificity wins)", () => {
      // With specificity-based matching, the most specific mock wins
      // regardless of its position in the mocks array.
      //
      // Specificity scoring:
      // - Each body field = +1
      // - Each header = +1
      // - Each query param = +1

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/charge",
        body: { itemType: "premium", quantity: 5 },
        headers: { "x-user-tier": "gold" },
        query: {},
      };

      // Less specific mock appears FIRST
      const mocksWithLessSpecificFirst: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/charge",
          match: { body: { itemType: "premium" } }, // Specificity: 1
          response: { status: 200, body: { discount: 10 } },
        },
        {
          method: "POST",
          url: "/api/charge",
          match: {
            body: { itemType: "premium", quantity: 5 }, // Specificity: 3 (2 body + 1 header)
            headers: { "x-user-tier": "gold" },
          },
          response: { status: 200, body: { discount: 20 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocksWithLessSpecificFirst),
      );

      // The more specific mock (discount: 20) wins even though it appears second
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ discount: 20 });
      }
    });

    it("should use order as tiebreaker when specificity is equal", () => {
      // When multiple mocks have the same specificity, first one wins (tiebreaker).

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemType: "premium", quantity: 5 },
        headers: {},
        query: {},
      };

      // Both mocks have specificity of 1 (equal)
      const mocksWithEqualSpecificity: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemType: "premium" } }, // Specificity: 1
          response: { status: 200, body: { price: 100, source: "first" } },
        },
        {
          method: "POST",
          url: "/api/items",
          match: { body: { quantity: 5 } }, // Specificity: 1
          response: { status: 200, body: { price: 50, source: "second" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocksWithEqualSpecificity),
      );

      // First mock wins as tiebreaker (both have specificity of 1)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ price: 100, source: "first" });
      }
    });
  });

  describe("Fallback to Mock Without Match Criteria", () => {
    it("should use fallback mock when no match criteria specified", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "standard" },
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
        {
          method: "POST",
          url: "/api/items",
          // No match criteria = fallback
          response: { status: 200, body: { price: 50 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ price: 50 });
      }
    });

    it("should return error when no mocks match and no fallback exists", () => {
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

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("No mock matched");
      }
    });

    it("should return last fallback when multiple fallback mocks exist", () => {
      // When multiple mocks have no match criteria (all are fallbacks),
      // the last fallback wins (all have specificity 0)

      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "standard" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          // First fallback (no match criteria)
          response: {
            status: 200,
            body: { price: 50, source: "first-fallback" },
          },
        },
        {
          method: "POST",
          url: "/api/items",
          // Second fallback (no match criteria)
          response: {
            status: 200,
            body: { price: 60, source: "second-fallback" },
          },
        },
        {
          method: "POST",
          url: "/api/items",
          // Third fallback (no match criteria)
          response: {
            status: 200,
            body: { price: 70, source: "third-fallback" },
          },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Last fallback wins when all have equal specificity (0)
        expect(result.data.body).toEqual({
          price: 70,
          source: "third-fallback",
        });
      }
    });

    it("should return last sequence fallback when multiple sequence fallbacks exist", () => {
      // When multiple mocks have sequences but no match criteria (all are sequence fallbacks),
      // the last sequence fallback wins (all have specificity 1)

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
          // First sequence fallback (no match criteria, specificity 1)
          sequence: {
            responses: [
              {
                status: 200,
                body: { status: "pending", source: "first-sequence" },
              },
              {
                status: 200,
                body: { status: "complete", source: "first-sequence" },
              },
            ],
            repeat: "last",
          },
        },
        {
          method: "GET",
          url: "/api/status",
          // Second sequence fallback (no match criteria, specificity 1)
          sequence: {
            responses: [
              {
                status: 200,
                body: { status: "processing", source: "second-sequence" },
              },
              {
                status: 200,
                body: { status: "done", source: "second-sequence" },
              },
            ],
            repeat: "last",
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Last sequence fallback wins when all have equal specificity (1)
        expect(result.data.body).toEqual({
          status: "processing",
          source: "second-sequence",
        });
      }
    });

    it("should prefer specific match over fallback mock", () => {
      // When a request matches both a specific mock and a fallback,
      // the specific mock should win due to higher specificity

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
          // Fallback appears first
          response: { status: 200, body: { price: 50, source: "fallback" } },
        },
        {
          method: "POST",
          url: "/api/items",
          // Specific match appears second
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100, source: "specific" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Specific match wins even though fallback appears first
        expect(result.data.body).toEqual({ price: 100, source: "specific" });
      }
    });
  });
  describe("Last Fallback Wins for Simple Responses (Automatic Default Fallback)", () => {
    it("should prefer active scenario fallback over default fallback", () => {
      // This test documents the "last fallback wins" behavior that enables
      // automatic default fallback. When default scenario and active scenario
      // both provide fallback mocks (specificity = 0), the last one wins.
      //
      // Real-world usage:
      // - Default scenario provides baseline fallback
      // - Active scenario provides override fallback
      // - Active override wins without needing match criteria

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        // Default scenario fallback (collected first in automatic default fallback)
        {
          method: "GET",
          url: "/api/data",
          response: { status: 200, body: { tier: "standard" } },
        },
        // Active scenario fallback (collected second in automatic default fallback)
        {
          method: "GET",
          url: "/api/data",
          response: { status: 200, body: { tier: "premium" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "active-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Last fallback wins - active scenario overrides default
        expect(result.data.body).toEqual({ tier: "premium" });
      }
    });

    it("should still use highest specificity for mocks with match criteria", () => {
      // This test verifies that "last wins" ONLY applies to fallback mocks.
      // Mocks with match criteria use specificity-based selection (highest wins),
      // not position-based selection.
      //
      // Specificity priority ranges:
      // - Match criteria: 101+ (100 base + field count)
      // - Sequence fallbacks: 1
      // - Simple fallbacks: 0

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: { tier: "standard" },
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        // First mock with match criteria (specificity: 101 = 100 base + 1 header)
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { tier: "standard" } },
          response: {
            status: 200,
            body: { tier: "standard", source: "first" },
          },
        },
        // Second mock with match criteria (specificity: 101 = 100 base + 1 header)
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { tier: "premium" } },
          response: {
            status: 200,
            body: { tier: "premium", source: "second" },
          },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "active-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // First matching mock wins for specificity > 0
        // (Both have equal specificity, first match wins as tiebreaker)
        expect(result.data.body).toEqual({ tier: "standard", source: "first" });
      }
    });
  });

  describe("Combined Match Criteria", () => {
    it("should match when body AND headers both match", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "premium" },
        headers: { "x-user-tier": "gold" },
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          match: {
            body: { itemId: "premium" },
            headers: { "x-user-tier": "gold" },
          },
          response: { status: 200, body: { price: 75 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ price: 75 });
      }
    });

    it("should not match when body matches but headers don't", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "premium" },
        headers: { "x-user-tier": "silver" },
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          match: {
            body: { itemId: "premium" },
            headers: { "x-user-tier": "gold" },
          },
          response: { status: 200, body: { price: 75 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(false);
    });
  });
});
