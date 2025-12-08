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

    // Error boundary should be visible with alert role
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
  });

  test("retry button allows recovery from error", async ({
    page,
    switchScenario,
  }) => {
    // Start with error scenario
    await switchScenario(page, "apiError");
    await page.goto("/errors");

    // Verify error boundary is showing
    await expect(page.getByRole("alert")).toBeVisible();

    // Switch to default (working) scenario before retry
    await switchScenario(page, "default");

    // Click retry button
    await page.getByRole("button", { name: /try again/i }).click();

    // Should show success content (no alert, data visible)
    await expect(page.getByRole("alert")).not.toBeVisible();
    await expect(page.getByText(/error demo data/i)).toBeVisible();
  });

  test("displays content when API returns success", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "default");
    await page.goto("/errors");

    // Should show data, no error
    await expect(page.getByText(/error demo data/i)).toBeVisible();
    await expect(page.getByRole("alert")).not.toBeVisible();
  });
});
