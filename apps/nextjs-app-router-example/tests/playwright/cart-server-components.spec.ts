import { test, expect } from './fixtures';

/**
 * Cart Server Components Page - Stateful Mocks with React Server Components
 *
 * This test file demonstrates STATEFUL MOCKS working with React Server Components:
 * Testing state capture and injection WITHOUT Jest!
 *
 * THE PROBLEM:
 * - Jest CANNOT test async server components
 * - Stateful mocks require state to persist across requests
 * - Must test the ACTUAL rendered output from React Server Components
 *
 * THE SCENARIST SOLUTION:
 * - ✅ Playwright + Scenarist stateful mocks work with React Server Components
 * - ✅ POST /cart/add captures productId into cartItems[] array
 * - ✅ GET /cart injects cartItems from state into response
 * - ✅ State persists across requests (per test ID)
 *
 * ARCHITECTURE:
 * - /cart-server page is a React Server Component (async, runs server-side)
 * - Fetches from localhost:3002/api/cart
 * - API route fetches from localhost:3001/cart
 * - Scenarist intercepts and injects state into responses
 * - Tests verify React Server Component renders correctly with stateful data
 */

test.describe('Cart Server Page - Stateful Mocks with Server Components', () => {
  test('should show empty cart initially', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'cartWithState');
    await page.goto('/cart-server');

    // Verify server component rendered
    await expect(
      page.getByRole('heading', { name: 'Shopping Cart (React Server Component)' })
    ).toBeVisible();

    // Empty cart should show empty message
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test('should display cart item after adding product via state capture', async ({
    page,
    switchScenario,
  }) => {
    const testId = await switchScenario(page, 'cartWithState');

    // Add product through Next.js API route (not directly to json-server)
    // page.request uses a separate context, so we must explicitly include x-test-id
    const response = await page.request.post('http://localhost:3002/api/cart/add', {
      headers: {
        'Content-Type': 'application/json',
        'x-test-id': testId,
      },
      data: { productId: 'prod-1' },
    });

    if (!response.ok()) {
      const body = await response.json();
      console.log('❌ Cart add failed:', response.status(), JSON.stringify(body, null, 2));
    }

    expect(response.ok()).toBe(true);

    // Navigate to cart page - server component will fetch cart with same test ID
    await page.goto('/cart-server');

    // Should show empty cart message is gone
    await expect(page.getByText('Your cart is empty')).not.toBeVisible();

    // Should show the added product
    await expect(page.getByText('Product A')).toBeVisible();
    await expect(page.getByText('ID: prod-1')).toBeVisible();
    await expect(page.getByText('Quantity: 1')).toBeVisible();
  });

  test('should aggregate quantities when same product added multiple times', async ({
    page,
    switchScenario,
  }) => {
    const testId = await switchScenario(page, 'cartWithState');

    // Add same product 3 times
    for (let i = 0; i < 3; i++) {
      const response = await page.request.post('http://localhost:3002/api/cart/add', {
        headers: {
          'Content-Type': 'application/json',
          'x-test-id': testId,
        },
        data: { productId: 'prod-1' },
      });
      expect(response.ok()).toBe(true);
    }

    // Navigate to cart page
    await page.goto('/cart-server');

    // Should show aggregated quantity
    await expect(page.getByText('Product A')).toBeVisible();
    await expect(page.getByText('Quantity: 3')).toBeVisible();
  });

  test('should display multiple different products with correct quantities', async ({
    page,
    switchScenario,
  }) => {
    const testId = await switchScenario(page, 'cartWithState');

    // Add product A twice, product B once, product C three times
    const addRequests = [
      { productId: 'prod-1' },
      { productId: 'prod-1' },
      { productId: 'prod-2' },
      { productId: 'prod-3' },
      { productId: 'prod-3' },
      { productId: 'prod-3' },
    ];

    for (const data of addRequests) {
      const response = await page.request.post('http://localhost:3002/api/cart/add', {
        headers: {
          'Content-Type': 'application/json',
          'x-test-id': testId,
        },
        data,
      });
      expect(response.ok()).toBe(true);
    }

    // Navigate to cart page
    await page.goto('/cart-server');

    // Should show all three products with aggregated quantities
    await expect(page.getByText('Product A')).toBeVisible();
    await expect(page.getByText('ID: prod-1')).toBeVisible();

    await expect(page.getByText('Product B')).toBeVisible();
    await expect(page.getByText('ID: prod-2')).toBeVisible();

    await expect(page.getByText('Product C')).toBeVisible();
    await expect(page.getByText('ID: prod-3')).toBeVisible();

    // Verify quantities are aggregated correctly
    const productARow = page.locator('div', { has: page.getByText('ID: prod-1') });
    await expect(productARow.getByText('Quantity: 2')).toBeVisible();

    const productBRow = page.locator('div', { has: page.getByText('ID: prod-2') });
    await expect(productBRow.getByText('Quantity: 1')).toBeVisible();

    const productCRow = page.locator('div', { has: page.getByText('ID: prod-3') });
    await expect(productCRow.getByText('Quantity: 3')).toBeVisible();
  });

  test('should demonstrate that server component stateful mocks work without Jest', async ({
    page,
    switchScenario,
  }) => {
    const testId = await switchScenario(page, 'cartWithState');

    // Add a product to prove state capture works
    await page.request.post('http://localhost:3002/api/cart/add', {
      headers: {
        'Content-Type': 'application/json',
        'x-test-id': testId,
      },
      data: { productId: 'prod-1' },
    });

    await page.goto('/cart-server');

    // Verify product appears (proves state was captured and injected)
    await expect(page.getByText('Product A')).toBeVisible();

    // Verify the explanatory text is present
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
 * ✅ No Jest issues (Jest cannot test React Server Components)
 * ✅ State capture works (POST /cart/add)
 * ✅ State injection works (GET /cart)
 * ✅ State persists across requests
 * ✅ Aggregation logic works correctly
 * ✅ Fast feedback loop for testing stateful behavior
 *
 * This proves Scenarist stateful mocks are fully compatible with React Server Components!
 */
