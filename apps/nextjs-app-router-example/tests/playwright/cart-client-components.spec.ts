import { test, expect } from './fixtures';

/**
 * Cart - Client Components
 *
 * Tests stateful mock functionality:
 * - State capture (adding items to cart)
 * - State injection (displaying cart contents)
 * - State persistence across requests
 * - Test isolation (independent cart per test ID)
 *
 * Uses Playwright best practices:
 * - Semantic selectors (getByRole, getByLabel)
 * - Auto-waiting instead of arbitrary timeouts
 * - Accessible markup testing
 */

test.describe('Cart - Client Components', () => {
  test('add product to cart shows item count', async ({ page, switchScenario }) => {
    await switchScenario(page, 'cartWithState');

    // Start on products page
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByRole('article').first()).toBeVisible();

    // Cart should start empty
    const cartCount = page.getByLabel('Cart item count');
    await expect(cartCount).toHaveText('0');

    // Add first product to cart
    const addButton = page.getByRole('button', { name: /Add .* to cart/ }).first();
    await addButton.click();

    // Cart count should update to 1 (Playwright auto-waits)
    await expect(cartCount).toHaveText('1');
  });

  test('add multiple products accumulates cart', async ({ page, switchScenario }) => {
    await switchScenario(page, 'cartWithState');

    await page.goto('/');

    // Get all add-to-cart buttons
    const addButtons = page.getByRole('button', { name: /Add .* to cart/ });

    // Add three different products
    await addButtons.nth(0).click();
    await addButtons.nth(1).click();
    await addButtons.nth(2).click();

    // Cart count should show 3 (Playwright auto-waits for update)
    const cartCount = page.getByLabel('Cart item count');
    await expect(cartCount).toHaveText('3');
  });

  test('cart displays correct products and quantities', async ({ page, switchScenario }) => {
    await switchScenario(page, 'cartWithState');

    await page.goto('/');

    // Get all add-to-cart buttons
    const addButtons = page.getByRole('button', { name: /Add .* to cart/ });

    // Add first product twice
    await addButtons.nth(0).click();
    await addButtons.nth(0).click();

    // Add second product once
    await addButtons.nth(1).click();

    // Navigate to cart page
    await page.goto('/cart');

    // Check cart items are displayed
    const cartList = page.getByRole('list', { name: 'Shopping cart items' });
    const cartItems = cartList.getByRole('listitem');
    await expect(cartItems).toHaveCount(2); // Two unique products

    // Check quantities using accessible output elements
    const quantities = page.getByLabel('Item quantity');
    await expect(quantities.nth(0)).toHaveText('2');
    await expect(quantities.nth(1)).toHaveText('1');
  });

  test('cart persists across page navigation', async ({ page, switchScenario }) => {
    await switchScenario(page, 'cartWithState');

    await page.goto('/');

    // Get all add-to-cart buttons
    const addButtons = page.getByRole('button', { name: /Add .* to cart/ });

    // Add items to cart
    await addButtons.nth(0).click();
    await addButtons.nth(1).click();

    // Navigate to cart page
    await page.goto('/cart');
    const cartList = page.getByRole('list', { name: 'Shopping cart items' });
    const cartItems = cartList.getByRole('listitem');
    await expect(cartItems).toHaveCount(2);

    // Navigate back to products
    await page.goto('/');

    // Cart count should still show 2 (Playwright auto-waits)
    const cartCount = page.getByLabel('Cart item count');
    await expect(cartCount).toHaveText('2');

    // Navigate to cart again
    await page.goto('/cart');

    // Cart items should still be there
    const cartListAgain = page.getByRole('list', { name: 'Shopping cart items' });
    const cartItemsAgain = cartListAgain.getByRole('listitem');
    await expect(cartItemsAgain).toHaveCount(2);
  });
});
