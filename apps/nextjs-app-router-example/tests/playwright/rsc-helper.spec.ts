/**
 * RSC Helper - ATDD Acceptance Test
 *
 * This test verifies that Server Components can use scenarist.getHeadersFromReadonlyHeaders()
 * to work with ReadonlyHeaders from next/headers, without the awkward Request workaround.
 *
 * CURRENT STATUS: FAILS because getHeadersFromReadonlyHeaders doesn't exist yet.
 * AFTER IMPLEMENTATION: Will pass with clean API usage.
 */

import { test, expect } from "./fixtures";

test.describe("RSC Helper - ATDD", () => {
  /**
   * Test: Server Component uses ReadonlyHeaders directly with clean helper API
   *
   * DEMONSTRATES:
   * - Server Component gets headers via headers() from next/headers (ReadonlyHeaders)
   * - Calls scenarist.getHeadersFromReadonlyHeaders(headersList)
   * - No fake Request object needed
   * - Clean, obvious API for primary Next.js pattern
   *
   * EXPECTED BEHAVIOR:
   * - Page loads successfully (no TypeScript/runtime errors)
   * - Premium scenario active → premium pricing returned
   * - Product A shows £99.99 (premium price, not £149.99 standard)
   *
   * CURRENT STATUS: FAILS
   * - getHeadersFromReadonlyHeaders doesn't exist on scenarist object
   * - Page will show runtime error
   */
  test("should work with ReadonlyHeaders using getHeadersFromReadonlyHeaders helper", async ({
    page,
    switchScenario,
  }) => {
    // Activate premium user scenario
    await switchScenario(page, "premiumUser");

    // Navigate to test page (Server Component using ReadonlyHeaders)
    await page.goto("/test-rsc-helper");

    // Verify page loads without errors
    await expect(page.getByRole("heading", { name: "Test RSC Helper" })).toBeVisible();

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
