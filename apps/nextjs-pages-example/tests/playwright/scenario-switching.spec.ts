/**
 * Scenario Switching Tests - Verbose Version (Phase 1a)
 *
 * This test demonstrates scenario switching WITHOUT helpers.
 * It's intentionally verbose to show the pain points that helpers will solve.
 *
 * RED Phase: This test will fail until we implement:
 * 1. Scenarist setup (lib/scenarist.ts)
 * 2. Scenario definitions (lib/scenarios.ts)
 * 3. Scenario endpoint (pages/api/__scenario__.ts)
 * 4. MSW server initialization
 */

import { test, expect } from '@scenarist/playwright-helpers';

test('can switch to premium scenario manually', async ({ page }) => {
  // VERBOSE: Manually construct test ID
  const testId = `test-premium-${Date.now()}`;

  // VERBOSE: Manually call scenario endpoint
  const response = await page.request.post('http://localhost:3000/api/__scenario__', {
    headers: { 'x-test-id': testId },
    data: { scenario: 'premiumUser' },
  });

  // Verify scenario switch succeeded
  expect(response.status()).toBe(200);

  // VERBOSE: Manually set test ID header for all subsequent requests
  await page.setExtraHTTPHeaders({ 'x-test-id': testId });

  // Navigate to home page
  await page.goto('/');

  // Verify page loaded successfully
  await expect(page).toHaveTitle(/Scenarist E-commerce Example/);

  // Verify main heading is visible
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
});

test('can switch to premium scenario using helper (Phase 1b)', async ({ page, switchScenario }) => {
  // Clean fixture API - baseURL and endpoint from config
  await switchScenario(page, 'premiumUser');

  // Navigate to home page
  await page.goto('/');

  // Verify page loaded successfully
  await expect(page).toHaveTitle(/Scenarist E-commerce Example/);

  // Verify main heading is visible
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
});
