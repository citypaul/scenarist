import { test, expect } from '@playwright/test';

/**
 * Products Page - Comparison Tests (WITHOUT Scenarist)
 *
 * These tests use json-server directly to demonstrate the traditional approach
 * and show what you LOSE without Scenarist.
 *
 * ARCHITECTURE:
 * - json-server runs on port 3001 (real backend)
 * - Next.js app makes requests to localhost:3001
 * - Scenarist MSW is DISABLED (separate Playwright project)
 * - Tests hit real json-server endpoints
 *
 * LIMITATIONS (what you lose without Scenarist):
 * ❌ Slower (real HTTP calls to json-server)
 * ❌ Can't test scenarios (premium vs standard pricing)
 * ❌ Static data only (no sequences, no stateful behavior)
 * ❌ Requires external process running (json-server)
 * ❌ Port conflicts possible
 * ❌ Timing issues (network calls, external dependency)
 * ❌ Can't test error scenarios easily
 *
 * PURPOSE:
 * - Compare traditional testing vs Scenarist-based testing
 * - Prove json-server setup works
 * - Document limitations of traditional approach
 * - Demonstrate Scenarist's value proposition
 *
 * CI STRATEGY:
 * - Run as step in main CI job: pnpm test:e2e:comparison
 * - Separate Playwright project prevents interference with Scenarist tests
 * - MSW global setup disabled for comparison project
 */

test.describe('Products Page - Comparison (without Scenarist)', () => {
  test('products display with json-server (basic functionality only)', async ({ page }) => {
    // REQUIRES: json-server running on port 3001 (pnpm fake-api)
    // This test hits real json-server (NO Scenarist mocking)

    // Navigate to products page (will hit real json-server)
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Verify products are displayed
    const productCards = page.getByRole('article');
    await expect(productCards.first()).toBeVisible();

    // Verify product fields (using semantic selectors)
    const firstProduct = productCards.first();
    await expect(firstProduct.getByRole('heading', { level: 3 })).toBeVisible();
    await expect(firstProduct.getByText(/£\d+\.\d{2}/)).toBeVisible();

    // Note: json-server data doesn't include category field
    // Only Scenarist mocks add category - this demonstrates another difference!

    // LIMITATION: We can't test premium vs standard pricing
    // json-server returns static data - no request matching capability
    // This is what Scenarist solves!
  });

  test('demonstrates limitation: cannot test premium pricing scenario', async ({ page }) => {
    // This test demonstrates what's IMPOSSIBLE without Scenarist

    // There's no way to switch scenarios with json-server
    // It returns the same static data for all requests
    // No `x-user-tier` header matching
    // No dynamic responses based on request content

    // With Scenarist: await scenarist.switchScenario('premiumUser')
    // Without Scenarist: ❌ Not possible

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify we have products
    await expect(page.getByRole('article').first()).toBeVisible();

    // Get the first product price (using semantic selector)
    const firstPrice = await page.getByRole('article').first().getByText(/£\d+\.\d{2}/).textContent();

    // We can't assert a specific price because json-server returns static data
    // Tier switching has NO EFFECT without Scenarist request matching
    // This is the key limitation we're demonstrating
    expect(firstPrice).toBeTruthy(); // Just verify price exists
  });

  test('demonstrates limitation: cannot test standard pricing scenario', async ({ page }) => {
    // Same limitation as above - no scenario switching
    // This is the pain point Scenarist solves

    // With Scenarist: await scenarist.switchScenario('standardUser')
    // Without Scenarist: ❌ Not possible

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify we have products
    await expect(page.getByRole('article').first()).toBeVisible();

    // Get the first product price (using semantic selector)
    const firstPrice = await page.getByRole('article').first().getByText(/£\d+\.\d{2}/).textContent();

    // Same limitation: json-server ignores tier headers
    // Static data for all requests - no control over scenarios
    expect(firstPrice).toBeTruthy(); // Just verify price exists
  });
});
