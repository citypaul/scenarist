import { test, expect } from './fixtures';

/**
 * Products Server-Side Page - Pages Router getServerSideProps with Scenarist
 *
 * This test file demonstrates:
 * Testing Next.js Pages Router server-side data fetching with getServerSideProps
 *
 * KEY DIFFERENCE FROM CLIENT TESTS:
 * - products-client-components.spec.ts: Tests client-side data fetching (useEffect)
 * - products-server-side.spec.ts: Tests server-side data fetching (getServerSideProps)
 *
 * THE VALUE:
 * - ✅ Playwright + Scenarist - runtime scenario switching
 * - ✅ Test ACTUAL server-side rendering behavior
 * - ✅ Verify Scenarist works during getServerSideProps execution
 * - ✅ No need to mock fetch in getServerSideProps
 *
 * ARCHITECTURE:
 * - /products page uses getServerSideProps (runs server-side)
 * - Fetches from localhost:3001/products before rendering
 * - Scenarist intercepts and mocks based on scenario
 * - Tests verify server-rendered output contains correct data
 */

test.describe('Products Page - Server-Side Rendering (getServerSideProps)', () => {
  test('should render premium products server-side', async ({ page, switchScenario }) => {
    // Switch to premiumUserScenario to activate premium mocks
    // Automatic default fallback will combine default + premium mocks
    // Premium mock (specificity 1) will override default fallback (specificity 0)
    await switchScenario(page, 'premiumUser');

    // Navigate to products page with tier query param for getServerSideProps
    await page.goto('/?tier=premium');

    // Verify products are visible with PREMIUM pricing (should be server-rendered)
    const firstProduct = page.getByRole('article').first();
    await expect(firstProduct.getByText('£99.99')).toBeVisible();

    // Additional verification: Server-rendered pages don't show loading state
    // (If we see "Loading products..." it means client-side fetch, not SSR)
    await expect(page.getByText('Loading products...')).not.toBeVisible();
  });

  test('should render standard products server-side', async ({
    page,
    switchScenario,
  }) => {
    // Switch to standard user scenario
    await switchScenario(page, 'standardUser');

    // Navigate to products page with tier query param
    await page.goto('/?tier=standard');

    // Verify standard pricing in server-rendered output
    const firstProduct = page.getByRole('article').first();
    await expect(firstProduct.getByText('£149.99')).toBeVisible();

    // Verify no loading state (proves SSR worked)
    await expect(page.getByText('Loading products...')).not.toBeVisible();
  });

  test('should show all products server-rendered', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'standardUser');
    await page.goto('/?tier=standard');

    // Verify multiple products are present in initial HTML
    const products = page.getByRole('article');
    await expect(products).toHaveCount(3);

    // All products should be visible immediately (SSR)
    await expect(products.first()).toBeVisible();
    await expect(products.nth(1)).toBeVisible();
    await expect(products.nth(2)).toBeVisible();
  });
});

/**
 * TEST RESULTS SHOULD PROVE:
 *
 * ✅ getServerSideProps data fetching works with Scenarist
 * ✅ Runtime scenario switching affects server-side rendering
 * ✅ Test isolation maintained (each test gets independent scenario)
 * ✅ Server-rendered pages don't show loading states
 *
 * This demonstrates Scenarist works with both:
 * - App Router: React Server Components (async components)
 * - Pages Router: getServerSideProps (data fetching before render)
 */
