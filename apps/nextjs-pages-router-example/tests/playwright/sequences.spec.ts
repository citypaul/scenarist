/**
 * Response Sequences Tests - Phase 2 Feature Parity
 *
 * Purpose: Demonstrate Phase 2 (Response Sequences) works in Next.js context
 *
 * DEMONSTRATES: Best practices for accessible Playwright tests
 * - Uses semantic selectors (getByRole, getByText)
 * - Tests visible UI behavior, not raw API responses
 * - Validates screen reader announcements (role="status", aria-live)
 * - Shows real-world user interaction patterns
 *
 * Feature Parity Goal:
 * - Express: ✅ All 3 phases (matching, sequences, stateful)
 * - Next.js: ✅ All 3 phases (matching ✅, sequences ✅, stateful ✅)
 *
 * These tests demonstrate:
 * - Polling sequences with repeat: 'last'
 * - Cycle sequences with repeat: 'cycle'
 * - Exhaustion sequences with repeat: 'none'
 */

import { test, expect } from "./fixtures";

test.describe("Response Sequences - Phase 2 Feature Parity", () => {
  test("should demonstrate GitHub polling sequence with visual progression (repeat: 'last')", async ({
    page,
    switchScenario,
  }) => {
    // Switch to GitHub polling scenario
    await switchScenario(page, "githubPolling");
    await page.goto("/sequences");

    // Verify page loaded with correct heading
    await expect(
      page.getByRole("heading", { name: "GitHub Job Polling" }),
    ).toBeVisible();

    // First click - User sees "pending" status
    await page.getByRole("button", { name: "Check Job Status" }).click();

    // Wait for status region to update (aria-live="polite" announces to screen readers)
    const jobStatus = page.getByRole("status").first();
    await expect(jobStatus).toContainText("Job ID: 123");
    await expect(jobStatus).toContainText("Status: pending");
    await expect(jobStatus).toContainText("Progress: 0%");
    await expect(jobStatus).toContainText("Calls made: 1");

    // Verify progress bar reflects 0% (validates ARIA progressbar)
    const progressBar = page.getByRole("progressbar");
    await expect(progressBar).toHaveAttribute("aria-valuenow", "0");

    // Second click - User sees "processing" status
    await page.getByRole("button", { name: "Check Job Status" }).click();
    await expect(jobStatus).toContainText("Status: processing");
    await expect(jobStatus).toContainText("Progress: 50%");
    await expect(jobStatus).toContainText("Calls made: 2");
    await expect(progressBar).toHaveAttribute("aria-valuenow", "50");

    // Third click - User sees "complete" status
    await page.getByRole("button", { name: "Check Job Status" }).click();
    await expect(jobStatus).toContainText("Status: complete");
    await expect(jobStatus).toContainText("Progress: 100%");
    await expect(jobStatus).toContainText("Calls made: 3");
    await expect(progressBar).toHaveAttribute("aria-valuenow", "100");

    // Fourth click - Demonstrates repeat: 'last' (stays at complete)
    await page.getByRole("button", { name: "Check Job Status" }).click();
    await expect(jobStatus).toContainText("Status: complete");
    await expect(jobStatus).toContainText("Progress: 100%");
    await expect(jobStatus).toContainText("Calls made: 4");
  });

  test("should demonstrate weather cycle sequence with visual updates (repeat: 'cycle')", async ({
    page,
    switchScenario,
  }) => {
    // Switch to weather cycle scenario
    await switchScenario(page, "weatherCycle");
    await page.goto("/sequences");

    // Verify page loaded with correct heading
    await expect(
      page.getByRole("heading", { name: "Weather Cycle" }),
    ).toBeVisible();

    const weatherButton = page.getByRole("button", { name: "Get Weather" });

    // First click - Sunny
    await weatherButton.click();

    // Find status region within Weather Cycle section (only section that's been clicked)
    const weatherStatus = page.getByRole("status").first();
    await expect(weatherStatus).toContainText("City: London");
    await expect(weatherStatus).toContainText("Conditions: Sunny");
    await expect(weatherStatus).toContainText("Temperature: 20°C");
    await expect(weatherStatus).toContainText("Calls made: 1");

    // Second click - Cloudy
    await weatherButton.click();
    await expect(weatherStatus).toContainText("Conditions: Cloudy");
    await expect(weatherStatus).toContainText("Temperature: 18°C");
    await expect(weatherStatus).toContainText("Calls made: 2");

    // Third click - Rainy
    await weatherButton.click();
    await expect(weatherStatus).toContainText("Conditions: Rainy");
    await expect(weatherStatus).toContainText("Temperature: 15°C");
    await expect(weatherStatus).toContainText("Calls made: 3");

    // Fourth click - Demonstrates repeat: 'cycle' (back to Sunny)
    await weatherButton.click();
    await expect(weatherStatus).toContainText("Conditions: Sunny");
    await expect(weatherStatus).toContainText("Temperature: 20°C");
    await expect(weatherStatus).toContainText("Calls made: 4");
  });

  test("should demonstrate payment sequence with exhaustion and error (repeat: 'none')", async ({
    page,
    switchScenario,
  }) => {
    // Switch to payment limited scenario
    await switchScenario(page, "paymentLimited");
    await page.goto("/sequences");

    // Verify page loaded with correct heading
    await expect(
      page.getByRole("heading", { name: "Payment Rate Limiting" }),
    ).toBeVisible();

    const paymentButton = page.getByRole("button", { name: "Submit Payment" });

    // First payment - Pending
    await paymentButton.click();

    // Find status region within Payment section (only section that's been clicked)
    // Note: After first payment, only payment status exists (not error alert yet)
    const paymentStatus = page.getByRole("status").first();
    await expect(paymentStatus).toContainText("Payment ID: ch_1");
    await expect(paymentStatus).toContainText("Status: pending");
    await expect(paymentStatus).toContainText("Attempts made: 1");

    // Second payment - Pending
    await paymentButton.click();
    await expect(paymentStatus).toContainText("Payment ID: ch_2");
    await expect(paymentStatus).toContainText("Status: pending");
    await expect(paymentStatus).toContainText("Attempts made: 2");

    // Third payment - Succeeded
    await paymentButton.click();
    await expect(paymentStatus).toContainText("Payment ID: ch_3");
    await expect(paymentStatus).toContainText("Status: succeeded");
    await expect(paymentStatus).toContainText("Attempts made: 3");

    // Fourth payment - Demonstrates repeat: 'none' (rate limit error)
    await paymentButton.click();

    // Error shown in alert region (role="alert" for immediate screen reader announcement)
    // Filter to get our payment alert (Next.js has a route announcer with role="alert")
    const errorAlert = page
      .getByRole("alert")
      .filter({ hasText: "Payment Failed" });
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Payment Failed");
    await expect(errorAlert).toContainText("Rate limit exceeded");
    await expect(errorAlert).toContainText("Attempts made: 4");
  });
});
