import { describe, expect, it } from "vitest";
import type {
  ScenaristMock,
  ScenaristMockWithParams,
  HttpRequestContext,
} from "../src/types/index.js";
import { createResponseSelector } from "../src/domain/response-selector.js";
import { createInMemoryStateManager } from "../src/adapters/in-memory-state-manager.js";

/**
 * Helper to wrap mocks with empty params for tests that don't use path params.
 * The ResponseSelector expects mocks with extracted path params, but these tests don't use path params, so we wrap with empty params.
 */
const wrapMocks = (
  mocks: ReadonlyArray<ScenaristMock>,
): ReadonlyArray<ScenaristMockWithParams> => {
  return mocks.map((mock) => ({ mock, params: {} }));
};

describe("ResponseSelector - Pattern Matching", () => {
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
});
