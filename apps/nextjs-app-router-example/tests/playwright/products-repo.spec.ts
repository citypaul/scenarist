/**
 * Products with Repository Pattern - Playwright Tests
 *
 * These tests demonstrate the combined testing strategy:
 * - Repository pattern for database access (with test ID isolation)
 * - Scenarist for HTTP API mocking
 *
 * Key points:
 * - Tests run in PARALLEL without interfering with each other
 * - Each test gets its own data partition via test ID
 * - Repository and Scenarist both use the same test ID for isolation
 */

import { test, expect } from './fixtures';

test.describe('Products with Repository Pattern', () => {
  test('[REPO] should show premium pricing for premium user', async ({
    page,
    switchScenario,
  }) => {
    // 1. Switch to premium scenario (Scenarist mocks external API)
    const testId = await switchScenario(page, 'premiumUser');

    // 2. Set up test data via API route (uses in-memory repository)
    const createResponse = await page.request.post(
      'http://localhost:3002/api/test/users',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-test-id': testId,
        },
        data: {
          email: 'premium@example.com',
          name: 'Premium User',
          tier: 'premium',
        },
      }
    );
    expect(createResponse.ok()).toBe(true);
    const { user } = await createResponse.json();
    expect(user.id).toBeDefined();

    // 3. Navigate to page with the user ID from repository
    await page.goto(`/products-repo?userId=${user.id}`);

    // 4. Verify user info from repository
    await expect(page.getByText('Premium User')).toBeVisible();
    await expect(page.getByText('premium@example.com')).toBeVisible();
    await expect(page.getByText('premium').first()).toBeVisible();

    // 5. Verify products from Scenarist mock (premium pricing)
    // Premium prices: Product A £99.99, Product B £149.99, Product C £79.99
    await expect(page.getByText('£99.99')).toBeVisible();
    await expect(page.getByText('£149.99')).toBeVisible();
    await expect(page.getByText('£79.99')).toBeVisible();
  });

  test('[REPO] should show standard pricing for standard user', async ({
    page,
    switchScenario,
  }) => {
    // 1. Switch to default scenario (standard pricing)
    const testId = await switchScenario(page, 'default');

    // 2. Set up test data via API route
    const createResponse = await page.request.post(
      'http://localhost:3002/api/test/users',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-test-id': testId,
        },
        data: {
          email: 'standard@example.com',
          name: 'Standard User',
          tier: 'standard',
        },
      }
    );
    expect(createResponse.ok()).toBe(true);
    const { user } = await createResponse.json();

    // 3. Navigate to page
    await page.goto(`/products-repo?userId=${user.id}`);

    // 4. Verify user info from repository
    await expect(page.getByText('Standard User')).toBeVisible();
    await expect(page.getByText('standard@example.com')).toBeVisible();

    // 5. Verify products from Scenarist mock (standard pricing)
    // Standard prices: Product A £149.99, Product B £199.99, Product C £99.99
    await expect(page.getByText('£149.99')).toBeVisible();
    await expect(page.getByText('£199.99')).toBeVisible();
    await expect(page.getByText('£99.99')).toBeVisible();
  });

  test('[REPO] should show guest message when user not found', async ({
    page,
    switchScenario,
  }) => {
    // 1. Switch scenario (but don't create a user)
    await switchScenario(page, 'default');

    // 2. Navigate to page with non-existent user
    await page.goto('/products-repo?userId=non-existent');

    // 3. Verify guest state
    await expect(
      page.getByText('No user found. Use the test API to create a user first.')
    ).toBeVisible();

    // 4. Products should still render with standard pricing (fallback tier)
    await expect(page.getByText('£149.99')).toBeVisible();
  });

  test('[REPO] should isolate data between parallel tests', async ({
    page,
    switchScenario,
  }) => {
    // This test creates a user with a specific email
    // Other parallel tests should NOT see this user
    const testId = await switchScenario(page, 'default');

    // Create a user with unique email for this test
    const uniqueEmail = `isolated-${Date.now()}@example.com`;
    await page.request.post('http://localhost:3002/api/test/users', {
      headers: {
        'Content-Type': 'application/json',
        'x-test-id': testId,
      },
      data: {
        email: uniqueEmail,
        name: 'Isolated User',
        tier: 'standard',
      },
    });

    // Verify the user exists for this test
    const listResponse = await page.request.get(
      'http://localhost:3002/api/test/users',
      {
        headers: {
          'x-test-id': testId,
        },
      }
    );
    const { users } = await listResponse.json();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe(uniqueEmail);
  });

  test('[REPO] should demonstrate multiple users in same test partition', async ({
    page,
    switchScenario,
  }) => {
    const testId = await switchScenario(page, 'premiumUser');

    // Create multiple users in the same test partition
    await page.request.post('http://localhost:3002/api/test/users', {
      headers: {
        'Content-Type': 'application/json',
        'x-test-id': testId,
      },
      data: {
        email: 'user1@example.com',
        name: 'User One',
        tier: 'premium',
      },
    });

    await page.request.post('http://localhost:3002/api/test/users', {
      headers: {
        'Content-Type': 'application/json',
        'x-test-id': testId,
      },
      data: {
        email: 'user2@example.com',
        name: 'User Two',
        tier: 'standard',
      },
    });

    // Verify both users exist
    const listResponse = await page.request.get(
      'http://localhost:3002/api/test/users',
      {
        headers: {
          'x-test-id': testId,
        },
      }
    );
    const { users } = await listResponse.json();
    expect(users.length).toBe(2);

    // Navigate with first user (premium)
    await page.goto('/products-repo?userId=user-1');
    await expect(page.getByText('User One')).toBeVisible();
    await expect(page.getByText('£99.99')).toBeVisible(); // Premium pricing
  });
});
