/**
 * String Matching Strategies - ATDD Acceptance Tests (Pages Router)
 *
 * These tests verify that all string matching strategies work end-to-end with Pages Router:
 * - contains: Substring matching
 * - startsWith: Prefix matching
 * - endsWith: Suffix matching
 * - equals: Explicit exact matching
 *
 * Test approach:
 * - Uses API route that makes server-side data fetching
 * - Tests header/query param matching through API routes
 * - Verifies automatic default fallback behavior
 */

import { test, expect } from "./fixtures";

test.describe("String Matching Strategies - Pages Router", () => {
  test.describe.configure({ mode: "serial" });

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
  test("should match header using contains strategy", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    await page.goto(
      "/api/test-string-match?strategy=contains&campaign=summer-premium-sale",
    );

    const response = await page.textContent("body");
    const data = JSON.parse(response || "{}");

    expect(data.matchedBy).toBe("contains");
    expect(data.products).toBeDefined();
    expect(data.products.length).toBeGreaterThan(0);
    expect(data.products[0].price).toBe(99.99); // Premium pricing
  });

  test("should NOT match when header doesn't contain substring", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    await page.goto(
      "/api/test-string-match?strategy=contains&campaign=standard-sale",
    );

    const response = await page.textContent("body");
    const data = JSON.parse(response || "{}");

    expect(data.matchedBy).toBe("fallback");
    expect(data.products).toBeDefined();
    expect(data.products[0].price).toBe(149.99); // Standard pricing
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
  test("should match header using startsWith strategy", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    await page.goto(
      "/api/test-string-match?strategy=startsWith&apiKey=sk_test_12345",
    );

    const response = await page.textContent("body");
    const data = JSON.parse(response || "{}");

    expect(data.matchedBy).toBe("startsWith");
    expect(data.valid).toBe(true);
    expect(data.keyType).toBe("secret");
  });

  test("should NOT match when header doesn't start with prefix", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    await page.goto(
      "/api/test-string-match?strategy=startsWith&apiKey=pk_test_12345",
    );

    const response = await page.textContent("body");
    const data = JSON.parse(response || "{}");

    expect(data.matchedBy).not.toBe("startsWith");
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
  test("should match query param using endsWith strategy", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    await page.goto(
      "/api/test-string-match?strategy=endsWith&email=john@company.com",
    );

    const response = await page.textContent("body");
    const data = JSON.parse(response || "{}");

    expect(data.matchedBy).toBe("endsWith");
    expect(data.users).toHaveLength(2);
    expect(data.users[0].email).toBe("john@company.com");
    expect(data.users[1].email).toBe("jane@company.com");
  });

  test("should NOT match when query param doesn't end with suffix", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    await page.goto(
      "/api/test-string-match?strategy=endsWith&email=john@example.com",
    );

    const response = await page.textContent("body");
    const data = JSON.parse(response || "{}");

    expect(data.matchedBy).not.toBe("endsWith");
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
  test("should match header using equals strategy", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    await page.goto("/api/test-string-match?strategy=equals&exact=exact-value");

    const response = await page.textContent("body");
    const data = JSON.parse(response || "{}");

    expect(data.matchedBy).toBe("equals");
    expect(data.status).toBe("ok");
    expect(data.message).toBe("Exact match successful");
  });

  test("should NOT match when header value is not exact", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    await page.goto(
      "/api/test-string-match?strategy=equals&exact=exact-value-plus",
    );

    const response = await page.textContent("body");
    const data = JSON.parse(response || "{}");

    expect(data.matchedBy).not.toBe("equals");
  });

  /**
   * Test 5: Backward Compatibility
   *
   * Verify that existing scenarios with plain string matching still work.
   * This ensures our changes are backward compatible.
   */
  test("should maintain backward compatibility with plain string matching", async ({
    page,
    switchScenario,
  }) => {
    // Use existing premiumUser scenario (uses plain string matching)
    await switchScenario(page, "premiumUser");

    await page.goto("/?tier=premium");

    // Should still work with exact string match
    const firstProduct = page.locator("article").first();
    await expect(firstProduct.getByText("£99.99")).toBeVisible();
  });
});
