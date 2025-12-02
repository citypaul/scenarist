import { describe, expect, it } from "vitest";
import type {
  ScenaristMock,
  ScenaristMockWithParams,
  HttpRequestContext,
} from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";

const wrapMocks = (
  mocks: ReadonlyArray<ScenaristMock>,
): ReadonlyArray<ScenaristMockWithParams> => {
  return mocks.map((mock) => ({ mock, params: {} }));
};

describe("ResponseSelector - Query Matching", () => {
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
});
