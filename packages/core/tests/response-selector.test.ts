import { describe, expect, it } from "vitest";
import type { MockDefinition, HttpRequestContext } from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

      expect(result.success).toBe(false);
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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocksWithLessSpecificFirst);

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
      const result = selector.selectResponse("test-1", context, mocksWithEqualSpecificity);

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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("No mock matched");
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
      const result = selector.selectResponse("test-1", context, mocks);

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
      const result = selector.selectResponse("test-1", context, mocks);

      expect(result.success).toBe(false);
    });
  });
});
