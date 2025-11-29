import { test, expect } from "./fixtures";

/**
 * Regex Matching Tests - Server-Side Pattern Matching
 *
 * This test file validates regex pattern matching for SERVER-SIDE MSW interception:
 * - Match x-campaign header against regex pattern (server → API fetch)
 * - Case-insensitive matching with flags
 * - Multiple pattern alternatives (premium|vip)
 * - Fallback to default when pattern doesn't match
 *
 * Use Case (Server-Side):
 * Marketing campaign tracking - server extracts campaign from query param,
 * adds as header to external API call. MSW intercepts that fetch and matches
 * against regex pattern.
 *
 * Flow:
 * 1. Browser → /products?campaign=summer-premium-sale
 * 2. API Route extracts campaign, adds to fetch headers
 * 3. API Route → fetch('http://localhost:3001/products', { headers: { 'x-campaign': 'summer-premium-sale' } })
 * 4. MSW intercepts, matches x-campaign against /premium|vip/i
 * 5. Returns premium pricing
 *
 * ATDD Approach:
 * These tests will FAIL until regex matching is implemented in core.
 * This is intentional - we're driving implementation from the outside in.
 */

test.describe("Regex Pattern Matching (Server-Side)", () => {
  test('should match premium pricing when campaign contains "premium"', async ({
    page,
    switchScenario,
  }) => {
    // ATDD: This test drives regex matching implementation
    await switchScenario(page, "campaignRegex");

    // Navigate with campaign query param
    // API route will extract this and add as x-campaign header to the fetch
    await page.goto("/products?campaign=summer-premium-sale");

    // Expected: Premium pricing (regex matched on x-campaign header in server-side fetch)
    // Pattern: /premium|vip/i should match "premium" in "summer-premium-sale"
    await expect(page.getByText("£99.99")).toBeVisible(); // Premium price for Product A

    // Verify it's using premium tier (not standard)
    const firstProduct = page.locator("div.border").first();
    await expect(
      firstProduct.getByText("premium", { exact: false }),
    ).toBeVisible();
  });

  test('should match premium pricing when campaign contains "vip" (case insensitive)', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "campaignRegex");

    // Test case-insensitive flag: "VIP" should match /premium|vip/i
    await page.goto("/products?campaign=early-VIP-access");

    // Expected: Premium pricing (regex matched "VIP" with 'i' flag)
    await expect(page.getByText("£99.99")).toBeVisible();

    const firstProduct = page.locator("div.border").first();
    await expect(
      firstProduct.getByText("premium", { exact: false }),
    ).toBeVisible();
  });

  test("should fallback to standard pricing when campaign does NOT match pattern", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "campaignRegex");

    // Campaign that does NOT match /premium|vip/i
    await page.goto("/products?campaign=summer-sale");

    // Expected: Standard pricing (no regex match, fallback to default scenario)
    await expect(page.getByText("£149.99")).toBeVisible(); // Standard price for Product A

    const firstProduct = page.locator("div.border").first();
    await expect(
      firstProduct.getByText("standard", { exact: false }),
    ).toBeVisible();
  });

  test("should fallback to standard pricing when campaign param is missing", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "campaignRegex");

    // No campaign param - x-campaign header won't be added to fetch
    await page.goto("/products");

    // Expected: Standard pricing (no x-campaign header = no match, fallback to default)
    await expect(page.getByText("£149.99")).toBeVisible();

    const firstProduct = page.locator("div.border").first();
    await expect(
      firstProduct.getByText("standard", { exact: false }),
    ).toBeVisible();
  });

  test("should demonstrate partial match within campaign string", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "campaignRegex");

    // Pattern should match "premium" anywhere in the campaign string
    await page.goto("/products?campaign=partners-premium-tier");

    // Expected: Premium pricing (regex finds "premium" in middle of string)
    await expect(page.getByText("£99.99")).toBeVisible();

    const firstProduct = page.locator("div.border").first();
    await expect(
      firstProduct.getByText("premium", { exact: false }),
    ).toBeVisible();
  });
});

/**
 * EXPECTED TEST RESULTS (after implementation):
 *
 * ✅ Match "premium" in path: /premium/checkout
 * ✅ Match "vip" in path: /VIP/members (case-insensitive)
 * ✅ Match "premium" in query: ?source=premium-partners
 * ✅ Fallback when no match: /standard/checkout → standard pricing
 * ✅ Fallback when header missing: no referer → standard pricing
 *
 * CURRENT STATUS:
 * ❌ All tests will FAIL - regex matching not yet implemented
 * This is EXPECTED and CORRECT for ATDD approach.
 *
 * Next Steps:
 * 1. Run tests to confirm RED phase
 * 2. Implement SerializedRegexSchema in core
 * 3. Implement matchesRegex() domain logic
 * 4. Integrate with ResponseSelector
 * 5. Tests turn GREEN ✅
 */
