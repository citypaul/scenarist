/**
 * String Matching Strategies - ATDD Acceptance Tests
 *
 * These tests verify that all string matching strategies work end-to-end:
 * - contains: Substring matching
 * - startsWith: Prefix matching
 * - endsWith: Suffix matching
 * - equals: Explicit exact matching
 *
 * **Expected Status: RED (FAILING)**
 * These tests will fail until Phase 2 implementation is complete.
 *
 * **Why they will fail:**
 * 1. MatchValueSchema doesn't support { contains, startsWith, endsWith, equals }
 * 2. Scenario registration will throw schema validation error
 * 3. String matching functions don't exist yet
 *
 * **When they should pass:**
 * After implementing:
 * - Extended MatchValueSchema
 * - matchesContains(), matchesStartsWith(), matchesEndsWith(), matchesEquals()
 * - Integration with response-selector
 */

import { test, expect } from "./fixtures";

test.describe("String Matching Strategies - ATDD", () => {
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
    // Switch to string matching scenario
    await switchScenario(page, "stringMatching");

    // Navigate with campaign header containing 'premium'
    await page.goto(
      "/string-matching?strategy=contains&campaign=summer-premium-sale",
    );

    // Verify premium products are returned
    await expect(page.getByText("Matched By: contains")).toBeVisible();
    await expect(page.getByText("£99.99")).toBeVisible(); // Premium price
    await expect(page.getByText("Tier: premium").first()).toBeVisible();

    // Verify it's the contains mock, not the fallback
    const rawResponse = page.locator("details summary");
    await rawResponse.click();
    await expect(page.getByText('"matchedBy": "contains"')).toBeVisible();
  });

  test("should NOT match when header doesn't contain substring", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    // Navigate with campaign header NOT containing 'premium'
    await page.goto(
      "/string-matching?strategy=contains&campaign=standard-sale",
    );

    // Should fall back to standard products (no match)
    await expect(page.getByText("Matched By: fallback")).toBeVisible();
    await expect(page.getByText("Tier: standard").first()).toBeVisible();
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

    // Navigate with API key starting with 'sk_'
    await page.goto(
      "/string-matching?strategy=startsWith&apiKey=sk_test_12345",
    );

    // Verify valid API key response
    await expect(page.getByText("Matched By: startsWith")).toBeVisible();
    await expect(page.getByText("Valid: ✅ Yes")).toBeVisible();
    await expect(page.getByText("Key Type: secret")).toBeVisible();
  });

  test("should NOT match when header doesn't start with prefix", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    // Navigate with API key NOT starting with 'sk_'
    await page.goto(
      "/string-matching?strategy=startsWith&apiKey=pk_test_12345",
    );

    // Should not see the startsWith match (no fallback defined for this URL)
    await expect(page.getByText("Matched By: startsWith")).not.toBeVisible();
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

    // Navigate with email query param ending with '@company.com'
    await page.goto(
      "/string-matching?strategy=endsWith&email=john@company.com",
    );

    // Verify company users are returned
    await expect(page.getByText("Matched By: endsWith")).toBeVisible();
    await expect(
      page.getByText("john@company.com", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("jane@company.com", { exact: true }).first(),
    ).toBeVisible();
  });

  test("should NOT match when query param doesn't end with suffix", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    // Navigate with email NOT ending with '@company.com'
    await page.goto(
      "/string-matching?strategy=endsWith&email=john@example.com",
    );

    // Should not see the endsWith match
    await expect(page.getByText("Matched By: endsWith")).not.toBeVisible();
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

    // Navigate with exact header value
    await page.goto("/string-matching?strategy=equals&exact=exact-value");

    // Verify exact match response
    await expect(page.getByText("Matched By: equals")).toBeVisible();
    await expect(page.getByText("Status: ok")).toBeVisible();
    await expect(
      page.getByText("Exact match successful").first(),
    ).toBeVisible();
  });

  test("should NOT match when header value is not exact", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "stringMatching");

    // Navigate with non-exact header value
    await page.goto("/string-matching?strategy=equals&exact=exact-value-plus");

    // Should not see the equals match
    await expect(page.getByText("Matched By: equals")).not.toBeVisible();
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

    await page.goto("/products?tier=premium");

    // Should still work with exact string match
    await expect(page.getByText("£99.99")).toBeVisible();
  });
});
