/**
 * Hydration Readiness - Test Harness Guard
 *
 * Client components ignore input until React hydrates them: a fill never
 * reaches component state and a click has no handler. Server-rendered controls
 * are already visible and enabled, so Playwright's actionability checks pass
 * before hydration. Under full-suite load the gap between the `load` event
 * (where `page.goto` returns) and hydration is wide enough for specs to
 * interact too early (empty checkout form posted, sequence clicks ignored).
 *
 * These tests open that gap as wide as possible by returning from navigation
 * at `commit`, before any JavaScript runs, proving the shared `page` fixture
 * waits for hydration after every navigation.
 */

import { test, expect } from "./fixtures";

test.describe("Hydration readiness", () => {
  test("form input entered right after navigation reaches the app", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "checkout");
    await page.goto("/checkout", { waitUntil: "commit" });

    await page.getByLabel("Country").selectOption("UK");
    await page.getByLabel("Address").fill("123 Test Street");
    await page.getByLabel("City").fill("London");
    await page.getByLabel("Postcode").fill("SW1A 1AA");
    await page.getByRole("button", { name: "Calculate Shipping" }).click();

    await expect(
      page.getByRole("status").filter({ hasText: "Shipping" }),
    ).toContainText("£0.00");
  });

  test("a click right after reload reaches the app", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "githubPolling");
    await page.goto("/payment");
    await page.reload({ waitUntil: "commit" });

    await page.getByRole("button", { name: "Check Job Status" }).click();

    await expect(page.getByRole("status").first()).toContainText(
      "Status: pending",
    );
  });
});
