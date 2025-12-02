import { describe, expect, it } from "vitest";
import type {
  ScenaristMock,
  ScenaristMockWithParams,
  HttpRequestContext,
} from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";

/**
 * Helper to wrap mocks in ScenaristMockWithParams format.
 * The ResponseSelector expects mocks with extracted path params, but these tests don't use path params, so we wrap with empty params.
 */
const wrapMocks = (
  mocks: ReadonlyArray<ScenaristMock>,
): ReadonlyArray<ScenaristMockWithParams> => {
  return mocks.map((mock) => ({ mock, params: {} }));
};

describe("ResponseSelector - Body Matching", () => {
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
});
