/**
 * PayFlow Scenario Tests
 *
 * These tests demonstrate Scenarist's scenario switching capability.
 * Each test activates a different scenario to test a specific backend state.
 *
 * Video 3 showcases 5 scenarios:
 * 1. default - Pro member with 20% discount
 * 2. freeUser - Free user pays full price
 * 3. soldOut - Products show "Sold Out"
 * 4. shippingServiceDown - Checkout shows shipping error
 * 5. paymentDeclined - Payment fails with decline message
 *
 * CRITICAL: When these tests run, json-server terminal shows ZERO requests.
 * This proves Scenarist is intercepting the server-side HTTP calls.
 */

import { test, expect } from "./fixtures";

test.describe("Video 3: Scenario Switching Demo", () => {
  test("default: Pro member sees 20% discount", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "default");
    await page.goto("/");

    // Pro member should see the 20% discount message
    await expect(
      page.getByText("Your pro membership saves you 20%"),
    ).toBeVisible();

    // Products should show discounted prices (e.g., $79.99 -> $63.99 for hoodie)
    await expect(page.getByText("$63.99")).toBeVisible();
    await expect(page.getByText("$79.99").first()).toBeVisible();

    // "Sold Out" should NOT appear
    await expect(page.getByRole("button", { name: "Sold Out" })).toHaveCount(0);
  });

  test("freeUser: Free user pays full price", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "freeUser");
    await page.goto("/");

    // Free user should NOT see any discount message
    await expect(
      page.getByText(/membership saves you.*%/, { exact: false }),
    ).not.toBeVisible();

    // Products should show full prices
    await expect(page.getByText("$79.99").first()).toBeVisible();

    // The discounted price ($63.99) should NOT appear
    await expect(page.getByText("$63.99")).not.toBeVisible();
  });

  test("soldOut: All products show Sold Out", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "soldOut");
    await page.goto("/");

    // All "Add to Cart" buttons should now say "Sold Out" and be disabled
    const soldOutButtons = page.getByRole("button", { name: "Sold Out" });
    await expect(soldOutButtons).toHaveCount(3);

    // Verify buttons are disabled
    for (const button of await soldOutButtons.all()) {
      await expect(button).toBeDisabled();
    }
  });

  test("shippingServiceDown: Checkout shows shipping error", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "shippingServiceDown");

    // First, add a product to cart (products page still works)
    await page.goto("/");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();

    // Go to checkout
    await page.goto("/checkout");

    // Shipping section should show error
    await expect(page.getByText("Shipping Unavailable")).toBeVisible();
    await expect(
      page.getByText("Unable to load shipping options"),
    ).toBeVisible();

    // Pay button should be disabled
    await expect(page.getByRole("button", { name: /Pay/ })).toBeDisabled();
  });

  test("paymentDeclined: Payment fails with decline message", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "paymentDeclined");

    // Add a product to cart
    await page.goto("/");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();

    // Go to checkout
    await page.goto("/checkout");

    // Wait for shipping options to load
    await expect(page.getByText("Standard Shipping")).toBeVisible();

    // Click the pay button
    await page.getByRole("button", { name: /Pay/ }).click();

    // Should show payment declined error
    await expect(page.getByText("Payment Failed")).toBeVisible();
    await expect(page.getByText("Your card was declined")).toBeVisible();
  });
});
