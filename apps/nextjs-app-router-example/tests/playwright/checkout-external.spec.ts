/**
 * Checkout External API Tests
 *
 * Demonstrates testing Server Components that fetch from external APIs.
 * MSW intercepts the HTTP requests to localhost:3001 (mock external service).
 *
 * Label: [API-PROXY] - Tests showing external API proxy pattern
 */

import { test, expect } from "./fixtures";

test.describe("Checkout Page - External API Pattern", () => {
  test("[API-PROXY] Premium user checkout - shows 20% discount, full cart, order history", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "premiumUserCheckout");
    await page.goto("/checkout-external?userId=user-1");

    // Premium user info
    await expect(
      page.getByRole("heading", { name: "Welcome, Jane Premium" }),
    ).toBeVisible();
    await expect(page.getByText("premium@example.com")).toBeVisible();
    await expect(page.getByText("⭐ Premium Member")).toBeVisible();

    // Full cart (3 items)
    await expect(page.getByText("Your Cart (3 items)")).toBeVisible();
    await expect(page.getByText("Premium Headphones")).toBeVisible();
    await expect(page.getByText("Wireless Mouse")).toBeVisible();
    await expect(page.getByText("Mechanical Keyboard")).toBeVisible();

    // 20% discount for premium
    await expect(page.getByText("Premium Discount (20%):")).toBeVisible();
    await expect(page.locator(".discount")).toContainText("-£");

    // Order history (5 orders)
    await expect(page.locator(".order-item")).toHaveCount(5);

    // Premium recommendations
    await expect(page.getByText("Premium Laptop Stand")).toBeVisible();
    await expect(page.getByText("Premium USB-C Hub")).toBeVisible();
    await expect(page.getByText("Premium Desk Mat")).toBeVisible();
  });

  test("[API-PROXY] Standard user checkout - no discount, minimal cart, first order", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "standardUserCheckout");
    await page.goto("/checkout-external?userId=user-1");

    // Standard user info
    await expect(
      page.getByRole("heading", { name: "Welcome, John Standard" }),
    ).toBeVisible();
    await expect(page.getByText("standard@example.com")).toBeVisible();
    await expect(page.getByText("Standard Member")).toBeVisible();

    // Minimal cart (1 item)
    await expect(page.getByText("Your Cart (1 items)")).toBeVisible();
    await expect(page.getByText("Premium Headphones")).toBeVisible();

    // No discount
    await expect(page.getByText("Premium Discount")).not.toBeVisible();

    // First order message
    await expect(page.getByText("This is your first order! 🎉")).toBeVisible();

    // Standard recommendations
    await expect(page.getByText("Basic Mouse Pad")).toBeVisible();
    await expect(page.getByText("Basic Cable Organizer")).toBeVisible();
  });
});
