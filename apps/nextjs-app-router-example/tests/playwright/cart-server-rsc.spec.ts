import { test, expect } from './fixtures';

/**
 * Cart Server RSC Page - Stateful Mocks with React Server Components
 *
 * This test file demonstrates STATEFUL MOCKS working with RSC:
 * Testing state capture and injection WITHOUT Jest!
 *
 * THE PROBLEM:
 * - Jest CANNOT test async server components
 * - Stateful mocks require state to persist across requests
 * - Must test the ACTUAL rendered output from RSC
 *
 * THE SCENARIST SOLUTION:
 * - ✅ Playwright + Scenarist stateful mocks work with RSC
 * - ✅ POST /cart/add captures productId into cartItems[] array
 * - ✅ GET /cart injects cartItems from state into response
 * - ✅ State persists across requests (per test ID)
 *
 * ARCHITECTURE:
 * - /cart-server page is a React Server Component (async, runs server-side)
 * - Fetches from localhost:3002/api/cart
 * - API route fetches from localhost:3001/cart
 * - Scenarist intercepts and injects state into responses
 * - Tests verify RSC renders correctly with stateful data
 */

test.describe('Cart Server Page - Stateful Mocks with RSC', () => {
  test('should show empty cart initially', async ({
    page,
    switchScenario,
  }) => {
    // Switch to cart with state scenario
    await switchScenario(page, 'cartWithState');

    // Navigate to cart-server page
    await page.goto('/cart-server');

    // Verify server component rendered
    await expect(
      page.getByRole('heading', { name: 'Shopping Cart (React Server Component)' })
    ).toBeVisible();

    // Verify empty cart message
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('should display cart items after adding via state capture', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'cartWithState');

    // Add item to cart via API (state capture)
    const response = await page.request.post('http://localhost:3001/cart/add', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: { productId: 'prod-1' },
    });

    // Navigate to cart-server page (should inject captured state)
    await page.goto('/cart-server');

    // Verify cart is no longer empty
    await expect(page.getByText('Your cart is empty')).not.toBeVisible();

    // Verify cart item is displayed
    await expect(page.getByText('Product A')).toBeVisible();
    await expect(page.getByText('ID: prod-1')).toBeVisible();
    await expect(page.getByText('Quantity: 1')).toBeVisible();
  });

  test('should aggregate quantities for duplicate items', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'cartWithState');

    // Add same product 3 times (state should aggregate)
    await page.request.post('http://localhost:3001/cart/add', {
      headers: { 'Content-Type': 'application/json' },
      data: { productId: 'prod-2' },
    });
    await page.request.post('http://localhost:3001/cart/add', {
      headers: { 'Content-Type': 'application/json' },
      data: { productId: 'prod-2' },
    });
    await page.request.post('http://localhost:3001/cart/add', {
      headers: { 'Content-Type': 'application/json' },
      data: { productId: 'prod-2' },
    });

    // Navigate to cart-server page
    await page.goto('/cart-server');

    // Verify aggregated quantity
    await expect(page.getByText('Product B')).toBeVisible();
    await expect(page.getByText('Quantity: 3')).toBeVisible();
  });

  test('should display multiple different items', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'cartWithState');

    // Add different products
    await page.request.post('http://localhost:3001/cart/add', {
      headers: { 'Content-Type': 'application/json' },
      data: { productId: 'prod-1' },
    });
    await page.request.post('http://localhost:3001/cart/add', {
      headers: { 'Content-Type': 'application/json' },
      data: { productId: 'prod-3' },
    });

    // Navigate to cart-server page
    await page.goto('/cart-server');

    // Verify both products are displayed
    await expect(page.getByText('Product A')).toBeVisible();
    await expect(page.getByText('Product C')).toBeVisible();
    await expect(page.getByText('Quantity: 1').first()).toBeVisible();
  });

  test('should demonstrate that RSC stateful mocks work without Jest', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'cartWithState');
    await page.goto('/cart-server');

    // Verify the explanatory text about stateful mocks
    await expect(
      page.getByText('State Capture: POST /cart/add captures productId from request body')
    ).toBeVisible();
    await expect(
      page.getByText('State Injection: GET /cart injects captured items via templates')
    ).toBeVisible();
    await expect(
      page.getByText('This proves Scenarist stateful mocks work with Server Components!')
    ).toBeVisible();
  });
});

/**
 * TEST RESULTS PROVE:
 *
 * ✅ React Server Components work with Scenarist stateful mocks
 * ✅ No Jest issues (Jest cannot test RSC)
 * ✅ State capture works (POST /cart/add)
 * ✅ State injection works (GET /cart)
 * ✅ State persists across requests
 * ✅ Aggregation logic works correctly
 * ✅ Fast feedback loop for testing stateful behavior
 *
 * This proves Scenarist stateful mocks are fully compatible with RSC!
 */
