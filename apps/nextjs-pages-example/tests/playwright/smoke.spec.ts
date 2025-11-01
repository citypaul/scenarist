import { test, expect } from '@playwright/test';

/**
 * Smoke test - Verify basic app functionality
 *
 * ⚠️ Phase 0 TDD Exception: This test passed immediately because we scaffolded
 * the basic page structure before writing the test. This is acceptable for
 * Phase 0 (infrastructure setup/scaffolding), but violates strict TDD principles.
 *
 * From Phase 1 onward: STRICT TDD (RED → GREEN → REFACTOR) - no exceptions.
 *
 * NOTE: This smoke test will be replaced by comprehensive behavior-driven tests
 * in Phase 1 when implementing the product catalog feature.
 *
 * This test verifies:
 * 1. The app loads successfully
 * 2. The title contains expected text
 * 3. The main heading is visible
 * 4. Test infrastructure (Playwright + Next.js) works correctly
 */

test('app loads and displays expected content', async ({ page }) => {
  await page.goto('/');

  // Verify title
  await expect(page).toHaveTitle(/Scenarist E-commerce Example/);

  // Verify main heading is visible
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText('Scenarist E-commerce Example');

  // Verify placeholder text
  await expect(page.getByText('Product catalog coming soon...')).toBeVisible();
});
