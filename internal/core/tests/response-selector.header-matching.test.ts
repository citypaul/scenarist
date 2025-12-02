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

describe("ResponseSelector - Header Matching", () => {
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
});
