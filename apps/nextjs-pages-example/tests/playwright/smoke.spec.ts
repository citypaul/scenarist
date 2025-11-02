import { test, expect } from '@playwright/test';

/**
 * Smoke test - Verify basic app functionality
 *
 * Updated for Phase 2: Now verifies the product catalog is working.
 *
 * This test verifies:
 * 1. The app loads successfully
 * 2. The title contains expected text
 * 3. The main heading is visible
 * 4. Product catalog displays (at least one product card)
 * 5. Test infrastructure (Playwright + Next.js) works correctly
 */

test('app loads and displays expected content', async ({ page }) => {
  await page.goto('/');

  // Verify title
  await expect(page).toHaveTitle(/Scenarist E-commerce Example/);

  // Verify main heading is visible
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText('Scenarist E-commerce Example');

  // Verify product catalog is displayed (at least one product card)
  await expect(page.getByRole('article').first()).toBeVisible();
});
