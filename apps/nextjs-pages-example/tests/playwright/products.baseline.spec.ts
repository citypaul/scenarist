import { test, expect } from '@playwright/test';

/**
 * Products Page - Baseline Tests (WITHOUT Scenarist)
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
 * - Value comparison (benchmark "without Scenarist")
 * - Prove json-server setup works
 * - Document limitations of traditional approach
 *
 * CI STRATEGY:
 * - Run in SEPARATE CI job: pnpm test:e2e:baseline
 * - Separate Playwright project prevents interference with Scenarist tests
 * - MSW global setup disabled for baseline project
 */

test.describe('Products Page - Baseline (without Scenarist)', () => {
  test('products display with json-server (basic functionality only)', async ({ page }) => {
    // REQUIRES: json-server running on port 3001 (pnpm fake-api)
    // This test hits real json-server (NO Scenarist mocking)

    // Navigate to products page (will hit real json-server)
    await page.goto('/');

    // Verify products are displayed
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-category"]')).toBeVisible();

    // Verify tier selector is visible
    await expect(page.locator('text=Current Tier:')).toBeVisible();

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

    // Select premium tier (sets x-user-tier header)
    await page.click('button:has-text("Premium")');

    // Get the first product price
    const firstPrice = await page.locator('[data-testid="product-price"]').first().textContent();

    // We can't assert a specific price because json-server returns static data
    // The tier selection has NO EFFECT without Scenarist request matching
    // This is the key limitation we're demonstrating
    expect(firstPrice).toBeTruthy(); // Just verify price exists
  });

  test('demonstrates limitation: cannot test standard pricing scenario', async ({ page }) => {
    // Same limitation as above - no scenario switching
    // This is the pain point Scenarist solves

    // With Scenarist: await scenarist.switchScenario('standardUser')
    // Without Scenarist: ❌ Not possible

    await page.goto('/');

    // Select standard tier (sets x-user-tier header)
    await page.click('button:has-text("Standard")');

    // Get the first product price
    const firstPrice = await page.locator('[data-testid="product-price"]').first().textContent();

    // Same limitation: json-server ignores the tier header
    // Static data for all requests - no control over scenarios
    expect(firstPrice).toBeTruthy(); // Just verify price exists
  });
});
