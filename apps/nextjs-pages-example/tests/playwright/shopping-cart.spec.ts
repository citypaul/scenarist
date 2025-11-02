import { test, expect } from '@scenarist/playwright-helpers';

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
  test('add product to cart shows item count', async ({ page, switchScenario }) => {
    await switchScenario(page, 'cartWithState', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    // Start on products page
    await page.goto('/');

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');

    // Cart should start empty
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText('0');

    // Wait for add-to-cart button to be visible and clickable
    const addButton = page.locator('[data-testid="add-to-cart-1"]');
    await expect(addButton).toBeVisible();

    // Add first product to cart
    await addButton.click();

    // Wait a bit for state to propagate
    await page.waitForTimeout(100);

    // Cart count should update to 1
    await expect(cartCount).toHaveText('1');
  });

  test('add multiple products accumulates cart', async ({ page, switchScenario }) => {
    await switchScenario(page, 'cartWithState', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    await page.goto('/');

    // Add three different products
    await page.click('[data-testid="add-to-cart-1"]');
    await page.waitForTimeout(100); // Wait for state to propagate
    await page.click('[data-testid="add-to-cart-2"]');
    await page.waitForTimeout(100); // Wait for state to propagate
    await page.click('[data-testid="add-to-cart-3"]');
    await page.waitForTimeout(100); // Wait for state to propagate

    // Cart count should show 3
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText('3');
  });

  test('cart displays correct products and quantities', async ({ page, switchScenario }) => {
    await switchScenario(page, 'cartWithState', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    await page.goto('/');

    // Add first product twice
    await page.click('[data-testid="add-to-cart-1"]');
    await page.waitForTimeout(100); // Wait for state to propagate
    await page.click('[data-testid="add-to-cart-1"]');
    await page.waitForTimeout(100); // Wait for state to propagate

    // Add second product once
    await page.click('[data-testid="add-to-cart-2"]');
    await page.waitForTimeout(100); // Wait for state to propagate

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

  test('cart persists across page navigation', async ({ page, switchScenario }) => {
    await switchScenario(page, 'cartWithState', {
      baseURL: 'http://localhost:3000',
      endpoint: '/api/__scenario__',
    });

    await page.goto('/');

    // Add items to cart
    await page.click('[data-testid="add-to-cart-1"]');
    await page.waitForTimeout(100); // Wait for state to propagate
    await page.click('[data-testid="add-to-cart-2"]');
    await page.waitForTimeout(100); // Wait for state to propagate

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
