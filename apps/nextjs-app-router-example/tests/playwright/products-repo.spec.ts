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
 *
 * The Scenarist pattern:
 * - switchScenario() sets up BOTH HTTP mocks AND repository data
 * - Navigate to page
 * - Assert on rendered content
 * - NO direct API calls in tests!
 */

import { test, expect } from "./fixtures";

test.describe("Products with Repository Pattern", () => {
  test("[REPO] should show premium pricing for premium user", async ({
    page,
    switchScenario,
  }) => {
    // 1. Switch scenario - this sets up:
    //    - HTTP mocks (Scenarist returns premium pricing)
    //    - Repository data (seeds premium user)
    await switchScenario(page, "premiumUser");

    // 2. Navigate to page with seeded user
    await page.goto("/products-repo?userId=user-1");

    // 3. Verify user info from repository
    await expect(page.getByText("Premium User")).toBeVisible();
    await expect(page.getByText("premium@example.com")).toBeVisible();
    await expect(page.getByText("premium").first()).toBeVisible();

    // 4. Verify products from Scenarist mock (premium pricing)
    // Premium prices: Product A £99.99, Product B £149.99, Product C £79.99
    await expect(page.getByText("£99.99")).toBeVisible();
    await expect(page.getByText("£149.99")).toBeVisible();
    await expect(page.getByText("£79.99")).toBeVisible();
  });

  test("[REPO] should show standard pricing for standard user", async ({
    page,
    switchScenario,
  }) => {
    // 1. Switch to default scenario (standard user + standard pricing)
    await switchScenario(page, "default");

    // 2. Navigate to page
    await page.goto("/products-repo?userId=user-1");

    // 3. Verify user info from repository
    await expect(page.getByText("Standard User")).toBeVisible();
    await expect(page.getByText("standard@example.com")).toBeVisible();

    // 4. Verify products from Scenarist mock (standard pricing)
    // Standard prices: Product A £149.99, Product B £199.99, Product C £99.99
    await expect(page.getByText("£149.99")).toBeVisible();
    await expect(page.getByText("£199.99")).toBeVisible();
    await expect(page.getByText("£99.99")).toBeVisible();
  });

  test("[REPO] should show guest message when user not found", async ({
    page,
    switchScenario,
  }) => {
    // 1. Switch to default scenario (but navigate with non-existent user)
    await switchScenario(page, "default");

    // 2. Navigate to page with non-existent user
    await page.goto("/products-repo?userId=non-existent");

    // 3. Verify guest state
    await expect(
      page.getByText("No user found. Use the test API to create a user first."),
    ).toBeVisible();

    // 4. Products should still render with standard pricing (fallback tier)
    await expect(page.getByText("£149.99")).toBeVisible();
  });

  test("[REPO] should isolate data between parallel tests", async ({
    page,
    switchScenario,
  }) => {
    // This test uses premiumUser scenario
    // Other parallel tests using different scenarios should NOT see this data
    await switchScenario(page, "premiumUser");

    // Navigate to page
    await page.goto("/products-repo?userId=user-1");

    // Verify the premium user is visible (seeded by scenario)
    await expect(page.getByText("Premium User")).toBeVisible();
    await expect(page.getByText("premium@example.com")).toBeVisible();

    // Premium pricing should be visible
    await expect(page.getByText("£99.99")).toBeVisible();
  });

  test("[REPO] should demonstrate tier-based pricing with same user ID", async ({
    page,
    switchScenario,
  }) => {
    // Both scenarios seed user-1, but with different tiers
    // premiumUser scenario: user-1 is premium tier → premium pricing
    await switchScenario(page, "premiumUser");

    await page.goto("/products-repo?userId=user-1");

    // Verify premium tier user gets premium pricing
    await expect(page.getByText("Premium User")).toBeVisible();
    await expect(page.getByText("£99.99")).toBeVisible(); // Premium price for Product A
  });
});
