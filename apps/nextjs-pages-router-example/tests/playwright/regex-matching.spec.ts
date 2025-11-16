import { test, expect } from './fixtures';

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
 * Marketing campaign tracking - getServerSideProps extracts campaign from query param,
 * adds as header to external API call. MSW intercepts that fetch and matches
 * against regex pattern.
 *
 * Flow:
 * 1. Browser → /?campaign=summer-premium-sale
 * 2. getServerSideProps extracts campaign, adds to fetch headers
 * 3. getServerSideProps → fetch('http://localhost:3001/products', { headers: { 'x-campaign': 'summer-premium-sale' } })
 * 4. MSW intercepts, matches x-campaign against /premium|vip/i
 * 5. Returns premium pricing
 */

test.describe('Regex Pattern Matching (Server-Side)', () => {
  test('should match premium pricing when campaign contains "premium"', async ({
    page,
    switchScenario,
  }) => {
    // Switch to campaignRegex scenario
    await switchScenario(page, 'campaignRegex');

    // Navigate with campaign query param
    // getServerSideProps will extract this and add as x-campaign header to the fetch
    await page.goto('/?campaign=summer-premium-sale');

    // Expected: Premium pricing (regex matched on x-campaign header in server-side fetch)
    // Pattern: /premium|vip/i should match "premium" in "summer-premium-sale"
    await expect(page.getByText('£99.99')).toBeVisible(); // Premium price for Product A

    // Verify it's using premium tier (not standard)
    const firstProduct = page.locator('article').first();
    await expect(firstProduct.getByText('premium', { exact: false })).toBeVisible();

    // Verify SSR (no loading state)
    await expect(page.getByText('Loading products...')).not.toBeVisible();
  });

  test('should match premium pricing when campaign contains "vip" (case insensitive)', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'campaignRegex');

    // Test case-insensitive flag: "VIP" should match /premium|vip/i
    await page.goto('/?campaign=early-VIP-access');

    // Expected: Premium pricing (regex matched "VIP" with 'i' flag)
    await expect(page.getByText('£99.99')).toBeVisible();

    const firstProduct = page.locator('article').first();
    await expect(firstProduct.getByText('premium', { exact: false })).toBeVisible();
  });

  test('should fallback to standard pricing when campaign does NOT match pattern', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'campaignRegex');

    // Campaign that does NOT match /premium|vip/i
    await page.goto('/?campaign=summer-sale');

    // Expected: Standard pricing (no regex match, fallback to default scenario)
    const firstProduct = page.locator('article').first();
    // Use locator that targets price span specifically to avoid TierSelector text
    await expect(firstProduct.locator('.text-2xl.font-bold.text-blue-600')).toHaveText('£149.99'); // Standard price for Product A
    await expect(firstProduct.getByText('standard', { exact: false })).toBeVisible();
  });

  test('should fallback to standard pricing when campaign param is missing', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'campaignRegex');

    // No campaign param - x-campaign header won't be added to fetch
    await page.goto('/');

    // Expected: Standard pricing (no x-campaign header = no match, fallback to default)
    const firstProduct = page.locator('article').first();
    // Use locator that targets price span specifically to avoid TierSelector text
    await expect(firstProduct.locator('.text-2xl.font-bold.text-blue-600')).toHaveText('£149.99');
    await expect(firstProduct.getByText('standard', { exact: false })).toBeVisible();
  });

  test('should demonstrate partial match within campaign string', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'campaignRegex');

    // Pattern should match "premium" anywhere in the campaign string
    await page.goto('/?campaign=partners-premium-tier');

    // Expected: Premium pricing (regex finds "premium" in middle of string)
    await expect(page.getByText('£99.99')).toBeVisible();

    const firstProduct = page.locator('article').first();
    await expect(firstProduct.getByText('premium', { exact: false })).toBeVisible();
  });
});

/**
 * EXPECTED TEST RESULTS:
 *
 * ✅ Match "premium" in campaign: summer-premium-sale → premium pricing
 * ✅ Match "vip" in campaign: early-VIP-access (case-insensitive) → premium pricing
 * ✅ Fallback when no match: summer-sale → standard pricing
 * ✅ Fallback when header missing: no campaign param → standard pricing
 * ✅ Partial match: partners-premium-tier → premium pricing
 *
 * These tests prove:
 * - Regex matching works with getServerSideProps
 * - Server-side MSW interception working correctly
 * - Campaign parameter extraction and header forwarding
 * - Automatic default fallback when regex doesn't match
 */
