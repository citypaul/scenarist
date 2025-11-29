/**
 * Hostname Matching - ATDD Acceptance Tests
 *
 * These tests verify the three URL pattern types and their hostname matching behavior:
 * 1. Pathname-only patterns (/api/data) - Origin-agnostic (match ANY hostname)
 * 2. Full URL patterns (http://localhost:3001/api/data) - Hostname-specific (match ONLY specified hostname)
 * 3. Native RegExp patterns (/\/api\/data/) - Origin-agnostic (MSW weak comparison)
 */

import { test, expect } from "./fixtures";

test.describe("Hostname Matching - ATDD", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * Test 1: Pathname-Only Pattern - Origin-Agnostic Behavior
   *
   * Pattern: '/api/origin-agnostic'
   * Should match requests to ANY hostname (localhost, api.example.com, staging.test.io, etc.)
   */
  test("should match pathname-only pattern at ANY hostname", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "hostnameMatching");

    await page.goto("/hostname-matching?test=pathnameOnly");

    // Verify pattern type and behavior
    await expect(page.getByText("Pattern Type: pathname-only")).toBeVisible();
    await expect(page.getByText("Behavior: origin-agnostic")).toBeVisible();
    await expect(
      page.getByText("This matches requests to ANY hostname"),
    ).toBeVisible();

    // Verify examples list shows multiple hostnames
    await expect(
      page.getByText("http://localhost:3001/api/origin-agnostic"),
    ).toBeVisible();
    await expect(
      page.getByText("https://api.example.com/api/origin-agnostic"),
    ).toBeVisible();
  });

  /**
   * Test 2: Full URL Pattern with Localhost - Hostname-Specific
   *
   * Pattern: 'http://localhost:3001/api/localhost-only'
   * Should ONLY match localhost:3001 requests
   */
  test("should match full URL pattern ONLY for localhost hostname", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "hostnameMatching");

    await page.goto("/hostname-matching?test=localhostFull");

    // Verify pattern type and behavior
    await expect(page.getByText("Pattern Type: full-url")).toBeVisible();
    await expect(page.getByText("Hostname: localhost:3001")).toBeVisible();
    await expect(page.getByText("Behavior: hostname-specific")).toBeVisible();
    await expect(
      page.getByText("This ONLY matches localhost:3001 requests"),
    ).toBeVisible();

    // Verify will match / won't match examples
    await expect(
      page.getByText("Will Match: http://localhost:3001/api/localhost-only"),
    ).toBeVisible();
    await expect(
      page.getByText("https://api.example.com/api/localhost-only"),
    ).toBeVisible(); // In "won't match" list
  });

  /**
   * Test 3: Full URL Pattern with External Domain - Hostname-Specific
   *
   * Pattern: 'https://api.example.com/api/production-only'
   * Should ONLY match api.example.com requests
   */
  test("should match full URL pattern ONLY for external hostname", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "hostnameMatching");

    await page.goto("/hostname-matching?test=externalFull");

    // Verify pattern type and behavior
    await expect(page.getByText("Pattern Type: full-url")).toBeVisible();
    await expect(page.getByText("Hostname: api.example.com")).toBeVisible();
    await expect(page.getByText("Behavior: hostname-specific")).toBeVisible();
    await expect(
      page.getByText("This ONLY matches api.example.com requests"),
    ).toBeVisible();

    // Verify will match / won't match examples
    await expect(
      page.getByText("Will Match: https://api.example.com/api/production-only"),
    ).toBeVisible();
    await expect(
      page.getByText("http://localhost:3001/api/production-only"),
    ).toBeVisible(); // In "won't match" list
  });

  /**
   * Test 4: Native RegExp Pattern - Origin-Agnostic
   *
   * Pattern: /\/api\/regex-pattern$/
   * Should match the pathname pattern at ANY hostname (MSW weak comparison)
   */
  test("should match native RegExp pattern at ANY hostname", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "hostnameMatching");

    await page.goto("/hostname-matching?test=regexp");

    // Verify pattern type and behavior
    await expect(page.getByText("Pattern Type: native-regexp")).toBeVisible();
    await expect(
      page.getByText("Behavior: origin-agnostic (MSW weak comparison)"),
    ).toBeVisible();
    await expect(
      page.getByText("This matches the pathname pattern at ANY hostname"),
    ).toBeVisible();

    // Verify examples list shows multiple hostnames
    await expect(
      page.getByText("http://localhost:3001/api/regex-pattern"),
    ).toBeVisible();
    await expect(
      page.getByText("https://api.example.com/api/regex-pattern"),
    ).toBeVisible();
  });

  /**
   * Test 5: Pathname with Path Parameters - Origin-Agnostic + Param Extraction
   *
   * Pattern: '/api/users/:userId/posts/:postId'
   * Should extract params AND match ANY hostname
   */
  test("should extract path params from pathname pattern (origin-agnostic)", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "hostnameMatching");

    await page.goto(
      "/hostname-matching?test=pathnameParams&userId=789&postId=321",
    );

    // Verify pattern type and behavior
    await expect(
      page.getByText("Pattern Type: pathname-only with params"),
    ).toBeVisible();
    await expect(
      page.getByText("Behavior: origin-agnostic + param extraction"),
    ).toBeVisible();
    await expect(
      page.getByText("Extracts params and matches ANY hostname"),
    ).toBeVisible();

    // Verify params were extracted
    await expect(page.getByText("User ID: 789")).toBeVisible();
    await expect(page.getByText("Post ID: 321")).toBeVisible();

    // Verify examples show multiple hostnames
    await expect(
      page.getByText("http://localhost:3001/api/users/123/posts/456"),
    ).toBeVisible();
    await expect(
      page.getByText("https://api.example.com/api/users/123/posts/456"),
    ).toBeVisible();
  });

  /**
   * Test 6: Full URL with Path Parameters - Hostname-Specific + Param Extraction
   *
   * Pattern: 'http://localhost:3001/api/local-users/:userId'
   * Should extract params but ONLY match localhost:3001
   */
  test("should extract path params from full URL pattern (hostname-specific)", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "hostnameMatching");

    await page.goto("/hostname-matching?test=fullUrlParams&userId=999");

    // Verify pattern type and behavior
    await expect(
      page.getByText("Pattern Type: full-url with params"),
    ).toBeVisible();
    await expect(page.getByText("Hostname: localhost:3001")).toBeVisible();
    await expect(
      page.getByText("Behavior: hostname-specific + param extraction"),
    ).toBeVisible();
    await expect(
      page.getByText("Extracts params but ONLY matches localhost:3001"),
    ).toBeVisible();

    // Verify param was extracted
    await expect(page.getByText("User ID: 999")).toBeVisible();

    // Verify will match / won't match examples
    await expect(
      page.getByText("Will Match: http://localhost:3001/api/local-users/123"),
    ).toBeVisible();
    await expect(page.getByText("Won't Match:")).toBeVisible();
    await expect(
      page.getByText("https://api.example.com/api/local-users/123"),
    ).toBeVisible();
  });
});
