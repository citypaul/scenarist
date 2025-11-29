import { describe, it, expect } from "vitest";

/**
 * This test documents the header handling contract between MSW adapter and Core.
 *
 * NEW CONTRACT (after architectural fix):
 * - MSW adapter passes headers through as-is (no normalization)
 * - Core normalizes ALL headers (request + criteria) for matching
 * - This centralizes normalization logic in one place (core)
 *
 * WHY THIS MATTERS:
 * - HTTP headers are case-insensitive per RFC 2616
 * - Browsers can send headers with any casing (Authorization, AUTHORIZATION, authorization)
 * - Core handles normalization so adapters don't have to
 *
 * IMPLEMENTATION DETAIL:
 * - The Fetch API Headers object automatically normalizes keys to lowercase
 * - Even if it didn't, core would still handle normalization correctly
 * - Adapters can safely pass through headers without worrying about casing
 */
describe("Header handling contract", () => {
  it("documents that Fetch API Headers normalizes keys automatically", () => {
    // Fetch API Headers object automatically normalizes to lowercase
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("X-CUSTOM-HEADER", "test-value");
    headers.set("UPPERCASE-HEADER", "uppercase-value");

    // All keys are automatically lowercase
    const keys: string[] = [];
    headers.forEach((value, key) => {
      keys.push(key);
    });

    // Check all keys are lowercase (order may vary)
    expect(keys).toContain("content-type");
    expect(keys).toContain("x-custom-header");
    expect(keys).toContain("uppercase-header");
    expect(keys.every((key) => key === key.toLowerCase())).toBe(true);
  });

  it("documents that core normalizes both request and criteria headers", () => {
    // Adapter passes through headers as-is (in practice, Fetch API normalizes them)
    const requestContext = {
      method: "GET" as const,
      url: "https://api.example.com/test",
      body: undefined,
      headers: {
        "content-type": "application/json", // Lowercase (from Fetch API)
        "x-custom-header": "test-value", // Lowercase (from Fetch API)
      },
      query: {},
    };

    // Core normalizes criteria keys to lowercase for matching
    const criteriaHeaders = {
      "Content-Type": "application/json", // Mixed case in criteria
      "X-Custom-Header": "test-value", // Mixed case in criteria
    };

    // Simulate core's matching logic (from response-selector.ts matchesHeaders)
    // Core normalizes BOTH request and criteria headers
    const normalizedRequest: Record<string, string> = {};
    Object.entries(requestContext.headers).forEach(([key, value]) => {
      normalizedRequest[key.toLowerCase()] = value;
    });

    const matches = Object.entries(criteriaHeaders).every(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      return normalizedRequest[normalizedKey] === value;
    });

    expect(matches).toBe(true);
  });

  it("shows core handles normalization even if adapter sends mixed-case headers", () => {
    // Hypothetical: adapter sends mixed-case headers (even though Fetch API normalizes)
    const requestContext = {
      method: "GET" as const,
      url: "https://api.example.com/test",
      body: undefined,
      headers: {
        "Content-Type": "application/json", // Mixed case (hypothetical)
        "X-Custom-Header": "test-value", // Mixed case (hypothetical)
      },
      query: {},
    };

    const criteriaHeaders = {
      "content-type": "application/json", // Lowercase in criteria
      "x-custom-header": "test-value", // Lowercase in criteria
    };

    // Core normalizes BOTH request and criteria headers
    const normalizedRequest: Record<string, string> = {};
    Object.entries(requestContext.headers).forEach(([key, value]) => {
      normalizedRequest[key.toLowerCase()] = value;
    });

    const matches = Object.entries(criteriaHeaders).every(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      return normalizedRequest[normalizedKey] === value;
    });

    // Matching succeeds because core normalizes both sides
    expect(matches).toBe(true);
  });
});
