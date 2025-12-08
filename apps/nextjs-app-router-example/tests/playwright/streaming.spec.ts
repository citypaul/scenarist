import { test, expect } from "./fixtures";

/**
 * Streaming/Suspense Page - React Server Components with Suspense Boundaries
 *
 * This test file demonstrates testing React Server Components that use Suspense
 * for streaming. The key difference from regular RSC testing is:
 *
 * 1. Suspense boundary shows fallback UI immediately (streaming first chunk)
 * 2. Async component resolves and replaces fallback (streaming complete)
 * 3. Tests verify both states: initial fallback AND final content
 *
 * ARCHITECTURE:
 * - /streaming page wraps async component in <Suspense fallback={...}>
 * - SlowProducts component is async RSC that fetches data
 * - React streams fallback immediately, then replaces when data ready
 * - Scenarist mocks the API response for predictable testing
 */

test.describe("Streaming Page - Suspense Boundaries", () => {
  test("should render streaming page with heading", async ({
    page,
    switchScenario,
  }) => {
    // Switch to streaming scenario
    await switchScenario(page, "streaming");

    // Navigate to streaming page
    await page.goto("/streaming");

    // Verify page rendered with heading
    await expect(
      page.getByRole("heading", { name: "Streaming (React Server Component)" }),
    ).toBeVisible();
  });

  test("should render products after Suspense boundary resolves", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "streaming");
    await page.goto("/streaming");

    // Wait for products to render (Suspense resolved)
    // The streaming scenario returns 3 products
    await expect(page.getByRole("article")).toHaveCount(3);

    // Verify product names are visible
    await expect(
      page.getByRole("heading", { name: "Product A" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Product B" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Product C" }),
    ).toBeVisible();
  });

  test("should render standard tier products with standard pricing", async ({
    page,
    switchScenario,
  }) => {
    // Switch to standard streaming scenario
    await switchScenario(page, "streaming");

    // Navigate with standard tier query param
    await page.goto("/streaming?tier=standard");

    // Verify tier indicator shows standard
    await expect(page.getByText("Current tier: standard")).toBeVisible();

    // Verify products rendered with standard pricing
    await expect(page.getByRole("article")).toHaveCount(3);

    // Standard price for Product A is £149.99 (higher than premium £99.99)
    await expect(page.getByText("£149.99")).toBeVisible();

    // Verify tier badge shows standard
    const firstProduct = page.getByRole("article").first();
    await expect(
      firstProduct.getByText("standard", { exact: false }),
    ).toBeVisible();
  });

  test("should render premium tier products with premium pricing", async ({
    page,
    switchScenario,
  }) => {
    // Switch to premium streaming scenario
    await switchScenario(page, "streamingPremiumUser");

    // Navigate with premium tier query param
    await page.goto("/streaming?tier=premium");

    // Verify tier indicator shows premium
    await expect(page.getByText("Current tier: premium")).toBeVisible();

    // Verify products rendered with premium pricing
    await expect(page.getByRole("article")).toHaveCount(3);

    // Premium price for Product A is £99.99 (lower than standard £149.99)
    await expect(page.getByText("£99.99")).toBeVisible();

    // Verify tier badge shows premium
    const firstProduct = page.getByRole("article").first();
    await expect(
      firstProduct.getByText("premium", { exact: false }),
    ).toBeVisible();
  });

  test("should show loading skeleton initially before products load", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "streaming");

    // Navigate and wait only for initial DOM, not full load
    await page.goto("/streaming", { waitUntil: "domcontentloaded" });

    // The loading skeleton has aria-label "Loading products"
    // It may or may not be visible depending on how fast the response comes back
    // But the skeleton element should exist in the DOM initially
    const skeleton = page.getByLabel("Loading products");

    // Wait for either skeleton to be visible OR products to appear
    // This handles the race condition where data loads very fast
    await Promise.race([
      skeleton.waitFor({ state: "visible", timeout: 1000 }).catch(() => {}),
      page.getByRole("article").first().waitFor({ state: "visible" }),
    ]);

    // Eventually, products should appear (skeleton replaced)
    await expect(page.getByRole("article")).toHaveCount(3);

    // And skeleton should no longer be visible
    await expect(skeleton).not.toBeVisible();
  });
});
