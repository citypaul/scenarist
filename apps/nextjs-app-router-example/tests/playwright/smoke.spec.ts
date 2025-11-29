/**
 * Smoke Test - Phase 8.0
 *
 * Basic test to verify the Next.js App Router app loads correctly.
 * Tests the home page renders with expected content.
 */

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("home page loads and displays title", async ({ page }) => {
    // Navigate to home page
    await page.goto("/");

    // Verify page title
    await expect(
      page.getByRole("heading", {
        name: /Scenarist - Next.js App Router Example/i,
      }),
    ).toBeVisible();

    // Verify description text
    await expect(
      page.getByText(/E-commerce demo showcasing all Scenarist features/i),
    ).toBeVisible();
  });
});
