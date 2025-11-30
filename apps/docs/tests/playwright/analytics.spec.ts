import { expect, test } from "@playwright/test";

/**
 * Analytics Integration Tests
 *
 * Verifies Plausible analytics script tag is present on all pages.
 * We only test the script injection, not the proxy endpoints, because:
 * - The proxy is trivial pass-through code with no business logic
 * - Testing proxy behavior tests Plausible's API, not our code
 * - Analytics is non-critical - if it breaks, we'd notice from the dashboard
 */

test.describe("Analytics", () => {
  test("landing page includes analytics script with correct attributes", async ({
    page,
  }) => {
    await page.goto("/");

    const analyticsScript = page.locator('script[data-domain="scenarist.io"]');
    await expect(analyticsScript).toHaveAttribute("defer", "");
    await expect(analyticsScript).toHaveAttribute("data-api", "/api/event");
    await expect(analyticsScript).toHaveAttribute("src", "/js/script.js");
  });

  test("docs pages include analytics script with correct attributes", async ({
    page,
  }) => {
    await page.goto("/getting-started/quick-start");

    const analyticsScript = page.locator('script[data-domain="scenarist.io"]');
    await expect(analyticsScript).toHaveAttribute("defer", "");
    await expect(analyticsScript).toHaveAttribute("data-api", "/api/event");
    await expect(analyticsScript).toHaveAttribute("src", "/js/script.js");
  });
});
