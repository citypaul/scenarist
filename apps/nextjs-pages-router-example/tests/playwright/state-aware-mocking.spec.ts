/**
 * State-Aware Mocking Scenario-Based Tests (ADR-0019)
 *
 * Tests the three new state-aware mocking capabilities:
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
      baseURL,
    }) => {
      await switchScenario(page, "loanApplication");

      // Initial state - no step set, returns default "pending"
      const status1 = await page.request.get(`${baseURL}/api/loan/status`);
      expect(status1.ok()).toBe(true);
      const status1Data = await status1.json();
      expect(status1Data.status).toBe("pending");
      expect(status1Data.message).toBe("Application not yet submitted");

      // Submit application - sets state.step = "submitted" via afterResponse.setState
      const submit = await page.request.post(`${baseURL}/api/loan/submit`, {
        data: { amount: 10000 },
      });
      expect(submit.ok()).toBe(true);
      const submitData = await submit.json();
      expect(submitData.success).toBe(true);

      // After submit - stateResponse condition matches step = "submitted"
      const status2 = await page.request.get(`${baseURL}/api/loan/status`);
      expect(status2.ok()).toBe(true);
      const status2Data = await status2.json();
      expect(status2Data.status).toBe("reviewing");
      expect(status2Data.message).toBe("Application under review");

      // Review completes - sets state.step = "reviewed"
      const review = await page.request.post(`${baseURL}/api/loan/review`);
      expect(review.ok()).toBe(true);

      // After review - stateResponse condition matches step = "reviewed"
      const status3 = await page.request.get(`${baseURL}/api/loan/status`);
      expect(status3.ok()).toBe(true);
      const status3Data = await status3.json();
      expect(status3Data.status).toBe("approved");
      expect(status3Data.message).toBe("Application approved");
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
      baseURL,
    }) => {
      await switchScenario(page, "featureFlags");

      // Initial state - no feature flags, returns standard pricing
      const pricing1 = await page.request.get(`${baseURL}/api/pricing`);
      expect(pricing1.ok()).toBe(true);
      const pricing1Data = await pricing1.json();
      expect(pricing1Data.tier).toBe("standard");
      expect(pricing1Data.price).toBe(100);

      // Enable premium feature flag
      const enableFlag = await page.request.post(`${baseURL}/api/features`, {
        data: { flag: "premium_pricing", enabled: true },
      });
      expect(enableFlag.ok()).toBe(true);
      const enableFlagData = await enableFlag.json();
      expect(enableFlagData).toEqual({
        success: true,
        message: "Feature flag updated",
      });

      // Now pricing returns premium tier (mock selected via match.state)
      const pricing2 = await page.request.get(`${baseURL}/api/pricing`);
      expect(pricing2.ok()).toBe(true);
      const pricing2Data = await pricing2.json();
      expect(pricing2Data.tier).toBe("premium");
      expect(pricing2Data.price).toBe(50);
    });
  });

  test.describe("State Isolation - Different test IDs have independent state", () => {
    test("should maintain independent workflow state for different test IDs", async ({
      page,
      switchScenario,
      baseURL,
    }) => {
      // This test verifies that state is isolated per test ID
      // Each test run gets a unique scenaristTestId, so state is isolated

      await switchScenario(page, "loanApplication");

      // Submit application in this test's context
      await page.request.post(`${baseURL}/api/loan/submit`, {
        data: { amount: 10000 },
      });

      // This test's state should be "reviewing"
      const status = await page.request.get(`${baseURL}/api/loan/status`);
      const statusData = await status.json();
      expect(statusData.status).toBe("reviewing");

      // Note: A parallel test with different scenaristTestId would have
      // independent state and would see "pending" status
    });
  });

  test.describe("State Reset on Scenario Switch", () => {
    test("should reset state when switching scenarios", async ({
      page,
      switchScenario,
      baseURL,
    }) => {
      await switchScenario(page, "loanApplication");

      // Advance to "reviewing" state
      await page.request.post(`${baseURL}/api/loan/submit`, {
        data: { amount: 10000 },
      });

      const status1 = await page.request.get(`${baseURL}/api/loan/status`);
      const status1Data = await status1.json();
      expect(status1Data.status).toBe("reviewing");

      // Switch to different scenario and back
      await switchScenario(page, "default");
      await switchScenario(page, "loanApplication");

      // State should be reset - back to "pending"
      const status2 = await page.request.get(`${baseURL}/api/loan/status`);
      const status2Data = await status2.json();
      expect(status2Data.status).toBe("pending");
    });
  });
});
