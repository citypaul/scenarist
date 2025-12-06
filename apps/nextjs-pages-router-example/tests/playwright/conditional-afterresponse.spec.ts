/**
 * Conditional afterResponse Tests (Issue #332)
 *
 * Tests that condition-level afterResponse in stateResponse:
 * 1. Can override mock-level afterResponse with its own state mutation
 * 2. Can suppress state mutation with afterResponse: null
 * 3. Inherits mock-level afterResponse when condition has no afterResponse key
 *
 * These tests interact with the UI and use debugState to verify internal state,
 * treating the implementation as a black box.
 */

import { test, expect } from "./fixtures";

test.describe("Conditional afterResponse (Issue #332)", () => {
  test.describe("Order workflow with condition-level afterResponse", () => {
    test("should use mock-level afterResponse for default stateResponse", async ({
      page,
      switchScenario,
      debugState,
    }) => {
      await switchScenario(page, "conditionalAfterResponse");

      // Navigate to order page - initial load triggers GET /api/order/status
      await page.goto("/order");

      // Verify UI shows "new" status
      await expect(page.getByRole("status")).toContainText("new");
      await expect(page.getByTestId("status-message")).toContainText(
        "Order not yet submitted",
      );

      // Verify state was set by mock-level afterResponse
      const state = await debugState(page);
      expect(state.phase).toBe("initial");
    });

    test("should use condition-level afterResponse when condition has its own", async ({
      page,
      switchScenario,
      debugState,
    }) => {
      await switchScenario(page, "conditionalAfterResponse");

      // Navigate to order page
      await page.goto("/order");

      // Submit order - triggers afterResponse that sets submitted: true, approved: false
      await page.getByRole("button", { name: "Submit Order" }).click();

      // Wait for status to update to "processing"
      await expect(page.getByRole("status")).toContainText("processing");
      await expect(page.getByTestId("status-message")).toContainText(
        "Order is being processed",
      );

      // Verify condition-level afterResponse was used (phase: "processing")
      const state = await debugState(page);
      expect(state.phase).toBe("processing");
    });

    test("should suppress state mutation when condition has afterResponse: null", async ({
      page,
      switchScenario,
      debugState,
    }) => {
      await switchScenario(page, "conditionalAfterResponse");

      // Navigate to order page
      await page.goto("/order");

      // Submit order
      await page.getByRole("button", { name: "Submit Order" }).click();

      // Wait for processing status
      await expect(page.getByRole("status")).toContainText("processing");

      // Verify phase is "processing" before approval
      const stateBefore = await debugState(page);
      expect(stateBefore.phase).toBe("processing");

      // Approve order
      await page.getByRole("button", { name: "Approve Order" }).click();

      // Wait for complete status
      await expect(page.getByRole("status")).toContainText("complete");
      await expect(page.getByTestId("status-message")).toContainText(
        "Order complete",
      );

      // Verify afterResponse: null prevented state mutation (phase unchanged)
      const stateAfter = await debugState(page);
      expect(stateAfter.phase).toBe("processing"); // NOT "initial"!
    });

    test("should complete the full order workflow through UI", async ({
      page,
      switchScenario,
    }) => {
      await switchScenario(page, "conditionalAfterResponse");

      // Navigate to order page
      await page.goto("/order");

      // Initial state - "new"
      await expect(page.getByRole("status")).toContainText("new");

      // Submit order
      await page.getByRole("button", { name: "Submit Order" }).click();
      await expect(page.getByRole("status")).toContainText("processing");

      // Approve order
      await page.getByRole("button", { name: "Approve Order" }).click();
      await expect(page.getByRole("status")).toContainText("complete");

      // Verify the completion section appears
      await expect(
        page.getByRole("heading", { name: "Order Complete!" }),
      ).toBeVisible();
    });
  });

  test.describe("Debug State Endpoint", () => {
    test("should return empty state for new test ID", async ({
      page,
      switchScenario,
      debugState,
    }) => {
      await switchScenario(page, "loanApplication");

      // Fresh test - should have empty state
      const state = await debugState(page);
      expect(state).toEqual({});
    });

    test("should return current state after mutations", async ({
      page,
      switchScenario,
      debugState,
    }) => {
      await switchScenario(page, "loanApplication");

      // Navigate to loan page and submit
      await page.goto("/loan");
      await page.getByRole("button", { name: "Submit Application" }).click();

      // Wait for status to update
      await expect(page.getByRole("status")).toContainText("reviewing");

      // Verify state was set
      const state = await debugState(page);
      expect(state.step).toBe("submitted");
    });

    test("should reset state when switching scenarios", async ({
      page,
      switchScenario,
      debugState,
    }) => {
      await switchScenario(page, "loanApplication");

      // Navigate and advance to "reviewing" state
      await page.goto("/loan");
      await page.getByRole("button", { name: "Submit Application" }).click();
      await expect(page.getByRole("status")).toContainText("reviewing");

      // Verify state exists
      const stateBefore = await debugState(page);
      expect(stateBefore.step).toBe("submitted");

      // Switch scenario - should reset state
      await switchScenario(page, "default");

      // State should be reset
      const stateAfter = await debugState(page);
      expect(stateAfter).toEqual({});
    });
  });
});
