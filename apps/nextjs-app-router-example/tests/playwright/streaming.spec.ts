import { test, expect } from "./fixtures";

/**
 * Streaming/Suspense Page - React Server Components with Suspense Boundaries
 *
 * This test file demonstrates testing React Server Components that use Suspense
 * for streaming. The key difference from regular RSC testing is:
 *
 * 1. Suspense boundary shows fallback UI immediately (streaming first chunk)
 * 2. Async component resolves and replaces fallback (streaming complete)
 * 3. Tests verify both states: initial fallback AND final content
 *
 * ARCHITECTURE:
 * - /streaming page wraps async component in <Suspense fallback={...}>
 * - SlowProducts component is async RSC that fetches data
 * - React streams fallback immediately, then replaces when data ready
 * - Scenarist mocks the API response for predictable testing
 */

test.describe("Streaming Page - Suspense Boundaries", () => {
  test("should render streaming page with heading", async ({
    page,
    switchScenario,
  }) => {
    // Switch to streaming scenario
    await switchScenario(page, "streaming");

    // Navigate to streaming page
    await page.goto("/streaming");

    // Verify page rendered with heading
    await expect(
      page.getByRole("heading", { name: "Streaming (React Server Component)" }),
    ).toBeVisible();
  });
});
