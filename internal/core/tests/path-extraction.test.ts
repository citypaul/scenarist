import { describe, it, expect } from "vitest";
import { extractFromPath } from "../src/domain/path-extraction.js";
import type { HttpRequestContext } from "../src/types/scenario.js";

describe("Path Extraction", () => {
  it("should extract value from request body", () => {
    const context: HttpRequestContext = {
      method: "POST",
      url: "/api/test",
      body: { userId: "user-123" },
      headers: {},
      query: {},
    };

    const result = extractFromPath(context, "body.userId");

    expect(result).toBe("user-123");
  });

  it("should extract value from request headers", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/test",
      headers: { "x-session-id": "session-456" },
      query: {},
    };

    const result = extractFromPath(context, "headers.x-session-id");

    expect(result).toBe("session-456");
  });

  it("should extract value from query params", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/test",
      headers: {},
      query: { page: "2" },
    };

    const result = extractFromPath(context, "query.page");

    expect(result).toBe("2");
  });

  it("should extract nested values from body", () => {
    const context: HttpRequestContext = {
      method: "POST",
      url: "/api/test",
      body: {
        user: {
          profile: {
            name: "Alice",
          },
        },
      },
      headers: {},
      query: {},
    };

    const result = extractFromPath(context, "body.user.profile.name");

    expect(result).toBe("Alice");
  });

  it("should return undefined for missing paths", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/test",
      body: { foo: "bar" },
      headers: {},
      query: {},
    };

    const result = extractFromPath(context, "body.nonexistent");

    expect(result).toBeUndefined();
  });

  it("should return undefined for invalid path prefixes", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/test",
      headers: {},
      query: {},
    };

    const result = extractFromPath(context, "invalid.path");

    expect(result).toBeUndefined();
  });

  it("should return undefined for path with less than 2 segments", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/test",
      body: { foo: "bar" },
      headers: {},
      query: {},
    };

    const result = extractFromPath(context, "body");

    expect(result).toBeUndefined();
  });

  it("should return undefined when source is null", () => {
    const context: HttpRequestContext = {
      method: "GET",
      url: "/api/test",
      body: null, // Explicitly null
      headers: {},
      query: {},
    };

    const result = extractFromPath(context, "body.field");

    expect(result).toBeUndefined();
  });

  it("should return undefined when trying to traverse through array", () => {
    const context: HttpRequestContext = {
      method: "POST",
      url: "/api/test",
      body: {
        items: ["a", "b", "c"],
      },
      headers: {},
      query: {},
    };

    const result = extractFromPath(context, "body.items.nested");

    expect(result).toBeUndefined();
  });

  /**
   * Security Tests - Prototype Pollution Prevention
   *
   * These tests verify that the path extraction is not vulnerable to prototype
   * pollution attacks where malicious keys like '__proto__', 'constructor',
   * or 'prototype' could access or modify Object.prototype.
   */
  describe("Security: Prototype Pollution Prevention", () => {
    it("should return undefined when accessing __proto__ key", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { __proto__: { polluted: "malicious" } },
        headers: {},
        query: {},
      };

      const result = extractFromPath(context, "body.__proto__");

      expect(result).toBeUndefined();
    });

    it("should return undefined when accessing constructor key", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { constructor: { polluted: "malicious" } },
        headers: {},
        query: {},
      };

      const result = extractFromPath(context, "body.constructor");

      expect(result).toBeUndefined();
    });

    it("should return undefined when accessing prototype key", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: { prototype: { polluted: "malicious" } },
        headers: {},
        query: {},
      };

      const result = extractFromPath(context, "body.prototype");

      expect(result).toBeUndefined();
    });

    it("should return undefined when dangerous key is in nested path", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: {
          safe: {
            __proto__: { nested: "malicious" },
          },
        },
        headers: {},
        query: {},
      };

      const result = extractFromPath(context, "body.safe.__proto__.nested");

      expect(result).toBeUndefined();
    });

    it("should not allow access to inherited properties", () => {
      const context: HttpRequestContext = {
        method: "POST",
        url: "/api/test",
        body: {},
        headers: {},
        query: {},
      };

      // hasOwnProperty exists on all objects via prototype chain
      const result = extractFromPath(context, "body.hasOwnProperty");

      expect(result).toBeUndefined();
    });
  });
});
