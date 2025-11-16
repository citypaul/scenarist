import { describe, expect, it } from "vitest";
import type { MockDefinition, HttpRequestContext } from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
import { createInMemorySequenceTracker } from "../src/adapters/in-memory-sequence-tracker.js";
import { createInMemoryStateManager } from "../src/adapters/in-memory-state-manager.js";

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

      expect(result.success).toBe(false);
    });

    it("should match on multiple body fields (partial match)", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/items",
        body: { itemId: "premium", category: "electronics", inStock: true, quantity: 10 },
        headers: {},
        query: {},
      };

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium", category: "electronics" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "x-user-tier": "premium" } },
          response: { status: 200, body: { data: "premium-data" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "x-user-tier": "premium" } },
          response: { status: 200, body: { data: "premium-data" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "x-user-tier": "premium" } },
          response: { status: 200, body: { data: "premium-data" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "X-User-Tier": "premium" } }, // Mixed case in criteria
          response: { status: 200, body: { data: "premium-data" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "X-API-KEY": "secret123" } }, // All uppercase
          response: { status: 200, body: { data: "secure-data" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "X-User-Tier": "PREMIUM" } }, // Uppercase value
          response: { status: 200, body: { data: "premium-data" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

      expect(result.success).toBe(false); // Values are case-sensitive
    });

    it("should match when request headers are NOT normalized (mixed case from adapter)", () => {
      // This tests the new architecture where adapters pass through headers as-is
      // and core normalizes both request AND criteria headers
      const context: HttpRequestContext = {
        method: "GET",
        url: "/api/data",
        body: undefined,
        headers: { "X-User-Tier": "premium", "Content-Type": "application/json" }, // Mixed case from adapter
        query: {},
      };

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { "x-user-tier": "premium" } }, // Lowercase in criteria
          response: { status: 200, body: { data: "premium-data" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/search",
          match: { query: { filter: "active" } },
          response: { status: 200, body: { results: ["active-items"] } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/search",
          match: { query: { filter: "active" } },
          response: { status: 200, body: { results: ["active-items"] } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/search",
          match: { query: { filter: "active" } },
          response: { status: 200, body: { results: ["active-items"] } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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
      const mocksWithLessSpecificFirst: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocksWithLessSpecificFirst);

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
      const mocksWithEqualSpecificity: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocksWithEqualSpecificity);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "POST",
          url: "/api/items",
          match: { body: { itemId: "premium" } },
          response: { status: 200, body: { price: 100 } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "POST",
          url: "/api/items",
          // First fallback (no match criteria)
          response: { status: 200, body: { price: 50, source: "first-fallback" } },
        },
        {
          method: "POST",
          url: "/api/items",
          // Second fallback (no match criteria)
          response: { status: 200, body: { price: 60, source: "second-fallback" } },
        },
        {
          method: "POST",
          url: "/api/items",
          // Third fallback (no match criteria)
          response: { status: 200, body: { price: 70, source: "third-fallback" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        // Last fallback wins when all have equal specificity (0)
        expect(result.data.body).toEqual({ price: 70, source: "third-fallback" });
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

      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/status",
          // First sequence fallback (no match criteria, specificity 1)
          sequence: {
            responses: [
              { status: 200, body: { status: "pending", source: "first-sequence" } },
              { status: 200, body: { status: "complete", source: "first-sequence" } },
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
              { status: 200, body: { status: "processing", source: "second-sequence" } },
              { status: 200, body: { status: "done", source: "second-sequence" } },
            ],
            repeat: "last",
          },
        },
      ];

      const sequenceTracker = createInMemorySequenceTracker();
      const selector = createResponseSelector({ sequenceTracker });
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        // Last sequence fallback wins when all have equal specificity (1)
        expect(result.data.body).toEqual({ status: "processing", source: "second-sequence" });
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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "active-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
        // First mock with match criteria (specificity: 101 = 100 base + 1 header)
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { tier: "standard" } },
          response: { status: 200, body: { tier: "standard", source: "first" } },
        },
        // Second mock with match criteria (specificity: 101 = 100 base + 1 header)
        {
          method: "GET",
          url: "/api/data",
          match: { headers: { tier: "premium" } },
          response: { status: 200, body: { tier: "premium", source: "second" } },
        },
      ];

      const selector = createResponseSelector();
      const result = selector.selectResponse("test-1", "active-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result1 = selector.selectResponse("test-1", "job-scenario", context, mocks);
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ status: "pending" });
      }

      // Second call
      const result2 = selector.selectResponse("test-1", "job-scenario", context, mocks);
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({ status: "processing" });
      }

      // Third call
      const result3 = selector.selectResponse("test-1", "job-scenario", context, mocks);
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.body).toEqual({ status: "complete" });
      }
    });

    it("should default to 'last' repeat mode when not specified", () => {
      const selector = createResponseSelector({
        sequenceTracker: createInMemorySequenceTracker(),
      });

      const mocks: ReadonlyArray<MockDefinition> = [
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
        mocks
      );
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect((result1.data.body as { attempt: number }).attempt).toBe(1);
      }

      const result2 = selector.selectResponse(
        "test-default",
        "default-scenario",
        context,
        mocks
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
        mocks
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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      selector.selectResponse("test-2", "poll-scenario", context, mocks);
      selector.selectResponse("test-2", "poll-scenario", context, mocks);

      // Calls beyond the sequence should repeat the last response
      const result3 = selector.selectResponse("test-2", "poll-scenario", context, mocks);
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.body).toEqual({ value: 2 });
      }

      const result4 = selector.selectResponse("test-2", "poll-scenario", context, mocks);
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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result1 = selector.selectResponse("test-3", "toggle-scenario", context, mocks);
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ state: "on" });
      }

      const result2 = selector.selectResponse("test-3", "toggle-scenario", context, mocks);
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({ state: "off" });
      }

      // Should cycle back to first
      const result3 = selector.selectResponse("test-3", "toggle-scenario", context, mocks);
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.body).toEqual({ state: "on" });
      }

      const result4 = selector.selectResponse("test-3", "toggle-scenario", context, mocks);
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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result1 = selector.selectResponse("test-4", "limited-scenario", context, mocks);
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.body).toEqual({ attempt: 1 });
      }

      const result2 = selector.selectResponse("test-4", "limited-scenario", context, mocks);
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.body).toEqual({ attempt: 2 });
      }

      // Third call: sequence exhausted and skipped, fallback mock selected
      const result3 = selector.selectResponse("test-4", "limited-scenario", context, mocks);
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

      const mocks: ReadonlyArray<MockDefinition> = [
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
        mocks
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
        mocks
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
        mocks
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
        mocks
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

      const mocks: ReadonlyArray<MockDefinition> = [
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
        mocks
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
        mocks
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
        mocks
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
        mocks
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

      const mocks: ReadonlyArray<MockDefinition> = [
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
        mocks
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
        mocks
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
        mocks
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
        mocks
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
        mocks
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
      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: "GET",
          url: "/api/test",
          // No response or sequence field - invalid mock
        } as MockDefinition,
      ];

      const result = selector.selectResponse(
        "test-invalid",
        "scenario-invalid",
        context,
        mocks
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          "Mock has neither response nor sequence field"
        );
      }
    });

    it("should return error for sequence with empty responses array", () => {
      const mocks: ReadonlyArray<MockDefinition> = [
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
        mocks
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          "Mock has neither response nor sequence field"
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

    const mocks: ReadonlyArray<MockDefinition> = [
      {
        method: "POST",
        url: "/api/test",
        captureState: { userId: "body.userId" },
        response: { status: 200, body: { success: true } },
      },
    ];

    selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
      {
        method: "GET",
        url: "/api/test",
        captureState: { sessionId: "headers.x-session-id" },
        response: { status: 200, body: { success: true } },
      },
    ];

    selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
      {
        method: "GET",
        url: "/api/test",
        captureState: { currentPage: "query.page" },
        response: { status: 200, body: { success: true } },
      },
    ];

    selector.selectResponse("test-1", "scenario-1", context, mocks);

    expect(stateManager.get("test-1", "currentPage")).toBe("2");
  });

  it("should handle array append syntax", () => {
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    const mocks: ReadonlyArray<MockDefinition> = [
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
    selector.selectResponse("test-1", "scenario-1", context1, mocks);

    // Second request
    const context2: HttpRequestContext = {
      method: "POST",
      url: "/api/cart/add",
      body: { item: "Gadget" },
      headers: {},
      query: {},
    };
    selector.selectResponse("test-1", "scenario-1", context2, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
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

    selector.selectResponse("test-1", "scenario-1", context, mocks);

    expect(stateManager.get("test-1", "userId")).toBe("user-123");
    expect(stateManager.get("test-1", "action")).toBe("login");
    expect(stateManager.get("test-1", "sessionId")).toBe("session-456");
  });

  it("should isolate captured state per test ID", () => {
    const stateManager = createInMemoryStateManager();
    const selector = createResponseSelector({ stateManager });

    const mocks: ReadonlyArray<MockDefinition> = [
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
    selector.selectResponse("test-1", "scenario-1", context1, mocks);

    const context2: HttpRequestContext = {
      method: "POST",
      url: "/api/test",
      body: { value: 10 },
      headers: {},
      query: {},
    };
    selector.selectResponse("test-2", "scenario-1", context2, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
      {
        method: "POST",
        url: "/api/test",
        captureState: { missing: "body.nonexistent" },
        response: { status: 200, body: { success: true } },
      },
    ];

    selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
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

    selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
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

    const result = selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
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

    const result = selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
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

    const result = selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
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

    const result = selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
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

    const result = selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
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

    const result = selector.selectResponse("test-1", "scenario-1", context, mocks);

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

    const mocks: ReadonlyArray<MockDefinition> = [
      {
        method: "GET",
        url: "/api/job/status",
        sequence: {
          responses: [
            { status: 200, body: { status: "pending", id: "{{state.jobId}}" } },
            { status: 200, body: { status: "complete", id: "{{state.jobId}}" } },
          ],
          repeat: "last",
        },
      },
    ];

    // First call - pending
    const result1 = selector.selectResponse("test-1", "scenario-1", context, mocks);
    expect(result1.success).toBe(true);
    if (result1.success) {
      expect(result1.data.body).toEqual({
        status: "pending",
        id: "job-789",
      });
    }

    // Second call - complete
    const result2 = selector.selectResponse("test-1", "scenario-1", context, mocks);
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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

      const mocks: ReadonlyArray<MockDefinition> = [
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
      const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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

        const mocks: ReadonlyArray<MockDefinition> = [
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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

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
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body).toEqual({ matched: true });
        }
      });

      it("should handle arbitrary object criteria values (backward compat fallback)", () => {
        const context: HttpRequestContext = {
          method: "POST",
          url: "/api/test",
          headers: {},
          body: { metadata: { type: "special" } },
          query: {},
        };

        // TypeScript won't allow arbitrary objects, but runtime handles them via fallback
        const mocks: ReadonlyArray<ScenaristMock> = [
          {
            method: "POST",
            url: "/api/test",
            match: {
              body: {
                metadata: { type: "special" } as any, // Fallback: stringified comparison
              },
            },
            response: { status: 200, body: { matched: true } },
          },
        ];

        const selector = createResponseSelector();
        const result = selector.selectResponse("test-1", "default-scenario", context, mocks);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body).toEqual({ matched: true });
        }
      });
    });
  });
});
