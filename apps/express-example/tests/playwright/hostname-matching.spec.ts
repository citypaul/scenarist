/**
 * Hostname Matching - ATDD Acceptance Tests
 *
 * These tests verify the three URL pattern types and their hostname matching behavior:
 * 1. Pathname-only patterns (/api/data) - Origin-agnostic (match ANY hostname)
 * 2. Full URL patterns (https://api.github.com/api/data) - Hostname-specific (match ONLY specified hostname)
 * 3. Native RegExp patterns (/\/api\/data/) - Origin-agnostic (MSW weak comparison)
 */

import { test, expect } from "./fixtures";

test.describe("Hostname Matching - ATDD", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * Test 1: Pathname-Only Pattern - Origin-Agnostic Behavior
   *
   * Pattern: '/api/origin-agnostic'
   * Should match requests to ANY hostname (localhost, api.github.com, api.stripe.com, etc.)
   */
  test("should match pathname-only pattern at ANY hostname", async ({
    request,
    switchScenario,
  }) => {
    await switchScenario("hostnameMatching");

    const response = await request.get("/api/test-hostname-match/pathname-only");

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.patternType).toBe("pathname-only");
    expect(body.data.behavior).toBe("origin-agnostic");
    expect(body.data.message).toBe("This matches requests to ANY hostname");
    expect(body.data.examples).toContain("http://localhost:3000/api/origin-agnostic");
    expect(body.data.examples).toContain("https://api.github.com/api/origin-agnostic");
  });

  /**
   * Test 2: Full URL Pattern with GitHub - Hostname-Specific
   *
   * Pattern: 'https://api.github.com/api/github-only'
   * Should ONLY match api.github.com requests
   */
  test("should match full URL pattern ONLY for GitHub hostname", async ({
    request,
    switchScenario,
  }) => {
    await switchScenario("hostnameMatching");

    const response = await request.get("/api/test-hostname-match/github-full");

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.patternType).toBe("full-url");
    expect(body.data.hostname).toBe("api.github.com");
    expect(body.data.behavior).toBe("hostname-specific");
    expect(body.data.message).toBe("This ONLY matches api.github.com requests");
    expect(body.data.willMatch).toBe("https://api.github.com/api/github-only");
    expect(body.data.wontMatch).toContain("https://api.stripe.com/api/github-only");
  });

  /**
   * Test 3: Full URL Pattern with Stripe - Hostname-Specific
   *
   * Pattern: 'https://api.stripe.com/api/stripe-only'
   * Should ONLY match api.stripe.com requests
   */
  test("should match full URL pattern ONLY for Stripe hostname", async ({
    request,
    switchScenario,
  }) => {
    await switchScenario("hostnameMatching");

    const response = await request.get("/api/test-hostname-match/stripe-full");

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.patternType).toBe("full-url");
    expect(body.data.hostname).toBe("api.stripe.com");
    expect(body.data.behavior).toBe("hostname-specific");
    expect(body.data.message).toBe("This ONLY matches api.stripe.com requests");
    expect(body.data.willMatch).toBe("https://api.stripe.com/api/stripe-only");
    expect(body.data.wontMatch).toContain("https://api.github.com/api/stripe-only");
  });

  /**
   * Test 4: Native RegExp Pattern - Origin-Agnostic
   *
   * Pattern: /\/api\/regex-pattern$/
   * Should match the pathname pattern at ANY hostname (MSW weak comparison)
   */
  test("should match native RegExp pattern at ANY hostname", async ({
    request,
    switchScenario,
  }) => {
    await switchScenario("hostnameMatching");

    const response = await request.get("/api/test-hostname-match/regexp");

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.patternType).toBe("native-regexp");
    expect(body.data.behavior).toBe("origin-agnostic (MSW weak comparison)");
    expect(body.data.message).toBe("This matches the pathname pattern at ANY hostname");
    expect(body.data.examples).toContain("http://localhost:3000/api/regex-pattern");
    expect(body.data.examples).toContain("https://api.github.com/api/regex-pattern");
  });

  /**
   * Test 5: Pathname with Path Parameters - Origin-Agnostic + Param Extraction
   *
   * Pattern: '/api/users/:userId/posts/:postId'
   * Should extract params AND match ANY hostname
   */
  test("should extract path params from pathname pattern (origin-agnostic)", async ({
    request,
    switchScenario,
  }) => {
    await switchScenario("hostnameMatching");

    const response = await request.get("/api/test-hostname-match/pathname-params/789/321");

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.patternType).toBe("pathname-only with params");
    expect(body.data.behavior).toBe("origin-agnostic + param extraction");
    expect(body.data.message).toBe("Extracts params and matches ANY hostname");
    expect(body.data.userId).toBe("789");
    expect(body.data.postId).toBe("321");
    expect(body.data.examples).toContain("http://localhost:3000/api/users/123/posts/456");
    expect(body.data.examples).toContain("https://api.github.com/api/users/123/posts/456");
  });

  /**
   * Test 6: Full URL with Path Parameters - Hostname-Specific + Param Extraction
   *
   * Pattern: 'https://api.github.com/api/github-users/:userId'
   * Should extract params but ONLY match api.github.com
   */
  test("should extract path params from full URL pattern (hostname-specific)", async ({
    request,
    switchScenario,
  }) => {
    await switchScenario("hostnameMatching");

    const response = await request.get("/api/test-hostname-match/full-params/999");

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.data.patternType).toBe("full-url with params");
    expect(body.data.hostname).toBe("api.github.com");
    expect(body.data.behavior).toBe("hostname-specific + param extraction");
    expect(body.data.message).toBe("Extracts params but ONLY matches api.github.com");
    expect(body.data.userId).toBe("999");
    expect(body.data.willMatch).toBe("https://api.github.com/api/github-users/123");
    expect(body.data.wontMatch).toBe("https://api.stripe.com/api/github-users/123");
  });
});
