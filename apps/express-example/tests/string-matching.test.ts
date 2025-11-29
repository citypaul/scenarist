import { SCENARIST_TEST_ID_HEADER } from "@scenarist/express-adapter";
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";

import { createTestFixtures } from "./test-helpers.js";
import { scenarios } from "../src/scenarios.js";

/**
 * String Matching Strategies - ATDD Acceptance Tests (Express)
 *
 * These tests verify that all string matching strategies work end-to-end with Express:
 * - contains: Substring matching
 * - startsWith: Prefix matching
 * - endsWith: Suffix matching
 * - equals: Explicit exact matching
 *
 * Test approach:
 * - Uses Express routes that make server-side fetch calls
 * - Tests header/query param matching through external API mocks
 * - Verifies automatic default fallback behavior
 */

const fixtures = await createTestFixtures();

describe("String Matching Strategies - Express", () => {
  afterAll(async () => {
    await fixtures.cleanup();
  });

  /**
   * Test 1: Contains Strategy
   *
   * Scenario mock matches when header contains 'premium':
   * - Match: { headers: { 'x-campaign': { contains: 'premium' } } }
   *
   * Should match:
   * - 'summer-premium-sale' (contains 'premium')
   * - 'premium' (exact match also contains)
   * - 'PREMIUM-vip' (case-sensitive)
   *
   * Should NOT match:
   * - 'standard-sale' (doesn't contain 'premium')
   */
  it("should match header using contains strategy", async () => {
    // Switch to string matching scenario
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "string-test-1")
      .send({ scenario: scenarios.stringMatching.id });

    // Make request with campaign containing 'premium'
    const response = await request(fixtures.app)
      .get("/api/test-string-match/contains/testuser")
      .query({ campaign: "summer-premium-sale" })
      .set(SCENARIST_TEST_ID_HEADER, "string-test-1");

    // Verify premium response returned
    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("contains");
    expect(response.body.login).toBe("premium-user");
    expect(response.body.followers).toBe(8000);
  });

  it("should NOT match when header doesn't contain substring", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "string-test-2")
      .send({ scenario: scenarios.stringMatching.id });

    // Make request with campaign NOT containing 'premium'
    const response = await request(fixtures.app)
      .get("/api/test-string-match/contains/testuser")
      .query({ campaign: "standard-sale" })
      .set(SCENARIST_TEST_ID_HEADER, "string-test-2");

    // Should fall back to standard response (no match)
    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("fallback");
    expect(response.body.login).toBe("standard-user");
    expect(response.body.followers).toBe(200);
  });

  /**
   * Test 2: StartsWith Strategy
   *
   * Scenario mock matches when header starts with 'sk_':
   * - Match: { headers: { 'x-api-key': { startsWith: 'sk_' } } }
   *
   * Should match:
   * - 'sk_test_12345' (starts with 'sk_')
   * - 'sk_live_67890' (starts with 'sk_')
   *
   * Should NOT match:
   * - 'pk_test_12345' (starts with 'pk_')
   * - 'test_sk_12345' (contains but doesn't start with)
   */
  it("should match header using startsWith strategy", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "string-test-3")
      .send({ scenario: scenarios.stringMatching.id });

    // Make request with API key starting with 'sk_'
    const response = await request(fixtures.app)
      .get("/api/test-string-match/starts-with")
      .query({ apiKey: "sk_test_12345" })
      .set(SCENARIST_TEST_ID_HEADER, "string-test-3");

    // Verify valid API key response
    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("startsWith");
    expect(response.body.valid).toBe(true);
    expect(response.body.keyType).toBe("secret");
  });

  it("should NOT match when header doesn't start with prefix", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "string-test-4")
      .send({ scenario: scenarios.stringMatching.id });

    // Make request with API key NOT starting with 'sk_'
    const response = await request(fixtures.app)
      .get("/api/test-string-match/starts-with")
      .query({ apiKey: "pk_test_12345" })
      .set(SCENARIST_TEST_ID_HEADER, "string-test-4");

    // Should not match the startsWith pattern, falls back to catch-all handler
    // Fallback returns 401 with error body
    expect(response.status).toBe(401);
    expect(response.body.matchedBy).toBe("fallback");
  });

  /**
   * Test 3: EndsWith Strategy
   *
   * Scenario mock matches when query param ends with '@company.com':
   * - Match: { query: { email: { endsWith: '@company.com' } } }
   *
   * Should match:
   * - 'john@company.com' (ends with '@company.com')
   * - 'admin@company.com' (ends with '@company.com')
   *
   * Should NOT match:
   * - 'john@example.com' (ends with '@example.com')
   * - 'company.com' (exact match but no @)
   */
  it("should match query param using endsWith strategy", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "string-test-5")
      .send({ scenario: scenarios.stringMatching.id });

    // Make request with email ending with '@company.com'
    const response = await request(fixtures.app)
      .get("/api/test-string-match/ends-with/testuser")
      .query({ email: "john@company.com" })
      .set(SCENARIST_TEST_ID_HEADER, "string-test-5");

    // Verify company users are returned
    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("endsWith");
    expect(response.body.users).toHaveLength(2);
    expect(response.body.users[0].email).toBe("john@company.com");
    expect(response.body.users[1].email).toBe("jane@company.com");
  });

  it("should NOT match when query param doesn't end with suffix", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "string-test-6")
      .send({ scenario: scenarios.stringMatching.id });

    // Make request with email NOT ending with '@company.com'
    const response = await request(fixtures.app)
      .get("/api/test-string-match/ends-with/testuser")
      .query({ email: "john@example.com" })
      .set(SCENARIST_TEST_ID_HEADER, "string-test-6");

    // Should not match the endsWith pattern, falls back to catch-all handler
    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("fallback");
    expect(response.body.repos).toEqual([]);
  });

  /**
   * Test 4: Equals Strategy
   *
   * Scenario mock matches when header exactly equals 'exact-value':
   * - Match: { headers: { 'x-exact': { equals: 'exact-value' } } }
   *
   * This is the same as the default string match, but explicit.
   *
   * Should match:
   * - 'exact-value' (exact match)
   *
   * Should NOT match:
   * - 'exact-value-plus' (contains but not exact)
   * - 'EXACT-VALUE' (case-sensitive)
   */
  it("should match header using equals strategy", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "string-test-7")
      .send({ scenario: scenarios.stringMatching.id });

    // Make request with exact header value
    const response = await request(fixtures.app)
      .get("/api/test-string-match/equals")
      .query({ exact: "exact-value" })
      .set(SCENARIST_TEST_ID_HEADER, "string-test-7");

    // Verify exact match response
    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe("equals");
    expect(response.body.status).toBe("ok");
    expect(response.body.message).toBe("Exact match successful");
  });

  it("should NOT match when header value is not exact", async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "string-test-8")
      .send({ scenario: scenarios.stringMatching.id });

    // Make request with non-exact header value
    const response = await request(fixtures.app)
      .get("/api/test-string-match/equals")
      .query({ exact: "exact-value-plus" })
      .set(SCENARIST_TEST_ID_HEADER, "string-test-8");

    // Should not match the equals pattern, falls back to catch-all handler
    // Fallback returns 400 with error body
    expect(response.status).toBe(400);
    expect(response.body.matchedBy).toBe("fallback");
  });

  /**
   * Test 5: Backward Compatibility
   *
   * Verify that existing scenarios with plain string matching still work.
   * This ensures our changes are backward compatible.
   */
  it("should maintain backward compatibility with plain string matching", async () => {
    // Use existing default scenario (uses plain string matching)
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "string-test-9")
      .send({ scenario: scenarios.default.id });

    // Make request to GitHub API
    const response = await request(fixtures.app)
      .get("/api/github/user/octocat")
      .set(SCENARIST_TEST_ID_HEADER, "string-test-9");

    // Should still work with exact string match
    expect(response.status).toBe(200);
    expect(response.body.login).toBe("octocat");
    expect(response.body.name).toBe("The Octocat");
  });
});
