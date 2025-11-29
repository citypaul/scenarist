/**
 * Checkout Tests - Phase 4 Feature Composition
 *
 * Purpose: Demonstrate request matching + stateful mocks working TOGETHER
 *
 * DEMONSTRATES: Best practices for testing feature composition
 * - Request matching on country (UK = free, US = £10 shipping)
 * - State capture of shipping address
 * - Both features working in the SAME scenario
 * - Accessible UI patterns (getByRole, getByLabel)
 */

import { test, expect } from "./fixtures";

test.describe("Checkout - Feature Composition", () => {
  test("should provide free shipping for UK and capture address", async ({
    page,
    switchScenario,
  }) => {
    // Switch to checkout scenario (combines matching + stateful)
    await switchScenario(page, "checkout");
    await page.goto("/checkout");

    // Verify page loaded
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    // Fill in UK shipping address
    await page.getByLabel("Country").selectOption("UK");
    await page.getByLabel("Address").fill("123 Test Street");
    await page.getByLabel("City").fill("London");
    await page.getByLabel("Postcode").fill("SW1A 1AA");

    // Calculate shipping (triggers request matching on country)
    await page.getByRole("button", { name: "Calculate Shipping" }).click();

    // Verify free shipping for UK (MATCHING on country=UK)
    const shippingCost = page
      .getByRole("status")
      .filter({ hasText: "Shipping" });
    await expect(shippingCost).toContainText("£0.00");

    // Place order (triggers state capture of address)
    await page.getByRole("button", { name: "Place Order" }).click();

    // Verify address was captured and displayed (STATEFUL)
    const confirmation = page.getByRole("region", {
      name: "Order confirmation",
    });
    await expect(confirmation).toContainText("123 Test Street");
    await expect(confirmation).toContainText("London");
    await expect(confirmation).toContainText("SW1A 1AA");
    await expect(confirmation).toContainText("UK");
  });

  test("should charge £10 shipping for US orders", async ({
    page,
    switchScenario,
  }) => {
    // Switch to checkout scenario
    await switchScenario(page, "checkout");
    await page.goto("/checkout");

    // Fill in US shipping address
    await page.getByLabel("Country").selectOption("US");
    await page.getByLabel("Address").fill("456 Main St");
    await page.getByLabel("City").fill("New York");
    await page.getByLabel("Postcode").fill("10001");

    // Calculate shipping (triggers request matching on country)
    await page.getByRole("button", { name: "Calculate Shipping" }).click();

    // Verify £10 shipping for US (MATCHING on country=US)
    const shippingCost = page
      .getByRole("status")
      .filter({ hasText: "Shipping" });
    await expect(shippingCost).toContainText("£10.00");

    // Place order (triggers state capture of address)
    await page.getByRole("button", { name: "Place Order" }).click();

    // Verify US address was captured (STATEFUL)
    const confirmation = page.getByRole("region", {
      name: "Order confirmation",
    });
    await expect(confirmation).toContainText("456 Main St");
    await expect(confirmation).toContainText("New York");
    await expect(confirmation).toContainText("10001");
    await expect(confirmation).toContainText("US");
  });

  test("should charge £5 shipping for EU orders", async ({
    page,
    switchScenario,
  }) => {
    // Switch to checkout scenario
    await switchScenario(page, "checkout");
    await page.goto("/checkout");

    // Fill in EU (France) shipping address
    await page.getByLabel("Country").selectOption("FR");
    await page.getByLabel("Address").fill("789 Rue de Paris");
    await page.getByLabel("City").fill("Paris");
    await page.getByLabel("Postcode").fill("75001");

    // Calculate shipping
    await page.getByRole("button", { name: "Calculate Shipping" }).click();

    // Verify £5 shipping for EU (MATCHING on country=FR)
    const shippingCost = page
      .getByRole("status")
      .filter({ hasText: "Shipping" });
    await expect(shippingCost).toContainText("£5.00");

    // Place order
    await page.getByRole("button", { name: "Place Order" }).click();

    // Verify EU address was captured (STATEFUL)
    const confirmation = page.getByRole("region", {
      name: "Order confirmation",
    });
    await expect(confirmation).toContainText("789 Rue de Paris");
    await expect(confirmation).toContainText("Paris");
    await expect(confirmation).toContainText("75001");
    await expect(confirmation).toContainText("FR");
  });
});
