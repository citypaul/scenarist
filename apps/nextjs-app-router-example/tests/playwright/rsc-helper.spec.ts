/**
 * RSC Helper - Acceptance Test
 *
 * This test verifies that Server Components can use getScenaristHeadersFromReadonlyHeaders()
 * to work with ReadonlyHeaders from next/headers, without awkward Request workarounds.
 */

import { test, expect } from "./fixtures";

test.describe("RSC Helper", () => {
  /**
   * Test: Server Component uses ReadonlyHeaders directly with standalone helper
   *
   * DEMONSTRATES:
   * - Server Component gets headers via headers() from next/headers (ReadonlyHeaders)
   * - Uses getScenaristHeadersFromReadonlyHeaders(headersList) standalone helper
   * - No fake Request object needed
   * - Clean, production-safe API for primary Next.js pattern
   */
  test("should work with ReadonlyHeaders using getScenaristHeadersFromReadonlyHeaders helper", async ({
    page,
    switchScenario,
  }) => {
    // Activate premium user scenario
    await switchScenario(page, "premiumUser");

    // Navigate to test page (Server Component using ReadonlyHeaders)
    await page.goto("/test-rsc-helper");

    // Verify page loads without errors
    await expect(
      page.getByRole("heading", { name: "Test RSC Helper" }),
    ).toBeVisible();

    // Verify premium pricing (Product A premium price is £99.99)
    await expect(page.getByText("Price: £99.99")).toBeVisible();

    // Verify tier is premium (use .first() since there are 3 products)
    await expect(page.getByText("Tier: premium").first()).toBeVisible();

    // Verify all 3 premium products are displayed
    await expect(page.getByText("Product A")).toBeVisible();
    await expect(page.getByText("Product B")).toBeVisible();
    await expect(page.getByText("Product C")).toBeVisible();
  });
});
