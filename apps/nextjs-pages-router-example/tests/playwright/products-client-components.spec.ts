import { test, expect } from './fixtures';

/**
 * Products Page - Request Matching with Scenarist
 *
 * These tests demonstrate Scenarist's request matching feature by testing
 * tier-based pricing (premium vs standard users see different prices).
 *
 * ARCHITECTURE:
 * - json-server runs on port 3001 (real backend, always running)
 * - Next.js app makes requests to localhost:3001
 * - Scenarist MSW intercepts and mocks those requests
 * - This proves Scenarist can override real backends
 *
 * VALUE:
 * - Fast (in-memory mocks, no real HTTP)
 * - Flexible (test any scenario via request matching)
 * - Reliable (no external dependency timing issues)
 * - Comprehensive (premium/standard/error scenarios)
 *
 * Uses Playwright best practices:
 * - Semantic selectors (getByRole, getByText)
 * - Auto-waiting instead of arbitrary timeouts
 * - Accessible markup testing
 * - Fixture API for clean configuration (no repeated baseURL/endpoint)
 */

test.describe('Products Page - Request Matching (with Scenarist)', () => {
  test('premium user sees premium pricing', async ({ page, switchScenario }) => {
    // Switch to premium user scenario (baseURL and endpoint from config)
    await switchScenario(page, 'premiumUser');

    // Navigate to products page
    await page.goto('/');

    // Click premium tier button to switch pricing
    await page.getByRole('button', { name: 'Select premium tier' }).click();

    // Verify premium pricing is displayed (£99.99 for first product)
    const firstProduct = page.getByRole('article').first();
    await expect(firstProduct.getByText('£99.99')).toBeVisible();
  });

  test('standard user sees standard pricing', async ({ page, switchScenario }) => {
    // Switch to standard user scenario (baseURL and endpoint from config)
    await switchScenario(page, 'standardUser');

    // Navigate to products page
    await page.goto('/');

    // Verify standard pricing is displayed (£29.99 for first product - Product A)
    const firstProduct = page.getByRole('article').first();
    await expect(firstProduct.getByText('£29.99')).toBeVisible();
  });
});
