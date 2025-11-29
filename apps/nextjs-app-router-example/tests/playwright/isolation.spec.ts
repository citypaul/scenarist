/**
 * Parallel Test Isolation - Phase 8.6
 *
 * Purpose: Prove Scenarist's CORE PROMISE - multiple tests can run
 * concurrently with different scenarios without interfering.
 *
 * DEMONSTRATES:
 * - Test ID isolation (each test gets unique ID)
 * - Concurrent scenario execution (no cross-contamination)
 * - ScenarioStore isolation per test ID
 * - StateManager isolation per test ID
 * - SequenceTracker isolation per test ID
 *
 * Tests run in PARALLEL (not sequential) to prove isolation.
 */

import { test, expect } from "./fixtures";

// Configure parallel execution - all tests in this file run concurrently
test.describe.configure({ mode: "parallel" });

test.describe("Parallel Test Isolation", () => {
  test("concurrent test 1: premium user sees £99.99 pricing", async ({
    page,
    switchScenario,
  }) => {
    // Switch to premium scenario
    await switchScenario(page, "premiumUser");

    // Navigate to products page
    await page.goto("/");

    // Click premium tier button and wait for API response
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("/api/products") && resp.ok(),
      ),
      page.getByRole("button", { name: "Select premium tier" }).click(),
    ]);

    // Verify premium pricing appears
    const firstProduct = page.getByRole("article").first();
    await expect(firstProduct.getByText("£99.99")).toBeVisible();

    // Verify we're NOT seeing standard pricing (would indicate interference)
    await expect(firstProduct.getByText("£149.99")).not.toBeVisible();
  });

  test("concurrent test 2: standard user sees £149.99 pricing", async ({
    page,
    switchScenario,
  }) => {
    // Switch to standard scenario
    await switchScenario(page, "standardUser");

    // Navigate to products page and wait for initial products fetch
    // Note: The page loads with userTier='standard' by default, so the initial
    // fetch IS the standard tier fetch. We wait for it during navigation rather
    // than on button click, since clicking 'standard' when already on 'standard'
    // doesn't trigger a new fetch (no state change).
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes("/api/products") && resp.ok(),
      ),
      page.goto("/"),
    ]);

    // Verify standard pricing appears
    const firstProduct = page.getByRole("article").first();
    await expect(firstProduct.getByText("£149.99")).toBeVisible();

    // Verify we're NOT seeing premium pricing (would indicate interference)
    await expect(firstProduct.getByText("£99.99")).not.toBeVisible();
  });

  test("concurrent test 3: checkout UK gets free shipping", async ({
    page,
    switchScenario,
  }) => {
    // Switch to checkout scenario
    await switchScenario(page, "checkout");

    // Navigate to checkout
    await page.goto("/checkout");

    // Fill UK address
    await page.getByLabel("Country").selectOption("UK");
    await page.getByLabel("Address").fill("123 Test St");
    await page.getByLabel("City").fill("London");
    await page.getByLabel("Postcode").fill("SW1A 1AA");

    // Calculate shipping
    await page.getByRole("button", { name: "Calculate Shipping" }).click();

    // Verify UK gets FREE shipping (£0.00)
    const shippingCost = page
      .getByRole("status")
      .filter({ hasText: "Shipping" });
    await expect(shippingCost).toContainText("£0.00");

    // Verify we're NOT seeing paid shipping (would indicate interference)
    await expect(shippingCost).not.toContainText("£10.00");
    await expect(shippingCost).not.toContainText("£5.00");
  });

  test("concurrent test 4: checkout US gets £10 shipping", async ({
    page,
    switchScenario,
  }) => {
    // Switch to checkout scenario
    await switchScenario(page, "checkout");

    // Navigate to checkout
    await page.goto("/checkout");

    // Fill US address
    await page.getByLabel("Country").selectOption("US");
    await page.getByLabel("Address").fill("456 Main St");
    await page.getByLabel("City").fill("New York");
    await page.getByLabel("Postcode").fill("10001");

    // Calculate shipping
    await page.getByRole("button", { name: "Calculate Shipping" }).click();

    // Verify US gets £10 shipping
    const shippingCost = page
      .getByRole("status")
      .filter({ hasText: "Shipping" });
    await expect(shippingCost).toContainText("£10.00");

    // Verify we're NOT seeing free or EU shipping (would indicate interference)
    await expect(shippingCost).not.toContainText("£0.00");
    await expect(shippingCost).not.toContainText("£5.00");
  });

  test("concurrent test 5: shopping cart state is isolated", async ({
    page,
    switchScenario,
  }) => {
    // Switch to cart scenario
    await switchScenario(page, "cartWithState");

    // Navigate to products page
    await page.goto("/");

    // Wait for products to load
    await expect(page.getByRole("article").first()).toBeVisible();

    // Add first product to cart using the proper button pattern
    const addButton = page
      .getByRole("button", { name: /Add .* to cart/ })
      .first();
    await addButton.click();

    // Verify cart count shows 1 (not items from other concurrent tests)
    const cartCount = page.getByLabel("Cart item count");
    await expect(cartCount).toHaveText("1");

    // Verify we're NOT seeing counts from other tests
    await expect(cartCount).not.toHaveText("2");
    await expect(cartCount).not.toHaveText("3");
  });
});
