import { expect, test } from '@playwright/test';

/**
 * Landing Page Tests
 *
 * Verifies the landing page renders correctly and key features work:
 * - Page loads with correct content
 * - Install command copy functionality
 * - Navigation to docs
 */

test.describe('Landing Page', () => {
  test('renders with correct headline and content', async ({ page }) => {
    await page.goto('/');

    // Verify headline
    await expect(page.getByRole('heading', { name: /Test Reality/i })).toBeVisible();

    // Verify install command is visible
    await expect(page.getByText(/npm install scenarist/i)).toBeVisible();

    // Verify tagline is visible
    await expect(page.getByText(/Playwright tests that hit your real server/i)).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Scenarist/i);
  });

  test('copy install command works', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    const copyButton = page.locator('#copy-install');
    await copyButton.click();

    // Verify button has the copied class (which shows the checkmark)
    await expect(copyButton).toHaveClass(/copied/);

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('npm install scenarist');
  });

  test('docs link navigates to documentation', async ({ page }) => {
    await page.goto('/');

    // Click the Docs link in navigation (use exact match to avoid "Read the Docs" link)
    await page.getByRole('link', { name: 'Docs', exact: true }).click();

    // Should navigate to quick-start page
    await expect(page).toHaveURL(/getting-started\/quick-start/);

    // Verify we're on the docs page (Starlight layout)
    await expect(page.getByRole('heading', { name: /Quick Start/i })).toBeVisible();
  });
});
