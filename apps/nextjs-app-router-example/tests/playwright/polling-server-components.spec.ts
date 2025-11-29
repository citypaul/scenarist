import { test, expect } from "./fixtures";

/**
 * Polling Server Components Page - Sequences with React Server Components
 *
 * This test file demonstrates SEQUENCES working with React Server Components:
 * Testing response sequences WITHOUT Jest!
 *
 * THE PROBLEM:
 * - Jest CANNOT test async server components
 * - Sequences require multiple requests to advance
 * - Must test the ACTUAL rendered output from React Server Components
 *
 * THE SCENARIST SOLUTION:
 * - ✅ Playwright + Scenarist sequences work with React Server Components
 * - ✅ Each page navigation/reload advances the sequence
 * - ✅ Sequence progression: pending → processing → complete
 * - ✅ Repeat mode 'last' keeps final state
 *
 * ARCHITECTURE:
 * - /polling page is a React Server Component (async, runs server-side)
 * - Fetches from localhost:3001/github/jobs/:id
 * - Scenarist intercepts and returns sequenced responses
 * - Tests verify React Server Component renders correctly at each sequence position
 */

test.describe("Polling Page - Sequences with Server Components", () => {
  test("should show pending status on first request", async ({
    page,
    switchScenario,
  }) => {
    // Switch to GitHub polling scenario
    await switchScenario(page, "githubPolling");

    // Navigate to polling page - first sequence position
    await page.goto("/polling?jobId=123");

    // Verify server component rendered
    await expect(
      page.getByRole("heading", {
        name: "Job Polling (React Server Component)",
      }),
    ).toBeVisible();

    // Verify first sequence response: pending (0%)
    await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
    await expect(page.getByText("0%", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Job is queued and waiting to start..."),
    ).toBeVisible();
  });

  test("should show processing status on second request", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "githubPolling");

    // First request (pending)
    await page.goto("/polling?jobId=123");
    await expect(page.getByText("PENDING", { exact: true })).toBeVisible();

    // Reload page - advances to second sequence position
    await page.reload();

    // Verify second sequence response: processing (50%)
    await expect(page.getByText("PROCESSING", { exact: true })).toBeVisible();
    await expect(page.getByText("50%", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Job is currently being processed..."),
    ).toBeVisible();
  });

  test("should show complete status on third request", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "githubPolling");

    // First request (pending)
    await page.goto("/polling?jobId=123");

    // Second request (processing)
    await page.reload();

    // Third request - advances to third sequence position (complete)
    await page.reload();

    // Verify third sequence response: complete (100%)
    await expect(page.getByText("COMPLETE", { exact: true })).toBeVisible();
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    await expect(page.getByText("Job completed successfully!")).toBeVisible();
  });

  test("should keep showing complete status after sequence exhaustion (repeat: last)", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "githubPolling");

    // Advance through all sequence positions
    await page.goto("/polling?jobId=123"); // pending
    await page.reload(); // processing
    await page.reload(); // complete

    // Verify complete status
    await expect(page.getByText("COMPLETE", { exact: true })).toBeVisible();

    // Fourth request - sequence exhausted, should repeat last (complete)
    await page.reload();

    // Verify STILL showing complete (not cycling back to pending)
    await expect(page.getByText("COMPLETE", { exact: true })).toBeVisible();
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    await expect(page.getByText("Job completed successfully!")).toBeVisible();
  });

  test("should demonstrate sequence advancement with server components", async ({
    page,
    switchScenario,
  }) => {
    await switchScenario(page, "githubPolling");
    await page.goto("/polling?jobId=123");

    // Verify explanatory text about sequences
    await expect(
      page.getByText("Each page refresh advances the sequence"),
    ).toBeVisible();
    await expect(page.getByText("Repeat Mode: 'last'")).toBeVisible();
    await expect(
      page.getByText(
        "This proves Scenarist sequences work with Server Components!",
      ),
    ).toBeVisible();
  });
});

/**
 * TEST RESULTS PROVE:
 *
 * ✅ React Server Components work with Scenarist sequences
 * ✅ No Jest issues (Jest cannot test React Server Components)
 * ✅ Sequence advancement works with server-side rendering
 * ✅ Repeat mode 'last' works correctly
 * ✅ Each page reload/navigation advances the sequence
 * ✅ Fast feedback loop for testing sequences
 *
 * This proves Scenarist sequences are fully compatible with React Server Components!
 */
