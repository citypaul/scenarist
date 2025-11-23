/**
 * Production Build Verification Tests
 *
 * Verifies that the production build works correctly:
 * 1. App runs and serves endpoints
 * 2. Scenarist endpoints are NOT available (tree-shaken)
 * 3. Health check works
 * 4. Cart CRUD operations work with real json-server backend
 *
 * Server lifecycle managed by global-setup.ts:
 * - json-server and Next.js production server started before tests
 * - Servers guaranteed to be ready (wait-on library)
 * - Automatic cleanup after tests complete
 *
 * Run with: pnpm test:production
 */

import { test, expect } from '@playwright/test';

test.describe('Production Build Verification', () => {
  test('health endpoint works in production', async ({ request }) => {
    // SEMANTIC GOAL: Prove Next.js app runs without errors in production
    // - App starts successfully with production build
    // - Basic endpoints respond correctly
    // - No crashes from undefined scenarist references

    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });

  test('scenario endpoint returns 405 Method Not Allowed (tree-shaken)', async ({ request }) => {
    // SEMANTIC GOAL: Prove Scenarist is completely absent in production
    // - scenarist.createScenarioEndpoint() returns undefined
    // - Next.js registers the route but returns 405 (not 404 like Express)
    // - No MSW, no scenario switching, no test-id routing in production

    const postResponse = await request.post('/api/__scenario__', {
      data: { scenario: 'test', testId: 'test-123' },
    });

    expect(postResponse.status()).toBe(405);

    const getResponse = await request.get('/api/__scenario__?testId=test-123');
    expect(getResponse.status()).toBe(405);
  });

  test('cart CRUD operations work with json-server backend', async ({ request }) => {
    // SEMANTIC GOAL: Prove same API routes work in both mocked and production states
    // - In dev/test: MSW intercepts /api/cart routes with mock scenarios
    // - In production: Real calls go through to json-server on port 3001
    // - Same /api/cart/add endpoint works in both environments
    // - Demonstrates core value: write once, test with mocks, deploy with real APIs

    // Explicitly reset cart for this test (making test self-contained)
    // This is a REAL http call to json-server - proving no mocking in production
    await request.patch('http://localhost:3001/cart', {
      data: { items: [] },
    });

    // Verify cart is now empty (READ operation via json-server)
    const emptyCartResponse = await request.get('/api/cart');
    expect(emptyCartResponse.status()).toBe(200);
    const emptyCart = await emptyCartResponse.json();
    expect(emptyCart.items).toEqual([]);

    // Add Product 1 to cart (CREATE operation via POST /api/cart/add → GET-then-PATCH to json-server)
    const addProduct1Response = await request.post('/api/cart/add', {
      data: { productId: 1 },
    });
    expect(addProduct1Response.status()).toBe(200);
    const added1 = await addProduct1Response.json();
    expect(added1.success).toBe(true);

    // Verify cart has 1 item (READ operation)
    const cart1Response = await request.get('/api/cart');
    expect(cart1Response.status()).toBe(200);
    const cart1 = await cart1Response.json();
    expect(cart1.items).toHaveLength(1);
    expect(cart1.items[0]).toBe(1);

    // Add Product 2 (UPDATE operation - accumulating items)
    const addProduct2Response = await request.post('/api/cart/add', {
      data: { productId: 2 },
    });
    expect(addProduct2Response.status()).toBe(200);

    // Verify cart has 2 items
    const cart2Response = await request.get('/api/cart');
    expect(cart2Response.status()).toBe(200);
    const cart2 = await cart2Response.json();
    expect(cart2.items).toHaveLength(2);
    expect(cart2.items).toEqual([1, 2]);

    // Add Product 1 again to test accumulation
    const addProduct1AgainResponse = await request.post('/api/cart/add', {
      data: { productId: 1 },
    });
    expect(addProduct1AgainResponse.status()).toBe(200);

    // Verify cart has 3 items total
    const cart3Response = await request.get('/api/cart');
    expect(cart3Response.status()).toBe(200);
    const cart3 = await cart3Response.json();
    expect(cart3.items).toHaveLength(3);
    expect(cart3.items).toEqual([1, 2, 1]);

    // This proves:
    // 1. POST /api/cart/add works (GET-then-PATCH to json-server successful)
    // 2. GET /api/cart works (json-server GET successful)
    // 3. State persistence works (json-server stores cart state)
    // 4. Real API calls work end-to-end (MSW tree-shaken, json-server active)
    // 5. Same code path in test (MSW) and production (json-server) environments
  });
});
