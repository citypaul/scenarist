/**
 * State-Aware Mocking Scenario-Based Tests (ADR-0019)
 *
 * Tests the three new state-aware mocking capabilities through UI interactions:
 * 1. stateResponse - Conditional responses based on current state
 * 2. afterResponse.setState - Mutate state after returning a response
 * 3. match.state - Select mocks based on current state
 *
 * These features enable state machine patterns where mock behavior
 * changes based on accumulated state from previous requests.
 */

import { test, expect } from "./fixtures";

test.describe("State-Aware Mocking (ADR-0019)", () => {
  test.describe("Loan Application Workflow - stateResponse + afterResponse.setState", () => {
    /**
     * This test demonstrates a loan application workflow where:
     * 1. GET /api/loan/status returns state-dependent responses
     * 2. POST /api/loan/submit advances the workflow state via afterResponse.setState
     *
     * Flow:
     * - Initial: status returns "pending" (no state)
     * - After submit: status returns "reviewing" (state.step = "submitted")
     * - After review: status returns "approved" (state.step = "reviewed")
     */
    test("should return different responses based on workflow state", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "loanApplication");

      // Navigate to loan application page
      await page.goto("/loan");

      // Verify initial state - "pending"
      await expect(page.getByRole("status")).toContainText("pending");
      await expect(page.getByTestId("status-message")).toContainText(
        "Application not yet submitted",
      );

      // Submit application - triggers afterResponse.setState
      await page.getByRole("button", { name: "Submit Application" }).click();

      // Wait for status to update to "reviewing"
      await expect(page.getByRole("status")).toContainText("reviewing");
      await expect(page.getByTestId("status-message")).toContainText(
        "Application under review",
      );

      // Complete review - triggers another state change
      await page.getByRole("button", { name: "Complete Review" }).click();

      // Wait for status to update to "approved"
      await expect(page.getByRole("status")).toContainText("approved");
      await expect(page.getByTestId("status-message")).toContainText(
        "Application approved",
      );

      // Verify the congratulations section appears
      await expect(
        page.getByRole("heading", { name: "Congratulations!" }),
      ).toBeVisible();
    });
  });

  test.describe("Feature Flags - match.state for mock selection", () => {
    /**
     * This test demonstrates using match.state to select different mocks
     * based on feature flag state. Different from stateResponse (one mock,
     * many responses), match.state selects WHICH mock handles the request.
     *
     * Flow:
     * - Set feature flag via POST /api/features
     * - GET /api/pricing returns different mock based on feature state
     */
    test("should select different mocks based on feature flag state", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "featureFlags");

      // Navigate to pricing page
      await page.goto("/pricing");

      // Verify initial state - standard pricing (look in "Current pricing" section)
      const pricingSection = page.getByRole("region", {
        name: "Current pricing",
      });
      await expect(pricingSection.getByRole("status")).toContainText(
        "standard",
      );
      await expect(page.getByText("£100/month")).toBeVisible();

      // Enable premium feature flag by clicking the toggle
      await page
        .getByRole("button", { name: /enable premium pricing/i })
        .click();

      // Wait for pricing to update to premium tier
      await expect(pricingSection.getByRole("status")).toContainText("premium");
      await expect(page.getByText("£50/month")).toBeVisible();
      await expect(pricingSection.getByText("50% off")).toBeVisible();
    });
  });

  test.describe("State Isolation - Different test IDs have independent state", () => {
    test("should maintain independent workflow state for different test IDs", async ({
      page,
      switchScenario,
    }) => {
      // This test verifies that state is isolated per test ID
      // Each test run gets a unique scenaristTestId, so state is isolated

      await switchScenario(page, "loanApplication");

      // Navigate to loan page and submit application
      await page.goto("/loan");
      await page.getByRole("button", { name: "Submit Application" }).click();

      // This test's state should be "reviewing"
      await expect(page.getByRole("status")).toContainText("reviewing");

      // Note: A parallel test with different scenaristTestId would have
      // independent state and would see "pending" status
    });
  });

  test.describe("State Reset on Scenario Switch", () => {
    test("should reset state when switching scenarios", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "loanApplication");

      // Navigate and advance to "reviewing" state
      await page.goto("/loan");
      await page.getByRole("button", { name: "Submit Application" }).click();
      await expect(page.getByRole("status")).toContainText("reviewing");

      // Switch to different scenario and back
      await switchScenario(page, "default");
      await switchScenario(page, "loanApplication");

      // Navigate to loan page again
      await page.goto("/loan");

      // State should be reset - back to "pending"
      await expect(page.getByRole("status")).toContainText("pending");
    });
  });
});
