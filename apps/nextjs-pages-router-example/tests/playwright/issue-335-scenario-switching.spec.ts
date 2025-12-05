/**
 * Issue #335: Active scenario simple response overrides default sequence
 *
 * When switching to a scenario, that scenario's mocks must take precedence
 * over default scenario mocks for the same endpoint - regardless of specificity.
 *
 * @see https://github.com/citypaul/scenarist/issues/335
 */

import { test, expect } from "./fixtures";

test.describe("Issue #335: Active scenario simple response overrides default sequence", () => {
  test("returns active scenario's simple response instead of default's sequence mock", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "issue335SimpleResponse");
    await page.goto("/issue335");

    // Click the check button to trigger the API call
    await page
      .getByRole("button", { name: "Check Application Status" })
      .click();

    // Verify the response shows the active scenario's simple response
    const statusRegion = page.getByRole("status");
    await expect(statusRegion).toContainText("ready");
    await expect(statusRegion).toContainText("issue335-simple-response");
  });

  test("uses default sequence when no scenario is set", async ({
    page,
    switchScenario,
  }) => {
    // Switch to default scenario explicitly
    await switchScenario(page, "default");
    await page.goto("/issue335");

    // Click the check button to trigger the API call
    await page
      .getByRole("button", { name: "Check Application Status" })
      .click();

    // Verify the response shows the default scenario's sequence response
    const statusRegion = page.getByRole("status");
    await expect(statusRegion).toContainText("default-sequence");
  });

  test("resumes default sequence after switching back from active scenario", async ({
    page,
    switchScenario,
  }) => {
    // First, switch to the issue335 scenario
    await switchScenario(page, "issue335SimpleResponse");
    await page.goto("/issue335");

    // Click to get the active scenario's response
    await page
      .getByRole("button", { name: "Check Application Status" })
      .click();
    const statusRegion = page.getByRole("status");
    await expect(statusRegion).toContainText("issue335-simple-response");

    // Switch back to default scenario
    await switchScenario(page, "default");

    // Navigate again and click to get the default scenario's response
    await page.goto("/issue335");
    await page
      .getByRole("button", { name: "Check Application Status" })
      .click();
    await expect(statusRegion).toContainText("default-sequence");
  });
});
