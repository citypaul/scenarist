import { describe, it, expect } from "vitest";
import { matchesUrl } from "../src/matching/url-matcher.js";

describe("URL Matcher", () => {
  describe("Exact string matching", () => {
    it("should return true for exact match", () => {
      const result = matchesUrl(
        "https://api.example.com/users",
        "https://api.example.com/users",
      );

      expect(result.matches).toBe(true);
      // path-to-regexp returns empty object for exact matches (no params)
      expect(result.params).toEqual({});
    });

    it("should return false for different URL", () => {
      const result = matchesUrl(
        "https://api.example.com/users",
        "https://api.example.com/posts",
      );

      expect(result.matches).toBe(false);
      expect(result.params).toBeUndefined();
    });
  });

  describe("Path parameters", () => {
    it("should match /users/:id pattern and extract parameter", () => {
      const result = matchesUrl(
        "https://api.example.com/users/:id",
        "https://api.example.com/users/123",
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: "123" });
    });

    it("should match multiple path parameters", () => {
      const result = matchesUrl(
        "https://api.example.com/users/:userId/posts/:postId",
        "https://api.example.com/users/123/posts/456",
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ userId: "123", postId: "456" });
    });

    it("should not match when extra segments present", () => {
      const result = matchesUrl(
        "https://api.example.com/users/:id",
        "https://api.example.com/users/123/posts",
      );

      expect(result.matches).toBe(false);
    });

    it("should not match when pattern without params does not match", () => {
      const result = matchesUrl(
        "https://api.example.com/users/:id",
        "https://api.example.com/posts/123",
      );

      expect(result.matches).toBe(false);
    });

    it("should handle path-only patterns (no full URL)", () => {
      const result = matchesUrl("/users/:id", "/users/123");

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: "123" });
    });
  });

  describe("Native RegExp patterns", () => {
    it("should match URL with native RegExp", () => {
      const result = matchesUrl(
        /\/api\/users\/\d+/,
        "https://api.example.com/api/users/123",
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it("should match URL with native RegExp and flags (case-insensitive)", () => {
      const result = matchesUrl(
        /\/API\/USERS\/\d+/i,
        "https://api.example.com/api/users/123",
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it("should not match when RegExp does not match", () => {
      const result = matchesUrl(
        /\/api\/products\/\d+/,
        "https://api.example.com/api/users/123",
      );

      expect(result.matches).toBe(false);
      expect(result.params).toBeUndefined();
    });

    it("should match pathname-only URLs with native RegExp", () => {
      const result = matchesUrl(/^\/users\/\d+$/, "/users/123");

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it("should match full URL patterns with protocol", () => {
      const result = matchesUrl(
        /^https:\/\/api\.example\.com\/users\/\d+$/,
        "https://api.example.com/users/456",
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });
  });

  describe("MSW Weak Comparison Compatibility", () => {
    /**
     * MSW documentation states:
     * "Unlike paths, regular expressions use weak comparison, supporting partial matches.
     * When provided a regular expression, all request URLs that match that expression
     * will be captured, regardless of their origin."
     *
     * Example from MSW docs:
     * rest.delete(/\/posts\//, responseResolver)
     * // Matches:
     * // - DELETE http://localhost:8080/posts/
     * // - DELETE https://backend.dev/user/posts/
     */

    it("should match /\\/posts\\// across different origins (weak comparison)", () => {
      const pattern = /\/posts\//;

      // Different origins, same path pattern - all should match (MSW behavior)
      const result1 = matchesUrl(pattern, "http://localhost:8080/posts/");
      const result2 = matchesUrl(pattern, "https://backend.dev/user/posts/");
      const result3 = matchesUrl(pattern, "https://api.example.com/posts/123");

      expect(result1.matches).toBe(true);
      expect(result2.matches).toBe(true);
      expect(result3.matches).toBe(true);
    });

    it("should match partial paths regardless of protocol", () => {
      const pattern = /\/api\/v\d+\//;

      // Pattern matches substring, not full URL - origin-agnostic
      const result1 = matchesUrl(pattern, "http://localhost/api/v1/users");
      const result2 = matchesUrl(
        pattern,
        "https://prod.example.com/api/v2/posts",
      );
      const result3 = matchesUrl(
        pattern,
        "http://staging.test.io/api/v3/data/123",
      );

      expect(result1.matches).toBe(true);
      expect(result2.matches).toBe(true);
      expect(result3.matches).toBe(true);
    });

    it("should match substring patterns in any part of URL", () => {
      const pattern = /\/users\/\d+/;

      // Pattern can match anywhere in the URL path
      const result1 = matchesUrl(pattern, "https://api.example.com/users/123");
      const result2 = matchesUrl(
        pattern,
        "http://localhost/v1/users/456/profile",
      );
      const result3 = matchesUrl(
        pattern,
        "https://backend.dev/api/users/789/settings",
      );

      expect(result1.matches).toBe(true);
      expect(result2.matches).toBe(true);
      expect(result3.matches).toBe(true);
    });

    it("should NOT match when pattern is not found in URL", () => {
      const pattern = /\/products\/\d+/;

      // Pattern must exist somewhere in the URL
      const result1 = matchesUrl(pattern, "https://api.example.com/users/123");
      const result2 = matchesUrl(pattern, "http://localhost/posts/456");

      expect(result1.matches).toBe(false);
      expect(result2.matches).toBe(false);
    });

    it("should support weak comparison with query parameters", () => {
      const pattern = /\/search\?/;

      // Pattern matches URLs with query params, any origin
      const result1 = matchesUrl(
        pattern,
        "http://localhost:3000/search?q=test",
      );
      const result2 = matchesUrl(
        pattern,
        "https://api.example.com/v1/search?filter=active",
      );

      expect(result1.matches).toBe(true);
      expect(result2.matches).toBe(true);
    });

    it("should match case-insensitively when flag is set (weak + case-insensitive)", () => {
      const pattern = /\/API\/USERS/i;

      // Weak comparison + case-insensitive flag
      const result1 = matchesUrl(pattern, "http://localhost/api/users/123");
      const result2 = matchesUrl(
        pattern,
        "https://prod.example.com/v1/API/USERS",
      );
      const result3 = matchesUrl(pattern, "https://backend.dev/Api/Users/data");

      expect(result1.matches).toBe(true);
      expect(result2.matches).toBe(true);
      expect(result3.matches).toBe(true);
    });
  });
});

describe("Pathname-only patterns (MSW compatibility)", () => {
  it("should match pathname pattern against full URL request (mixed usage)", () => {
    // Real-world use case: scenario defines "/api/users/:id" (pathname-only)
    // Application makes request to "http://localhost:3001/api/users/123" (full URL)
    const result = matchesUrl(
      "/api/users/:id",
      "http://localhost:3001/api/users/123",
    );

    expect(result.matches).toBe(true);
    expect(result.params).toEqual({ id: "123" });
  });

  it("should NOT match full URL pattern with different hostname", () => {
    // Full URL patterns are hostname-specific
    // Pattern host (example.com) ≠ request host (localhost) → no match
    const result = matchesUrl(
      "http://example.com/api/users/:id", // Pattern host: example.com
      "http://localhost:3001/api/users/123", // Request host: localhost:3001
    );

    expect(result.matches).toBe(false);
    // Hostname mismatch prevents match - this gives users control
  });

  it("should match full URL pattern with SAME hostname", () => {
    // Full URL patterns match when hostname is identical
    const result = matchesUrl(
      "http://localhost:3001/api/users/:id", // Pattern host: localhost:3001
      "http://localhost:3001/api/users/123", // Request host: localhost:3001
    );

    expect(result.matches).toBe(true);
    expect(result.params).toEqual({ id: "123" });
  });

  it("should match pathname pattern with multiple params against full URL", () => {
    const result = matchesUrl(
      "/api/users/:userId/posts/:postId",
      "http://localhost:3001/api/users/alice/posts/42",
    );

    expect(result.matches).toBe(true);
    expect(result.params).toEqual({ userId: "alice", postId: "42" });
  });

  it("should match pathname pattern with custom regex against full URL", () => {
    const result = matchesUrl(
      "/api/orders/:orderId(\\d+)",
      "http://localhost:3001/api/orders/12345",
    );

    expect(result.matches).toBe(true);
    expect(result.params).toEqual({ orderId: "12345" });
  });

  it("should NOT match pathname pattern when path differs", () => {
    const result = matchesUrl(
      "/api/users/:id",
      "http://localhost:3001/api/products/123",
    );

    expect(result.matches).toBe(false);
  });

  it("should match pathname pattern across different origins", () => {
    const pattern = "/api/users/:id";

    // Same pathname pattern should match different hosts
    const result1 = matchesUrl(pattern, "http://localhost:3001/api/users/123");
    const result2 = matchesUrl(
      pattern,
      "https://api.example.com/api/users/456",
    );
    const result3 = matchesUrl(pattern, "http://staging.test.io/api/users/789");

    expect(result1.matches).toBe(true);
    expect(result1.params).toEqual({ id: "123" });

    expect(result2.matches).toBe(true);
    expect(result2.params).toEqual({ id: "456" });

    expect(result3.matches).toBe(true);
    expect(result3.params).toEqual({ id: "789" });
  });
});
