import { test, expect } from '@playwright/test';
import { switchScenario } from '@scenarist/playwright-helpers';

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
 */

test.describe('Products Page - Request Matching (with Scenarist)', () => {
  test('premium user sees premium pricing', async ({ page }) => {
    // Switch to premium user scenario
    await switchScenario(page, 'premiumUser', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    // Navigate to products page
    await page.goto('/');

    // Verify premium pricing is displayed (£99.99 for first product)
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toContainText('£99.99');
  });

  test('standard user sees standard pricing', async ({ page }) => {
    // Switch to standard user scenario
    await switchScenario(page, 'standardUser', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    // Navigate to products page
    await page.goto('/');

    // Verify standard pricing is displayed (£149.99 for first product)
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct.locator('[data-testid="product-price"]')).toContainText('£149.99');
  });
});
