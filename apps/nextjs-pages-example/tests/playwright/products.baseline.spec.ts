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
 * - Scenarist is DISABLED (no mocking)
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
 * - Run in SEPARATE CI job from main tests
 * - Prevents interference with Scenarist-enabled tests
 * - Env var: SCENARIST_ENABLED=false
 */

test.describe('Products Page - Baseline (without Scenarist)', () => {
  test.skip('products display with json-server (basic functionality only)', async ({ page }) => {
    // REQUIRES: json-server running on port 3001 (npm run fake-api)
    // REQUIRES: SCENARIST_ENABLED=false environment variable

    // Navigate to products page (will hit real json-server)
    await page.goto('/');

    // Verify products are displayed
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();

    // LIMITATION: We can't test premium vs standard pricing
    // json-server returns static data - no request matching capability
    // This is what Scenarist solves!
  });

  test.skip('CANNOT test premium pricing scenario (limitation)', async ({ page }) => {
    // This test demonstrates what's IMPOSSIBLE without Scenarist

    // There's no way to switch scenarios with json-server
    // It returns the same static data for all requests
    // No `x-user-tier` header matching
    // No dynamic responses based on request content

    // With Scenarist: await scenarist.switchScenario('premiumUser')
    // Without Scenarist: ❌ Not possible

    await page.goto('/');

    // We don't even know what pricing we'll get - it's static!
    // Could be premium, could be standard, depends on db.json
  });

  test.skip('CANNOT test standard pricing scenario (limitation)', async ({ page }) => {
    // Same limitation as above - no scenario switching
    // This is the pain point Scenarist solves

    // With Scenarist: await scenarist.switchScenario('standardUser')
    // Without Scenarist: ❌ Not possible

    await page.goto('/');

    // Static data from json-server - no control over scenarios
  });
});
