import { SCENARIST_TEST_ID_HEADER } from "@scenarist/express-adapter";
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";

import { createTestFixtures } from "./test-helpers.js";
import { scenarios } from "../src/scenarios.js";

/**
 * URL Matching Strategies - ATDD Acceptance Tests (Express)
 *
 * These tests verify that URL matching works end-to-end with Express:
 * - Native RegExp patterns for URL matching
 * - String strategies (contains, startsWith, endsWith, equals) for URLs
 * - Combined matching (URL + headers)
 * - Automatic default fallback behavior
 *
 * Test approach:
 * - Uses Express routes that make server-side fetch calls
 * - Tests URL matching through external API mocks
 * - Verifies specificity-based selection
 */

/**
 * Create test fixtures with async setup
 * Uses factory pattern to avoid let/any violations
 */
// Use top-level await to create fixtures once before all tests
const fixtures = await createTestFixtures();

describe("URL Matching Strategies - Express", () => {
  afterAll(async () => {
    await fixtures.cleanup();
  });

  /**
   * Test 1: Native RegExp - Numeric ID Filtering
   *
   * Scenario mock matches when URL ends with specific numeric ID:
   * - Match: { url: /\/users\/1$/ }
   *
   * Should match:
   * - '/users/1' (ends with exactly "1")
   *
   * Should NOT match:
   * - '/users/octocat' (ends with string, not numeric)
   * - '/users/123' (ends with different number)
   */
  it("should match URL with numeric ID using native RegExp", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-1")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/numeric-id/1")
      .set(SCENARIST_TEST_ID_HEADER, "url-test-1");

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("regexNumericId");
    expect(response.body.login).toBe("user-numeric-id");
    expect(response.body.followers).toBe(500);
  });

  it("should NOT match non-numeric ID (fallback to path param mock)", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-2")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/numeric-id/octocat")
      .set(SCENARIST_TEST_ID_HEADER, "url-test-2");

    expect(response.status).toBe(200);
    // With path parameter mock present (last fallback wins), it extracts the username
    expect(response.body.id).toBe("octocat");
    expect(response.body.login).toBe("user-octocat");
  });

  /**
   * Test 2: Contains Strategy - URLs containing '/weather/'
   *
   * Scenario mock matches when URL contains '/weather/':
   * - Match: { url: { contains: '/weather/' } }
   *
   * Should match:
   * - 'https://api.weather.com/v1/weather/london' (contains '/weather/')
   *
   * Should NOT match:
   * - URLs without '/weather/' substring
   */
  it('should match URL containing "/weather/" using contains strategy', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-3")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/contains-api/london")
      .set(SCENARIST_TEST_ID_HEADER, "url-test-3");

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("containsWeather");
    expect(response.body.city).toBe("Weather Match City");
    expect(response.body.conditions).toBe("Weather route matched");
  });

  /**
   * Test 3: StartsWith Strategy - API Versioning
   *
   * Scenario mock matches when URL starts with v2:
   * - Match: { url: { startsWith: 'https://api.weather.com/v2' } }
   *
   * Should match:
   * - 'https://api.weather.com/v2/weather/london' (starts with v2 base)
   *
   * Should NOT match:
   * - 'https://api.weather.com/v1/weather/london' (starts with v1, not v2)
   */
  it("should match v2 API URL using startsWith strategy", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-4")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/version/v2/newyork")
      .set(SCENARIST_TEST_ID_HEADER, "url-test-4");

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("startsWithV2");
    expect(response.body.city).toBe("Version 2 City");
    expect(response.body.conditions).toBe("V2 API matched");
  });

  it("should NOT match v1 API URL (fallback)", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-5")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/version/v1/paris")
      .set(SCENARIST_TEST_ID_HEADER, "url-test-5");

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("fallback");
    expect(response.body.city).toBe("Fallback City");
  });

  /**
   * Test 4: EndsWith Strategy - File Extension Filtering
   *
   * Scenario mock matches when URL ends with '.json':
   * - Match: { url: { endsWith: '.json' } }
   *
   * Should match:
   * - '/repos/owner/repo/contents/data.json' (ends with .json)
   *
   * Should NOT match:
   * - '/repos/owner/repo/contents/readme.txt' (ends with .txt)
   */
  it("should match .json file extension using endsWith strategy", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-6")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/file-extension/config.json")
      .set(SCENARIST_TEST_ID_HEADER, "url-test-6");

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("endsWithJson");
    expect(response.body.name).toBe("data.json");
    expect(response.body.type).toBe("file");
  });

  it("should NOT match non-.json file (fallback)", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-7")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/file-extension/readme.txt")
      .set(SCENARIST_TEST_ID_HEADER, "url-test-7");

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("fallback");
    expect(response.body.name).toBe("unknown.txt");
  });

  /**
   * Test 5: Combined Matching - URL Pattern + Header
   *
   * Scenario mock matches when BOTH URL and header match:
   * - Match: { url: /\/v1\/charges$/, headers: { 'x-api-version': '2023-10-16' } }
   *
   * Should match when both conditions met
   * Should NOT match when only URL matches (header mismatch)
   */
  it("should match when both URL and header match", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-8")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/combined")
      .query({ apiVersion: "2023-10-16" })
      .set(SCENARIST_TEST_ID_HEADER, "url-test-8");

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("combinedUrlHeader");
    expect(response.body.amount).toBe(2000);
  });

  it("should NOT match when URL matches but header does not (fallback)", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-9")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/combined")
      .query({ apiVersion: "2022-11-15" }) // Different version
      .set(SCENARIST_TEST_ID_HEADER, "url-test-9");

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("fallback");
    expect(response.body.amount).toBe(1000);
  });

  /**
   * Test 6: Exact URL Match (Backward Compatible)
   *
   * Scenario mock matches exact URL string:
   * - Match: { url: 'https://api.github.com/users/exactuser' }
   *
   * Should match only the exact URL
   */
  it("should match exact URL string", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "url-test-10")
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(fixtures.app)
      .get("/api/test-url-match/exact/exactuser")
      .set(SCENARIST_TEST_ID_HEADER, "url-test-10");

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("exactUrl");
    expect(response.body.login).toBe("exactuser");
    expect(response.body.followers).toBe(100);
  });

  /**
   * Path Parameter Extraction Tests - CRITICAL PROOF OF MSW PARITY
   *
   * These tests verify that path-to-regexp parameter extraction works end-to-end.
   *
   * Path parameters use path-to-regexp syntax (same as MSW):
   * - :id - Simple parameter
   * - :id? - Optional parameter
   * - :path+ - Repeating parameter (array)
   * - :id(\d+) - Custom regex parameter
   */
  describe("Path Parameter Extraction", () => {
    /**
     * Test 7: Simple Path Parameter - User ID
     *
     * Pattern: /api/users/:id
     * Should extract different IDs and return user-specific data
     */
    it("should extract simple path parameter :id and route to different users", async () => {
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "url-test-11")
        .send({ scenario: scenarios.urlMatching.id });

      // Request user ID 123
      const response123 = await request(fixtures.app)
        .get("/api/test-url-match/path-param/123")
        .set(SCENARIST_TEST_ID_HEADER, "url-test-11");

      expect(response123.status).toBe(200);
      expect(response123.body.id).toBe("123");
      expect(response123.body.login).toBe("user-123");

      // Request different user ID 456
      const response456 = await request(fixtures.app)
        .get("/api/test-url-match/path-param/456")
        .set(SCENARIST_TEST_ID_HEADER, "url-test-11");

      expect(response456.status).toBe(200);
      expect(response456.body.id).toBe("456");
      expect(response456.body.login).toBe("user-456");
    });

    /**
     * Test 8: Multiple Path Parameters
     *
     * Pattern: /api/users/:userId/posts/:postId
     * Should extract both parameters correctly
     */
    it("should extract multiple path parameters :userId and :postId", async () => {
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "url-test-12")
        .send({ scenario: scenarios.urlMatching.id });

      const response = await request(fixtures.app)
        .get("/api/test-url-match/multiple-params/alice/42")
        .set(SCENARIST_TEST_ID_HEADER, "url-test-12");

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe("alice");
      expect(response.body.postId).toBe("42");
      expect(response.body.title).toBe("Post 42 by alice");
    });

    /**
     * NOTE: Advanced path parameter features (optional, repeating, custom regex)
     * are not tested in Express due to path-to-regexp v8 syntax differences.
     * Core functionality (simple and multiple parameters) is tested above.
     * These advanced features ARE tested in Next.js apps which use MSW's native path-to-regexp.
     */
  });
});
