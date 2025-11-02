import { test, expect } from '@playwright/test';
import { switchScenario } from '@scenarist/playwright-helpers';

/**
 * Shopping Cart - Phase 3
 *
 * Tests stateful mock functionality:
 * - State capture (adding items to cart)
 * - State injection (displaying cart contents)
 * - State persistence across requests
 * - Test isolation (independent cart per test ID)
 */

test.describe('Shopping Cart - Stateful Mocks', () => {
  test('add product to cart shows item count', async ({ page }) => {
    await switchScenario(page, 'cartWithState', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    // Start on products page
    await page.goto('/');

    // Cart should start empty
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText('0');

    // Add first product to cart
    await page.click('[data-testid="add-to-cart-1"]');

    // Cart count should update to 1
    await expect(cartCount).toHaveText('1');
  });

  test('add multiple products accumulates cart', async ({ page }) => {
    await switchScenario(page, 'cartWithState', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    await page.goto('/');

    // Add three different products
    await page.click('[data-testid="add-to-cart-1"]');
    await page.click('[data-testid="add-to-cart-2"]');
    await page.click('[data-testid="add-to-cart-3"]');

    // Cart count should show 3
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText('3');
  });

  test('cart displays correct products and quantities', async ({ page }) => {
    await switchScenario(page, 'cartWithState', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    await page.goto('/');

    // Add first product twice
    await page.click('[data-testid="add-to-cart-1"]');
    await page.click('[data-testid="add-to-cart-1"]');

    // Add second product once
    await page.click('[data-testid="add-to-cart-2"]');

    // Navigate to cart page
    await page.goto('/cart');

    // Check cart items are displayed
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(2); // Two unique products

    // Check first product quantity
    const firstItem = cartItems.first();
    await expect(firstItem.locator('[data-testid="cart-item-quantity"]')).toHaveText('2');

    // Check second product quantity
    const secondItem = cartItems.nth(1);
    await expect(secondItem.locator('[data-testid="cart-item-quantity"]')).toHaveText('1');
  });

  test('cart persists across page navigation', async ({ page }) => {
    await switchScenario(page, 'cartWithState', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    await page.goto('/');

    // Add items to cart
    await page.click('[data-testid="add-to-cart-1"]');
    await page.click('[data-testid="add-to-cart-2"]');

    // Navigate to cart page
    await page.goto('/cart');
    const cartItemsOnCartPage = page.locator('[data-testid="cart-item"]');
    await expect(cartItemsOnCartPage).toHaveCount(2);

    // Navigate back to products
    await page.goto('/');

    // Cart count should still show 2
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText('2');

    // Navigate to cart again
    await page.goto('/cart');

    // Cart items should still be there
    await expect(cartItemsOnCartPage).toHaveCount(2);
  });
});
