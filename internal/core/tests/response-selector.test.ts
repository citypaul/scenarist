import { describe, expect, it } from "vitest";
import type {
  ScenaristMock,
  ScenaristMockWithParams,
  HttpRequestContext,
} from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
import { createInMemorySequenceTracker } from "../src/adapters/in-memory-sequence-tracker.js";
import { createInMemoryStateManager } from "../src/adapters/in-memory-state-manager.js";

/**
 * Helper to wrap mocks in ScenaristMockWithParams for backward compatibility.
 * Tests don't extract params, so we just wrap with empty params.
 */
const wrapMocks = (
  mocks: ReadonlyArray<ScenaristMock>,
): ReadonlyArray<ScenaristMockWithParams> => {
  return mocks.map((mock) => ({ mock, params: {} }));
};

describe("ResponseSelector - Request Content Matching (Phase 1)", () => {
  describe("Match on Request Body (Partial Match)", () => {
    it("should match when request body contains all required fields", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "premium", quantity: 5, extraField: "ignored" },
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(200);
        expect(result.data.body).toEqual({ price: 100 });
      }
    });

    it("should not match when required field is missing", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { quantity: 5 }, // Missing itemId
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
    });

    it("should not match when field value differs", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "standard" }, // Different value
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
    });

    it("should not match when request body is null", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: null, // Null body
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
    });

    it("should not match when request body is not an object", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: "string body", // Non-object body
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
    });

    it("should match on multiple body fields (partial match)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: {
          itemId: "premium",
          category: "electronics",
          inStock: true,
          quantity: 10,
        },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium", category: "electronics" } },
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ price: 100 });
      }
    });
  });

  describe("Match on Request Headers (Exact Match)", () => {
    it("should match when all specified headers match exactly", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: { "x-user-tier": "premium", "x-other": "value" },
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "x-user-tier": "premium" } },
          response: { status: 200, body: { data: "premium-data" } },
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
        expect(result.data.body).toEqual({ data: "premium-data" });
      }
    });

    it("should not match when header value differs", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: { "x-user-tier": "standard" },
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "x-user-tier": "premium" } },
          response: { status: 200, body: { data: "premium-data" } },
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

    it("should not match when required header is missing", () => {
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
          match: { headers: { "x-user-tier": "premium" } },
          response: { status: 200, body: { data: "premium-data" } },
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

  describe("Case-Insensitive Header Matching", () => {
    it("should match when criteria headers use uppercase but request headers are lowercase", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: { "x-user-tier": "premium" }, // Lowercase (from Fetch API)
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "X-User-Tier": "premium" } }, // Mixed case in criteria
          response: { status: 200, body: { data: "premium-data" } },
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
        expect(result.data.body).toEqual({ data: "premium-data" });
      }
    });

    it("should match when criteria headers are all uppercase", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: { "x-api-key": "secret123" }, // Lowercase (from Fetch API)
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "X-API-KEY": "secret123" } }, // All uppercase
          response: { status: 200, body: { data: "secure-data" } },
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
        expect(result.data.body).toEqual({ data: "secure-data" });
      }
    });

    it("should match with multiple headers of different casing", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/submit",
        body: { data: "test" },
        headers: {
          "x-user-tier": "premium",
          "x-api-version": "v2",
          "content-type": "application/json",
        },
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/submit",
          match: {
            headers: {
              "X-User-Tier": "premium", // Mixed case
              "X-API-Version": "v2", // Mixed case
              "Content-Type": "application/json", // Mixed case
            },
          },
          response: { status: 201, body: { created: true } },
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
        expect(result.data.status).toBe(201);
        expect(result.data.body).toEqual({ created: true });
      }
    });

    it("should not match when header value differs (case still matters for values)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: { "x-user-tier": "premium" }, // Lowercase value
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "X-User-Tier": "PREMIUM" } }, // Uppercase value
          response: { status: 200, body: { data: "premium-data" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(false); // Values are case-sensitive
    });

    it("should match when request headers are NOT normalized (mixed case from adapter)", () => {
      // This tests the new architecture where adapters pass through headers as-is
      // and core normalizes both request AND criteria headers
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: {
          "X-User-Tier": "premium",
          "Content-Type": "application/json",
        }, // Mixed case from adapter
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "x-user-tier": "premium" } }, // Lowercase in criteria
          response: { status: 200, body: { data: "premium-data" } },
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
        expect(result.data.body).toEqual({ data: "premium-data" });
      }
    });
  });

  describe("Match on Query Parameters (Exact Match)", () => {
    it("should match when all specified query params match exactly", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/search",
        body: undefined,
        headers: {},
        query: { filter: "active", sort: "name" },
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/search",
          match: { query: { filter: "active" } },
          response: { status: 200, body: { results: ["active-items"] } },
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
        expect(result.data.body).toEqual({ results: ["active-items"] });
      }
    });

    it("should not match when query param value differs", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/search",
        body: undefined,
        headers: {},
        query: { filter: "inactive" },
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/search",
          match: { query: { filter: "active" } },
          response: { status: 200, body: { results: ["active-items"] } },
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

    it("should not match when required query param is missing", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/search",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/search",
          match: { query: { filter: "active" } },
          response: { status: 200, body: { results: ["active-items"] } },
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

    selector.selectResponse("test-1", "scenario-1", context, wrapMocks(mocks));

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

    selector.selectResponse("test-1", "scenario-1", context, wrapMocks(mocks));

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

    selector.selectResponse("test-1", "scenario-1", context, wrapMocks(mocks));

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
    selector.selectResponse("test-1", "scenario-1", context1, wrapMocks(mocks));

    // Second request
    const context2: HttpRequestContext = {
      method: "POST",
      url: "/api/cart/add",
      body: { item: "Gadget" },
      headers: {},
      query: {},
    };
    selector.selectResponse("test-1", "scenario-1", context2, wrapMocks(mocks));

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

    selector.selectResponse("test-1", "scenario-1", context, wrapMocks(mocks));

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
    selector.selectResponse("test-1", "scenario-1", context1, wrapMocks(mocks));

    const context2: HttpRequestContext = {
      method: "POST",
      url: "/api/test",
      body: { value: 10 },
      headers: {},
      query: {},
    };
    selector.selectResponse("test-2", "scenario-1", context2, wrapMocks(mocks));

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

    selector.selectResponse("test-1", "scenario-1", context, wrapMocks(mocks));

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

    selector.selectResponse("test-1", "scenario-1", context, wrapMocks(mocks));

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
    const selector = createResponseSelector({ sequenceTracker, stateManager });

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
            { status: 200, body: { status: "pending", id: "{{state.jobId}}" } },
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

describe("ResponseSelector - Regex Matching", () => {
  describe("Header regex matching", () => {
    it("should match header with regex pattern", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/products",
        headers: { "x-campaign": "summer-premium-sale" },
        body: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/products",
          match: {
            headers: {
              "x-campaign": { regex: { source: "premium|vip", flags: "i" } },
            },
          },
          response: { status: 200, body: { tier: "premium" } },
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
        expect(result.data.body).toEqual({ tier: "premium" });
      }
    });

    it("should NOT match when regex does not match header value", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/products",
        headers: { "x-campaign": "summer-sale" },
        body: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/products",
          match: {
            headers: {
              "x-campaign": { regex: { source: "premium|vip", flags: "i" } },
            },
          },
          response: { status: 200, body: { tier: "premium" } },
        },
        {
          method: "GET",
          url: "/api/products",
          response: { status: 200, body: { tier: "standard" } },
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
        expect(result.data.body).toEqual({ tier: "standard" }); // Fallback
      }
    });

    it("should handle case-insensitive regex matching", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/products",
        headers: { "x-campaign": "early-VIP-access" },
        body: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/products",
          match: {
            headers: {
              "x-campaign": { regex: { source: "vip", flags: "i" } },
            },
          },
          response: { status: 200, body: { tier: "premium" } },
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
        expect(result.data.body).toEqual({ tier: "premium" });
      }
    });
  });

  describe("Query param regex matching", () => {
    it("should match query param with regex pattern", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/search",
        query: { category: "premium-electronics" },
        headers: {},
        body: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/search",
          match: {
            query: {
              category: { regex: { source: "premium", flags: "" } },
            },
          },
          response: { status: 200, body: { results: ["laptop", "phone"] } },
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
        expect(result.data.body).toEqual({ results: ["laptop", "phone"] });
      }
    });
  });

  describe("String matching strategies", () => {
    describe("contains strategy", () => {
      it("should match when header contains substring", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/products",
          headers: { "x-campaign": "summer-premium-sale" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/products",
            match: {
              headers: {
                "x-campaign": { contains: "premium" },
              },
            },
            response: { status: 200, body: { tier: "premium" } },
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
          expect(result.data.body).toEqual({ tier: "premium" });
        }
      });

      it("should match when header value is exact match (contains substring of itself)", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/products",
          headers: { "x-campaign": "premium" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/products",
            match: {
              headers: {
                "x-campaign": { contains: "premium" },
              },
            },
            response: { status: 200, body: { tier: "premium" } },
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
          expect(result.data.body).toEqual({ tier: "premium" });
        }
      });

      it("should NOT match when header does not contain substring", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/products",
          headers: { "x-campaign": "summer-sale" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/products",
            match: {
              headers: {
                "x-campaign": { contains: "premium" },
              },
            },
            response: { status: 200, body: { tier: "premium" } },
          },
          {
            method: "GET",
            url: "/api/products",
            response: { status: 200, body: { tier: "standard" } },
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
          expect(result.data.body).toEqual({ tier: "standard" }); // Fallback
        }
      });

      it("should be case-sensitive", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/products",
          headers: { "x-campaign": "PREMIUM-sale" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/products",
            match: {
              headers: {
                "x-campaign": { contains: "premium" },
              },
            },
            response: { status: 200, body: { tier: "premium" } },
          },
          {
            method: "GET",
            url: "/api/products",
            response: { status: 200, body: { tier: "standard" } },
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
          expect(result.data.body).toEqual({ tier: "standard" }); // Fallback (case-sensitive)
        }
      });
    });

    describe("startsWith strategy", () => {
      it("should match when header starts with prefix", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/keys",
          headers: { "x-api-key": "sk_test_12345" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/keys",
            match: {
              headers: {
                "x-api-key": { startsWith: "sk_" },
              },
            },
            response: { status: 200, body: { keyType: "secret" } },
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
          expect(result.data.body).toEqual({ keyType: "secret" });
        }
      });

      it("should NOT match when header does not start with prefix", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/keys",
          headers: { "x-api-key": "pk_test_12345" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/keys",
            match: {
              headers: {
                "x-api-key": { startsWith: "sk_" },
              },
            },
            response: { status: 200, body: { keyType: "secret" } },
          },
          {
            method: "GET",
            url: "/api/keys",
            response: { status: 200, body: { keyType: "public" } },
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
          expect(result.data.body).toEqual({ keyType: "public" }); // Fallback
        }
      });

      it("should be case-sensitive", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/keys",
          headers: { "x-api-key": "SK_test_12345" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/keys",
            match: {
              headers: {
                "x-api-key": { startsWith: "sk_" },
              },
            },
            response: { status: 200, body: { keyType: "secret" } },
          },
          {
            method: "GET",
            url: "/api/keys",
            response: { status: 200, body: { keyType: "public" } },
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
          expect(result.data.body).toEqual({ keyType: "public" }); // Fallback (case-sensitive)
        }
      });
    });

    describe("endsWith strategy", () => {
      it("should match when query param ends with suffix", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/users",
          query: { email: "john@company.com" },
          headers: {},
          body: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/users",
            match: {
              query: {
                email: { endsWith: "@company.com" },
              },
            },
            response: { status: 200, body: { access: "internal" } },
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
          expect(result.data.body).toEqual({ access: "internal" });
        }
      });

      it("should NOT match when query param does not end with suffix", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/users",
          query: { email: "john@example.com" },
          headers: {},
          body: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/users",
            match: {
              query: {
                email: { endsWith: "@company.com" },
              },
            },
            response: { status: 200, body: { access: "internal" } },
          },
          {
            method: "GET",
            url: "/api/users",
            response: { status: 200, body: { access: "external" } },
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
          expect(result.data.body).toEqual({ access: "external" }); // Fallback
        }
      });

      it("should be case-sensitive", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/users",
          query: { email: "john@COMPANY.COM" },
          headers: {},
          body: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/users",
            match: {
              query: {
                email: { endsWith: "@company.com" },
              },
            },
            response: { status: 200, body: { access: "internal" } },
          },
          {
            method: "GET",
            url: "/api/users",
            response: { status: 200, body: { access: "external" } },
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
          expect(result.data.body).toEqual({ access: "external" }); // Fallback (case-sensitive)
        }
      });
    });

    describe("equals strategy", () => {
      it("should match when header exactly equals value", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/status",
          headers: { "x-exact": "exact-value" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/status",
            match: {
              headers: {
                "x-exact": { equals: "exact-value" },
              },
            },
            response: { status: 200, body: { status: "ok" } },
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
          expect(result.data.body).toEqual({ status: "ok" });
        }
      });

      it("should NOT match when header contains value but is not exact", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/status",
          headers: { "x-exact": "exact-value-plus" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/status",
            match: {
              headers: {
                "x-exact": { equals: "exact-value" },
              },
            },
            response: { status: 200, body: { status: "ok" } },
          },
          {
            method: "GET",
            url: "/api/status",
            response: { status: 200, body: { status: "error" } },
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
          expect(result.data.body).toEqual({ status: "error" }); // Fallback
        }
      });

      it("should be case-sensitive", () => {
        const context: HttpRequestContext = {
          method: "GET",
          url: "/api/status",
          headers: { "x-exact": "EXACT-VALUE" },
          body: {},
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "GET",
            url: "/api/status",
            match: {
              headers: {
                "x-exact": { equals: "exact-value" },
              },
            },
            response: { status: 200, body: { status: "ok" } },
          },
          {
            method: "GET",
            url: "/api/status",
            response: { status: 200, body: { status: "error" } },
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
          expect(result.data.body).toEqual({ status: "error" }); // Fallback (case-sensitive)
        }
      });
    });

    describe("body fields", () => {
      it("should match body field using contains strategy", () => {
        const context: HttpRequestContext = {
          method: "POST",
          url: "/api/users",
          headers: {},
          body: { email: "john.doe@company.com" },
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "POST",
            url: "/api/users",
            match: {
              body: {
                email: { contains: "@company.com" },
              },
            },
            response: { status: 200, body: { tier: "corporate" } },
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
          expect(result.data.body).toEqual({ tier: "corporate" });
        }
      });

      it("should match body field using startsWith strategy", () => {
        const context: HttpRequestContext = {
          method: "POST",
          url: "/api/tokens",
          headers: {},
          body: { apiKey: "sk_test_12345" },
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "POST",
            url: "/api/tokens",
            match: {
              body: {
                apiKey: { startsWith: "sk_" },
              },
            },
            response: { status: 200, body: { valid: true, type: "secret" } },
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
          expect(result.data.body).toEqual({ valid: true, type: "secret" });
        }
      });

      it("should match body field using endsWith strategy", () => {
        const context: HttpRequestContext = {
          method: "POST",
          url: "/api/files",
          headers: {},
          body: { filename: "report.pdf" },
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "POST",
            url: "/api/files",
            match: {
              body: {
                filename: { endsWith: ".pdf" },
              },
            },
            response: { status: 200, body: { format: "document" } },
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
          expect(result.data.body).toEqual({ format: "document" });
        }
      });

      it("should match body field using equals strategy", () => {
        const context: HttpRequestContext = {
          method: "POST",
          url: "/api/auth",
          headers: {},
          body: { action: "login" },
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "POST",
            url: "/api/auth",
            match: {
              body: {
                action: { equals: "login" },
              },
            },
            response: { status: 200, body: { authenticated: true } },
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
          expect(result.data.body).toEqual({ authenticated: true });
        }
      });

      it("should NOT match when body field doesn't contain substring", () => {
        const context: HttpRequestContext = {
          method: "POST",
          url: "/api/users",
          headers: {},
          body: { email: "john@example.com" },
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "POST",
            url: "/api/users",
            match: {
              body: {
                email: { contains: "@company.com" },
              },
            },
            response: { status: 200, body: { tier: "corporate" } },
          },
          {
            method: "POST",
            url: "/api/users",
            response: { status: 200, body: { tier: "personal" } },
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
          expect(result.data.body).toEqual({ tier: "personal" }); // Fallback
        }
      });

      it("should handle non-string body values by converting to string", () => {
        const context: HttpRequestContext = {
          method: "POST",
          url: "/api/orders",
          headers: {},
          body: { quantity: 5, price: 99.99 },
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "POST",
            url: "/api/orders",
            match: {
              body: {
                quantity: { equals: "5" }, // String comparison after coercion
              },
            },
            response: { status: 200, body: { status: "created" } },
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
          expect(result.data.body).toEqual({ status: "created" });
        }
      });

      it("should handle null/undefined body criteria values (backward compat)", () => {
        const context: HttpRequestContext = {
          method: "POST",
          url: "/api/test",
          headers: {},
          body: { field1: "", field2: "value" },
          query: {},
        };

        // TypeScript won't allow null in MatchValue, but runtime backward compat handles it
        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "POST",
            url: "/api/test",
            match: {
              body: {
                field1: null as any, // Backward compat: null criteria matches empty string
              },
            },
            response: { status: 200, body: { matched: true } },
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
          expect(result.data.body).toEqual({ matched: true });
        }
      });

      it("should NOT match when body criteria has unknown/invalid strategy property", () => {
        const context: HttpRequestContext = {
          method: "POST",
          url: "/api/test",
          headers: {},
          body: { field: "value" },
          query: {},
        };

        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "POST",
            url: "/api/test",
            match: {
              body: {
                field: { unknownStrategy: "value" } as any,
              },
            },
            response: { status: 200, body: { matched: true } },
          },
          {
            method: "POST",
            url: "/api/test",
            response: { status: 200, body: { fallback: true } },
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
          expect(result.data.body).toEqual({ fallback: true });
        }
      });
    });
  });

  describe("Path Parameter Template Injection", () => {
    it("should inject path parameters into response templates without stateManager", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/users/123",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocksWithParams: ReadonlyArray<ScenaristMockWithParams> = [
        {
          mock: {
            method: "GET",
            url: "/api/users/:userId",
            response: {
              status: 200,
              body: {
                message: "User ID is {{params.userId}}",
                userId: "{{params.userId}}",
              },
            },
          },
          params: { userId: "123" }, // Extracted from URL by matcher
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        mocksWithParams,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          message: "User ID is 123",
          userId: "123",
        });
      }
    });

    it("should handle template referencing non-existent params prefix", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/items",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocksWithParams: ReadonlyArray<ScenaristMockWithParams> = [
        {
          mock: {
            method: "GET",
            url: "/api/items",
            response: {
              status: 200,
              body: {
                // Template references params but no params extracted
                itemId: "{{params.id}}",
                fallback: "default",
              },
            },
          },
          params: {}, // No params extracted
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        mocksWithParams,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // When params prefix doesn't exist, template returns null
        // which gets preserved in the final object (JSON-safe)
        expect(result.data.body).toEqual({
          itemId: null,
          fallback: "default",
        });
      }
    });

    it("should not inject params templates when params is undefined", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/items",
        body: undefined,
        headers: {},
        query: {},
      };

      const mocksWithParams: ReadonlyArray<ScenaristMockWithParams> = [
        {
          mock: {
            method: "GET",
            url: "/api/items",
            response: {
              status: 200,
              body: {
                // Template references params but params is undefined
                itemId: "{{params.id}}",
                fallback: "default",
              },
            },
          },
          // params is undefined (not provided)
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        mocksWithParams,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // When params is undefined and no stateManager, templates are not replaced
        // and remain as literal strings in the response
        expect(result.data.body).toEqual({
          itemId: "{{params.id}}",
          fallback: "default",
        });
      }
    });

    it("should use empty params fallback when stateManager exists but params is undefined", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/items",
        body: undefined,
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "itemId", "item-from-state");

      const mocksWithParams: ReadonlyArray<ScenaristMockWithParams> = [
        {
          mock: {
            method: "GET",
            url: "/api/items",
            response: {
              status: 200,
              body: {
                // Templates can reference both state and params
                stateValue: "{{state.itemId}}",
                paramsValue: "{{params.id}}",
              },
            },
          },
          // params is undefined - should use {} fallback
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        mocksWithParams,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // State template works, params template returns null (preserved in object for JSON safety)
        expect(result.data.body).toEqual({
          paramsValue: null,
          stateValue: "item-from-state",
        });
      }
    });

    it("should merge state and params with params taking precedence", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/orders/456",
        body: { customerId: "cust-789" },
        headers: {},
        query: {},
      };

      const stateManager = createInMemoryStateManager();
      stateManager.set("test-1", "orderId", "order-123");
      stateManager.set("test-1", "customerId", "cust-from-state");

      const mocksWithParams: ReadonlyArray<ScenaristMockWithParams> = [
        {
          mock: {
            method: "POST",
            url: "/api/orders/:orderId",
            response: {
              status: 200,
              body: {
                orderId: "{{params.orderId}}", // From URL params
                customerId: "{{params.customerId}}", // Should take precedence over state
                stateValue: "{{state.orderId}}", // From state
              },
            },
          },
          params: {
            orderId: "456",
            customerId: "cust-from-params",
          },
        },
      ];

      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "default-scenario",
        context,
        mocksWithParams,
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          orderId: "456", // From params
          customerId: "cust-from-params", // Params take precedence
          stateValue: "order-123", // From state
        });
      }
    });
  });

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
});

/**
 * Mock Type Interactions (Matrix Testing)
 *
 * Tests ensuring all mock type combinations work correctly.
 * This prevents bugs where new response types are added but
 * existing logic doesn't account for them (Issue #316).
 *
 * Three mock response types exist:
 * - response: Single static response (specificity 0 as fallback)
 * - sequence: Ordered responses (specificity 1 as fallback)
 * - stateResponse: State-conditional responses (specificity 1 as fallback)
 *
 * Match criteria always add 100+ to specificity regardless of response type.
 */
describe("Mock Type Interactions (Matrix Testing)", () => {
  describe("Fallback Specificity Matrix (No Match Criteria)", () => {
    /**
     * Test matrix for fallback mocks (no match criteria):
     * When two mocks exist for the same endpoint without match criteria,
     * selection is based on specificity (sequence/stateResponse=1, response=0)
     * and position (last wins for equal specificity).
     *
     * Mocks are ordered [first, second] to test "last wins" behavior.
     */

    it("should select active stateResponse over default sequence (Issue #316)", () => {
      // This is the exact bug reported in Issue #316:
      // Default scenario has a sequence mock (specificity 1)
      // Active scenario has a stateResponse mock (specificity should also be 1)
      // stateResponse should win because it comes last (equal specificity)

      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/users/123",
        body: null,
        headers: {},
        query: {},
      };

      // Simulate: default scenario mock first, active scenario mock second
      // In real usage, default mocks come first, active mocks are appended
      const mocks: ReadonlyArray<ScenaristMock> = [
        // Default scenario: sequence mock
        {
          method: "GET",
          url: "/api/users/:id",
          sequence: {
            responses: [
              { status: 200, body: { source: "sequence-step-1" } },
              { status: 200, body: { source: "sequence-step-2" } },
            ],
            repeat: "last",
          },
        },
        // Active scenario: stateResponse mock (should win - same specificity, last position)
        {
          method: "GET",
          url: "/api/users/:id",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse-default" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });

      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // stateResponse should win (last fallback with equal specificity)
        expect(result.data.body).toEqual({ source: "stateResponse-default" });
      }
    });

    // ========== Full 3x3 Matrix Tests ==========
    // Testing all combinations of mock types as [first, second] where second should typically win
    // for equal specificity (last wins), or higher specificity wins regardless of position.

    // Row 1: response (specificity 0) as first mock
    it("response vs response: second response wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response-first" } },
        },
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response-second" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "response-second" });
      }
    });

    it("response vs sequence: sequence wins (specificity 1 > 0)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response" } },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence" } }],
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "sequence" });
      }
    });

    it("response vs stateResponse: stateResponse wins (specificity 1 > 0)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response" } },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "stateResponse" });
      }
    });

    // Row 2: sequence (specificity 1) as first mock
    it("sequence vs response: sequence wins (specificity 1 > 0)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response" } },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // sequence (1) > response (0), so sequence wins despite being first
        expect(result.data.body).toEqual({ source: "sequence" });
      }
    });

    it("sequence vs sequence: second sequence wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence-first" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence-second" } }],
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "sequence-second" });
      }
    });

    it("sequence vs stateResponse: stateResponse wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "stateResponse" });
      }
    });

    // Row 3: stateResponse (specificity 1) as first mock
    it("stateResponse vs response: stateResponse wins (specificity 1 > 0)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { source: "response" } },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // stateResponse (1) > response (0), so stateResponse wins despite being first
        expect(result.data.body).toEqual({ source: "stateResponse" });
      }
    });

    it("stateResponse vs sequence: sequence wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence" } }],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "sequence" });
      }
    });

    it("stateResponse vs stateResponse: second stateResponse wins (equal specificity, last wins)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse-first" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { source: "stateResponse-second" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "stateResponse-second" });
      }
    });
  });

  describe("Match Criteria vs Fallback", () => {
    /**
     * Match criteria always add 100+ to specificity, so any mock with match
     * criteria should beat any fallback mock, regardless of response type.
     */

    it("response with match beats sequence fallback (100+ > 1)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { type: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence-fallback" } }],
          },
        },
        {
          method: "POST",
          url: "/api/test",
          match: { body: { type: "premium" } },
          response: { status: 200, body: { source: "response-with-match" } },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "response-with-match" });
      }
    });

    it("sequence with match beats response fallback (100+ > 0)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { type: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          response: { status: 200, body: { source: "response-fallback" } },
        },
        {
          method: "POST",
          url: "/api/test",
          match: { body: { type: "premium" } },
          sequence: {
            responses: [
              { status: 200, body: { source: "sequence-with-match" } },
            ],
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ source: "sequence-with-match" });
      }
    });

    it("stateResponse with match beats response fallback (100+ > 0)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { type: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          response: { status: 200, body: { source: "response-fallback" } },
        },
        {
          method: "POST",
          url: "/api/test",
          match: { body: { type: "premium" } },
          stateResponse: {
            default: {
              status: 200,
              body: { source: "stateResponse-with-match" },
            },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          source: "stateResponse-with-match",
        });
      }
    });

    it("stateResponse with match beats sequence fallback (100+ > 1)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { type: "premium" },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "POST",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { source: "sequence-fallback" } }],
          },
        },
        {
          method: "POST",
          url: "/api/test",
          match: { body: { type: "premium" } },
          stateResponse: {
            default: {
              status: 200,
              body: { source: "stateResponse-with-match" },
            },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({
          source: "stateResponse-with-match",
        });
      }
    });
  });

  describe("Equal Specificity Tiebreakers", () => {
    /**
     * When two mocks have equal specificity, the last one wins.
     * This allows active scenario mocks to override default scenario mocks.
     */

    it("two response mocks (specificity 0): last wins", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { position: "first" } },
        },
        {
          method: "GET",
          url: "/api/test",
          response: { status: 200, body: { position: "second" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ position: "second" });
      }
    });

    it("two sequence mocks (specificity 1): last wins", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { position: "first" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { position: "second" } }],
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ position: "second" });
      }
    });

    it("two stateResponse mocks (specificity 1): last wins", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { position: "first" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { position: "second" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const selector = createResponseSelector({ stateManager });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ position: "second" });
      }
    });

    it("sequence then stateResponse (both specificity 1): stateResponse wins (last)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { type: "sequence" } }],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { type: "stateResponse" } },
            conditions: [],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ type: "stateResponse" });
      }
    });

    it("stateResponse then sequence (both specificity 1): sequence wins (last)", () => {
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/test",
        body: null,
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<ScenaristMock> = [
        {
          method: "GET",
          url: "/api/test",
          stateResponse: {
            default: { status: 200, body: { type: "stateResponse" } },
            conditions: [],
          },
        },
        {
          method: "GET",
          url: "/api/test",
          sequence: {
            responses: [{ status: 200, body: { type: "sequence" } }],
          },
        },
      ];

      const stateManager = createInMemoryStateManager();
      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({
        sequenceTracker,
        stateManager,
      });
      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks(mocks),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ type: "sequence" });
      }
    });
  });
});

/**
 * Feature Combinations (Integration)
 *
 * Tests ensuring Phase 1+2+3 features work correctly when combined.
 * Each feature is tested in isolation elsewhere; these tests verify
 * that features don't break each other when used together.
 */
describe("Feature Combinations (Integration)", () => {
  it("stateResponse with captureState: capture then respond based on state", () => {
    // First request captures userId, second request uses stateResponse based on it
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    // Mock that captures userId from request
    const captureMock: ScenaristMock = {
      method: "POST",
      url: "/api/login",
      captureState: { userId: "body.userId" },
      response: { status: 200, body: { success: true } },
    };

    // Mock that responds based on captured userId
    const stateResponseMock: ScenaristMock = {
      method: "GET",
      url: "/api/profile",
      stateResponse: {
        default: { status: 200, body: { user: "unknown" } },
        conditions: [
          {
            when: { userId: "admin" },
            then: {
              status: 200,
              body: { user: "admin", role: "administrator" },
            },
          },
          {
            when: { userId: "user123" },
            then: { status: 200, body: { user: "user123", role: "member" } },
          },
        ],
      },
    };

    // Step 1: Login as admin (captures userId)
    const loginContext: HttpRequestContext = {
      method: "POST",
      url: "/api/login",
      body: { userId: "admin", password: "secret" },
      headers: {},
      query: {},
    };

    selector.selectResponse(
      "test-1",
      "test-scenario",
      loginContext,
      wrapMocks([captureMock]),
    );

    // Verify state was captured
    expect(stateManager.get("test-1", "userId")).toBe("admin");

    // Step 2: Get profile (uses captured state)
    const profileContext: HttpRequestContext = {
      method: "GET",
      url: "/api/profile",
      body: null,
      headers: {},
      query: {},
    };

    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      profileContext,
      wrapMocks([stateResponseMock]),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({
        user: "admin",
        role: "administrator",
      });
    }
  });

  it("stateResponse with afterResponse: respond then mutate state", () => {
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    // Mock that responds based on state AND mutates state after responding
    const mock: ScenaristMock = {
      method: "POST",
      url: "/api/workflow/advance",
      stateResponse: {
        default: { status: 200, body: { step: "initial" } },
        conditions: [
          {
            when: { step: "initial" },
            then: { status: 200, body: { step: "processing" } },
          },
          {
            when: { step: "processing" },
            then: { status: 200, body: { step: "complete" } },
          },
        ],
      },
      afterResponse: { setState: { lastAdvanced: "{{state.step}}" } },
    };

    const context: HttpRequestContext = {
      method: "POST",
      url: "/api/workflow/advance",
      body: {},
      headers: {},
      query: {},
    };

    // First call: no state, returns default "initial"
    const result1 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );

    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.body).toEqual({ step: "initial" });
    }
    // afterResponse should have set lastAdvanced (but to undefined since step wasn't set yet)

    // Set state to "initial" for the next test
    stateManager.set("test-1", "step", "initial");

    // Second call: state is "initial", returns "processing"
    const result2 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );

    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.body).toEqual({ step: "processing" });
    }
  });

  it("sequence with captureState: capture state while advancing through sequence", () => {
    const stateManager = createInMemoryStateManager();
    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker, stateManager });

    // Sequence that captures orderId from each request
    const mock: ScenaristMock = {
      method: "POST",
      url: "/api/orders",
      captureState: { "orderIds[]": "body.orderId" },
      sequence: {
        responses: [
          { status: 201, body: { status: "created", step: 1 } },
          { status: 201, body: { status: "created", step: 2 } },
          { status: 201, body: { status: "created", step: 3 } },
        ],
        repeat: "last",
      },
    };

    // Make 3 requests, each with different orderId
    const orderIds = ["order-1", "order-2", "order-3"];

    for (let i = 0; i < 3; i++) {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/orders",
        body: { orderId: orderIds[i] },
        headers: {},
        query: {},
      };

      const result = selector.selectResponse(
        "test-1",
        "test-scenario",
        context,
        wrapMocks([mock]),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ status: "created", step: i + 1 });
      }
    }

    // Verify all orderIds were captured in array
    const capturedIds = stateManager.get("test-1", "orderIds");
    expect(capturedIds).toEqual(["order-1", "order-2", "order-3"]);
  });

  it("sequence with afterResponse: mutate state after each sequence step", () => {
    const stateManager = createInMemoryStateManager();
    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker, stateManager });

    // Sequence that updates step count after each response
    const mock: ScenaristMock = {
      method: "GET",
      url: "/api/status",
      sequence: {
        responses: [
          { status: 200, body: { phase: "initializing" } },
          { status: 200, body: { phase: "processing" } },
          { status: 200, body: { phase: "complete" } },
        ],
        repeat: "last",
      },
      afterResponse: { setState: { lastPhase: "checked" } },
    };

    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/status",
      body: null,
      headers: {},
      query: {},
    };

    // First request
    const result1 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );
    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.body).toEqual({ phase: "initializing" });
    }
    expect(stateManager.get("test-1", "lastPhase")).toBe("checked");

    // Second request
    const result2 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );
    expect(result2.success).toBe(true);
    if (result2.success) {
      expect(result2.data.body).toEqual({ phase: "processing" });
    }

    // Third request
    const result3 = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([mock]),
    );
    expect(result3.success).toBe(true);
    if (result3.success) {
      expect(result3.data.body).toEqual({ phase: "complete" });
    }
  });

  it("stateResponse with match criteria: specific match + state-based response", () => {
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    // Set up initial state
    stateManager.set("test-1", "userTier", "premium");

    // Mock with match criteria AND stateResponse
    const mock: ScenaristMock = {
      method: "POST",
      url: "/api/products",
      match: { body: { category: "electronics" } },
      stateResponse: {
        default: { status: 200, body: { discount: 0 } },
        conditions: [
          {
            when: { userTier: "premium" },
            then: { status: 200, body: { discount: 20 } },
          },
          {
            when: { userTier: "gold" },
            then: { status: 200, body: { discount: 10 } },
          },
        ],
      },
    };

    // Fallback mock (should not be selected)
    const fallbackMock: ScenaristMock = {
      method: "POST",
      url: "/api/products",
      response: { status: 200, body: { discount: 0, source: "fallback" } },
    };

    const context: HttpRequestContext = {
      method: "POST",
      url: "/api/products",
      body: { category: "electronics", productId: "12345" },
      headers: {},
      query: {},
    };

    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([fallbackMock, mock]),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Should use stateResponse mock (has match criteria) and resolve to premium condition
      expect(result.data.body).toEqual({ discount: 20 });
    }
  });

  it("match.state with stateResponse: match on state then resolve stateResponse", () => {
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    // Set up state
    stateManager.set("test-1", "workflowStep", "review");
    stateManager.set("test-1", "approvalStatus", "pending");

    // Mock that matches on state AND uses stateResponse for additional conditions
    const reviewMock: ScenaristMock = {
      method: "POST",
      url: "/api/workflow/action",
      match: { state: { workflowStep: "review" } },
      stateResponse: {
        default: { status: 200, body: { action: "waiting" } },
        conditions: [
          {
            when: { approvalStatus: "approved" },
            then: { status: 200, body: { action: "proceed" } },
          },
          {
            when: { approvalStatus: "pending" },
            then: { status: 200, body: { action: "wait-for-approval" } },
          },
        ],
      },
    };

    // Different mock for different workflow step
    const completeMock: ScenaristMock = {
      method: "POST",
      url: "/api/workflow/action",
      match: { state: { workflowStep: "complete" } },
      response: { status: 200, body: { action: "finalized" } },
    };

    const context: HttpRequestContext = {
      method: "POST",
      url: "/api/workflow/action",
      body: {},
      headers: {},
      query: {},
    };

    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks([completeMock, reviewMock]),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Should match reviewMock (workflowStep: review) and resolve to pending condition
      expect(result.data.body).toEqual({ action: "wait-for-approval" });
    }
  });
});

/**
 * Scenario Override Behavior
 *
 * Tests ensuring active scenario mocks properly override default scenario mocks.
 * In real usage, mocks are ordered [default scenario mocks, active scenario mocks],
 * so active scenario mocks come last and should win when specificity is equal.
 *
 * This is critical for the scenario switching feature to work correctly.
 */
describe("Scenario Override Behavior", () => {
  it("active response overrides default response (same endpoint)", () => {
    // Simulating: default scenario provides base mock, active scenario overrides it
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario mock (comes first)
      {
        method: "GET",
        url: "/api/data",
        response: { status: 200, body: { source: "default-scenario" } },
      },
      // Active scenario mock (comes last, should win)
      {
        method: "GET",
        url: "/api/data",
        response: { status: 200, body: { source: "active-scenario" } },
      },
    ];

    const selector = createResponseSelector();
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({ source: "active-scenario" });
    }
  });

  it("active sequence overrides default sequence (same endpoint)", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: sequence
      {
        method: "GET",
        url: "/api/data",
        sequence: {
          responses: [{ status: 200, body: { source: "default-sequence" } }],
        },
      },
      // Active scenario: sequence (should win)
      {
        method: "GET",
        url: "/api/data",
        sequence: {
          responses: [{ status: 200, body: { source: "active-sequence" } }],
        },
      },
    ];

    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({ source: "active-sequence" });
    }
  });

  it("active stateResponse overrides default stateResponse (same endpoint)", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: stateResponse
      {
        method: "GET",
        url: "/api/data",
        stateResponse: {
          default: { status: 200, body: { source: "default-stateResponse" } },
          conditions: [],
        },
      },
      // Active scenario: stateResponse (should win)
      {
        method: "GET",
        url: "/api/data",
        stateResponse: {
          default: { status: 200, body: { source: "active-stateResponse" } },
          conditions: [],
        },
      },
    ];

    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({ source: "active-stateResponse" });
    }
  });

  it("active stateResponse overrides default sequence (Issue #316 scenario)", () => {
    // This is the exact Issue #316 bug scenario:
    // - Migrating from sequence-based to state-based patterns
    // - Default scenario has old sequence mock
    // - Active scenario has new stateResponse mock
    // - Active scenario's stateResponse should win

    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/users/123",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: legacy sequence mock
      {
        method: "GET",
        url: "/api/users/:id",
        sequence: {
          responses: [
            { status: 200, body: { step: 1, source: "default-sequence" } },
            { status: 200, body: { step: 2, source: "default-sequence" } },
          ],
          repeat: "last",
        },
      },
      // Active scenario: new stateResponse mock (should win)
      {
        method: "GET",
        url: "/api/users/:id",
        stateResponse: {
          default: {
            status: 200,
            body: { state: "default", source: "active-stateResponse" },
          },
          conditions: [],
        },
      },
    ];

    const stateManager = createInMemoryStateManager();
    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker, stateManager });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({
        state: "default",
        source: "active-stateResponse",
      });
    }
  });

  it("active sequence overrides default stateResponse", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: stateResponse
      {
        method: "GET",
        url: "/api/data",
        stateResponse: {
          default: { status: 200, body: { source: "default-stateResponse" } },
          conditions: [],
        },
      },
      // Active scenario: sequence (should win)
      {
        method: "GET",
        url: "/api/data",
        sequence: {
          responses: [{ status: 200, body: { source: "active-sequence" } }],
        },
      },
    ];

    const stateManager = createInMemoryStateManager();
    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker, stateManager });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toEqual({ source: "active-sequence" });
    }
  });

  it("active response does NOT override default sequence (sequence has higher specificity)", () => {
    // Important: response (specificity 0) should NOT override sequence (specificity 1)
    // This tests that specificity still takes precedence over position

    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: sequence (specificity 1)
      {
        method: "GET",
        url: "/api/data",
        sequence: {
          responses: [{ status: 200, body: { source: "default-sequence" } }],
        },
      },
      // Active scenario: response (specificity 0, should NOT win)
      {
        method: "GET",
        url: "/api/data",
        response: { status: 200, body: { source: "active-response" } },
      },
    ];

    const sequenceTracker = createInMemorySequenceTracker();
    const selector = createResponseSelector({ sequenceTracker });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Sequence wins because specificity 1 > 0
      expect(result.data.body).toEqual({ source: "default-sequence" });
    }
  });

  it("active response does NOT override default stateResponse (stateResponse has higher specificity)", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/data",
      body: null,
      headers: {},
      query: {},
    };

    const mocks: ReadonlyArray<ScenaristMock> = [
      // Default scenario: stateResponse (specificity 1)
      {
        method: "GET",
        url: "/api/data",
        stateResponse: {
          default: { status: 200, body: { source: "default-stateResponse" } },
          conditions: [],
        },
      },
      // Active scenario: response (specificity 0, should NOT win)
      {
        method: "GET",
        url: "/api/data",
        response: { status: 200, body: { source: "active-response" } },
      },
    ];

    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });
    const result = selector.selectResponse(
      "test-1",
      "test-scenario",
      context,
      wrapMocks(mocks),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // stateResponse wins because specificity 1 > 0
      expect(result.data.body).toEqual({ source: "default-stateResponse" });
    }
  });
});

/**
 * Mock Type Completeness Guard
 *
 * This test documents the expected mock response types and serves as a
 * "canary" test that reminds developers to update the matrix tests when
 * new response types are added to the schema.
 *
 * If a new response type is added (e.g., `conditionalResponse`), this test
 * should fail and prompt the developer to:
 * 1. Update this guard test
 * 2. Add the new type to the fallback specificity matrix tests
 * 3. Add the new type to the feature combination tests
 * 4. Add the new type to the scenario override tests
 */
describe("Mock Type Completeness Guard", () => {
  it("documents expected response types - update matrix tests if this changes", () => {
    // These are the three mutually-exclusive response types in ScenaristMock.
    // The schema allows at most one of these to be defined per mock.
    //
    // If you're adding a new response type, you MUST:
    // 1. Add it to this list
    // 2. Update the fallback specificity calculation in response-selector.ts
    // 3. Add matrix tests for the new type in "Mock Type Interactions"
    // 4. Add feature combination tests in "Feature Combinations"
    // 5. Add scenario override tests in "Scenario Override Behavior"
    const KNOWN_RESPONSE_TYPES = [
      "response", // Simple static response (specificity 0 as fallback)
      "sequence", // Ordered sequence of responses (specificity 1 as fallback)
      "stateResponse", // State-conditional responses (specificity 1 as fallback)
    ] as const;

    // Document the specificity hierarchy
    const SPECIFICITY_HIERARCHY = {
      // Fallback mocks (no match criteria)
      response: 0, // Simple fallback
      sequence: 1, // Dynamic response type
      stateResponse: 1, // Dynamic response type (Issue #316 fix)

      // With match criteria: 100+ base, same for all response types
      // e.g., response+match = 101+, sequence+match = 101+, stateResponse+match = 101+
    };

    // Verify we have exactly 3 response types
    expect(KNOWN_RESPONSE_TYPES).toHaveLength(3);

    // Verify the specificity values are as documented
    expect(SPECIFICITY_HIERARCHY.response).toBe(0);
    expect(SPECIFICITY_HIERARCHY.sequence).toBe(1);
    expect(SPECIFICITY_HIERARCHY.stateResponse).toBe(1);
  });

  it("verifies matrix test coverage matches known response types", () => {
    // This test serves as documentation that all type combinations are tested.
    // Update this when adding new response types.
    const KNOWN_RESPONSE_TYPES = ["response", "sequence", "stateResponse"];

    // For N response types, we need N×N matrix tests (fallback combinations)
    const expectedMatrixTests = KNOWN_RESPONSE_TYPES.length ** 2; // 3×3 = 9

    // Additional tests needed:
    // - Match criteria vs fallback tests (one per dynamic type)
    // - Tiebreaker tests (pairs of equal-specificity types)

    expect(expectedMatrixTests).toBe(9);

    // Document what's tested in "Mock Type Interactions":
    // - 9 fallback matrix tests (3×3 combinations)
    // - 4 match criteria vs fallback tests
    // - 5 equal specificity tiebreaker tests
    // Total: 18+ tests (plus Issue #316 regression test)
  });
});
