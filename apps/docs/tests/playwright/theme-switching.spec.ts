import { test, expect } from '@playwright/test';

/**
 * Theme Switching Tests
 *
 * Verifies theme toggle functionality:
 * - Theme toggle works on landing page
 * - Theme persists when navigating to docs
 * - Theme persists when navigating from docs to landing
 * - Theme syncs with Starlight's theme system
 */

test.describe('Theme Switching', () => {
  test('theme toggle switches between dark and light', async ({ page }) => {
    // Set dark theme explicitly before navigation
    await page.addInitScript(() => {
      localStorage.setItem('starlight-theme', 'dark');
    });

    await page.goto('/');

    // Should start in dark mode
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Click theme toggle
    const themeToggle = page.getByLabel(/Toggle dark mode/i);
    await themeToggle.click();

    // Should now be light mode
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Toggle back to dark
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('theme persists from landing page to docs', async ({ page }) => {
    // Set dark theme explicitly before navigation
    await page.addInitScript(() => {
      localStorage.setItem('starlight-theme', 'dark');
    });

    await page.goto('/');

    // Should start in dark mode
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Toggle to light mode on landing page
    const themeToggle = page.getByLabel(/Toggle dark mode/i);
    await themeToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Navigate to docs
    await page.getByRole('link', { name: 'Docs', exact: true }).click();
    await expect(page).toHaveURL(/introduction\/quick-start/);

    // Theme should still be light in docs (Starlight)
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('theme persists from docs to landing page', async ({ page }) => {
    // Start on docs page - don't use addInitScript as it persists across navigations
    await page.goto('/introduction/quick-start');

    // Set dark theme initially via evaluate (only for this page load)
    await page.evaluate(() => localStorage.setItem('starlight-theme', 'dark'));
    await page.reload();

    // Find Starlight's theme toggle - use first() to handle multiple selects
    const starlightThemeToggle = page.locator('starlight-theme-select select').first();
    await starlightThemeToggle.selectOption('light');

    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Verify Starlight stored the theme
    const storedAfterToggle = await page.evaluate(() => localStorage.getItem('starlight-theme'));
    expect(storedAfterToggle).toBe('light');

    // Navigate to landing page by clicking the site title/logo link
    await page.getByRole('link', { name: 'Scenarist', exact: true }).click();
    await expect(page).toHaveURL('/');

    // Theme should still be light on landing page
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('theme is stored in localStorage with Starlight key', async ({ page }) => {
    // Set dark theme explicitly before navigation
    await page.addInitScript(() => {
      localStorage.setItem('starlight-theme', 'dark');
    });

    await page.goto('/');

    // Should start in dark mode
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Toggle to light mode
    const themeToggle = page.getByLabel(/Toggle dark mode/i);
    await themeToggle.click();

    // Wait for theme to change
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Check localStorage uses the correct key
    const storedTheme = await page.evaluate(() => localStorage.getItem('starlight-theme'));
    expect(storedTheme).toBe('light');
  });
});
