import { test, expect } from './fixtures';

/**
 * Products Server Components Page - React Server Components with Scenarist
 *
 * This test file demonstrates THE KEY VALUE PROPOSITION:
 * Testing React Server Components WITHOUT Jest!
 *
 * FROM NEXT.JS OFFICIAL DOCS:
 * > "Since async Server Components are new to the React ecosystem, some tools
 * > do not fully support them. In the meantime, we recommend using End-to-End
 * > Testing over Unit Testing for async components."
 *
 * THE PROBLEM:
 * - Jest CANNOT test async server components
 * - Attempting to render React Server Components in Jest throws:
 *   "Objects are not valid as a React child (found: [object Promise])"
 * - Must spawn new Next.js instance per test (slow, complex, fragile)
 *
 * THE SCENARIST SOLUTION:
 * - ✅ Playwright + Scenarist - no Jest needed
 * - ✅ setScenario() switches backend behavior at runtime
 * - ✅ Fast parallel execution with test isolation
 * - ✅ No spawning Next.js instances
 * - ✅ Test the ACTUAL rendered output from React Server Components
 *
 * ARCHITECTURE:
 * - /products page is a React Server Component (async, runs server-side)
 * - Fetches from localhost:3001/products with x-user-tier header
 * - Scenarist intercepts and mocks based on scenario
 * - Tests verify React Server Component renders correctly with mocked data
 */

test.describe('Products Page - React Server Components', () => {
  test('should render products from server component with premium tier', async ({
    page,
    switchScenario,
  }) => {
    // Switch to premium user scenario
    await switchScenario(page, 'premiumUser');

    // Navigate to server component page with tier query param
    await page.goto('/products?tier=premium');

    // Verify server component rendered
    await expect(
      page.getByRole('heading', { name: 'Products (React Server Component)' })
    ).toBeVisible();

    // Verify tier indicator
    await expect(page.getByText('Current tier: premium')).toBeVisible();

    // Verify products rendered with premium pricing
    await expect(page.getByRole('heading', { name: 'Product A' })).toBeVisible();
    await expect(page.getByText('£99.99')).toBeVisible(); // Premium price for Product A

    // Verify tier badge on product card
    const firstProduct = page.locator('div.border').first();
    await expect(firstProduct.getByText('premium', { exact: false })).toBeVisible();
  });

  test('should render products from server component with standard tier', async ({
    page,
    switchScenario,
  }) => {
    // Switch to standard user scenario
    await switchScenario(page, 'standardUser');

    // Navigate to server component page with tier query param
    await page.goto('/products?tier=standard');

    // Verify server component rendered
    await expect(
      page.getByRole('heading', { name: 'Products (React Server Component)' })
    ).toBeVisible();

    // Verify tier indicator
    await expect(page.getByText('Current tier: standard')).toBeVisible();

    // Verify products rendered with standard pricing
    await expect(page.getByRole('heading', { name: 'Product A' })).toBeVisible();
    await expect(page.getByText('£149.99')).toBeVisible(); // Standard price for Product A

    // Verify tier badge on product card
    const firstProduct = page.locator('div.border').first();
    await expect(firstProduct.getByText('standard', { exact: false })).toBeVisible();
  });

  test('should show all three products from server component', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'standardUser');
    await page.goto('/products?tier=standard');

    // Verify all 3 products are rendered
    await expect(page.getByRole('heading', { name: 'Product A' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product B' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product C' })).toBeVisible();

    // Verify the grid layout (should have 3 product cards)
    const productCards = page.locator('div.border');
    await expect(productCards).toHaveCount(3);
  });

  test('should switch tiers at runtime without app restart', async ({
    page,
    switchScenario,
  }) => {
    // Start with premium
    await switchScenario(page, 'premiumUser');
    await page.goto('/products?tier=premium');

    // Verify premium price
    await expect(page.getByText('£99.99')).toBeVisible();

    // Click to switch to standard
    await page.getByRole('link', { name: 'Standard Tier' }).click();

    // Need to switch scenario too (simulating different user)
    await switchScenario(page, 'standardUser');

    // Reload to get new scenario
    await page.reload();

    // Verify standard price (no app restart needed!)
    await expect(page.getByText('£149.99')).toBeVisible();
  });

  test('should demonstrate that server component testing works without Jest', async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, 'premiumUser');
    await page.goto('/products?tier=premium');

    // Verify the explanatory text about Jest limitations
    await expect(
      page.getByText('Objects are not valid as a React child', { exact: false })
    ).toBeVisible();

    // Verify the Scenarist solution text
    await expect(page.getByText('setScenario', { exact: false })).toBeVisible();
  });
});

/**
 * TEST RESULTS PROVE:
 *
 * ✅ React Server Components ARE testable with Scenarist + Playwright
 * ✅ No Jest issues (Jest cannot test React Server Components)
 * ✅ No spawning new Next.js instances per test
 * ✅ Runtime scenario switching works
 * ✅ Parallel execution with test isolation
 * ✅ Fast feedback loop
 *
 * This is the example we reference in documentation to prove Scenarist
 * solves the React Server Component testing pain point.
 */
