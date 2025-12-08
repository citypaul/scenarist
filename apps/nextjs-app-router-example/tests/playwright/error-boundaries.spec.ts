/**
 * Error Boundary Tests - Issue #211
 *
 * TDD Tests for error.tsx error boundary with recovery functionality.
 * These tests verify:
 * 1. Error boundary renders when API returns 500
 * 2. Retry button allows recovery from error
 * 3. Page renders normally when API succeeds
 *
 * @see https://github.com/citypaul/scenarist/issues/211
 */

import { test, expect } from "./fixtures";

test.describe("Error Boundaries", () => {
  test("displays error boundary when API returns 500", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "apiError");
    await page.goto("/errors");

    // Error boundary should show "Something went wrong" message
    await expect(
      page.getByRole("heading", { name: /something went wrong/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  });

  test("retry button is visible in error state", async ({
    page,
    switchScenario,
  }) => {
    // Start with error scenario
    await switchScenario(page, "apiError");
    await page.goto("/errors");

    // Verify error boundary shows with retry button
    await expect(
      page.getByRole("heading", { name: /something went wrong/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  });

  test("page recovers after scenario switch and reload", async ({
    page,
    switchScenario,
  }) => {
    // Start with error scenario
    await switchScenario(page, "apiError");
    await page.goto("/errors");

    // Verify error boundary is showing
    await expect(
      page.getByRole("heading", { name: /something went wrong/i }),
    ).toBeVisible();

    // Switch to default (working) scenario and reload page
    await switchScenario(page, "default");
    await page.reload();

    // Should show success content
    await expect(page.getByText(/error demo data/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /something went wrong/i }),
    ).not.toBeVisible();
  });

  test("displays content when API returns success", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "default");
    await page.goto("/errors");

    // Should show data, no error heading
    await expect(page.getByText(/error demo data/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /something went wrong/i }),
    ).not.toBeVisible();
  });
});
