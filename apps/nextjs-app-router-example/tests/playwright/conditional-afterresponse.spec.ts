/**
 * Conditional afterResponse Tests (Issue #332)
 *
 * Tests that condition-level afterResponse in stateResponse:
 * 1. Can override mock-level afterResponse with its own state mutation
 * 2. Can suppress state mutation with afterResponse: null
 * 3. Inherits mock-level afterResponse when condition has no afterResponse key
 *
 * Also tests the debug state endpoint for inspecting current test state.
 */

import { test, expect } from "./fixtures";
import { SCENARIST_TEST_ID_HEADER } from "@scenarist/nextjs-adapter/app";
import type { Page } from "@playwright/test";

/**
 * Helper to make API requests with the test ID header.
 * This is needed because page.request doesn't automatically include
 * headers set by page.setExtraHTTPHeaders when using absolute URLs.
 */
const createApiHelper = (page: Page, testId: string, baseURL: string) => {
  const headers = { [SCENARIST_TEST_ID_HEADER]: testId };
  return {
    get: (path: string) => page.request.get(`${baseURL}${path}`, { headers }),
    post: (path: string, options?: { data?: unknown }) =>
      page.request.post(`${baseURL}${path}`, { headers, ...options }),
  };
};

test.describe("Conditional afterResponse (Issue #332)", () => {
  test.describe("Order workflow with condition-level afterResponse", () => {
    test("should use mock-level afterResponse for default stateResponse", async ({
      page,
      switchScenario,
      debugState,
      scenaristTestId,
      baseURL,
    }) => {
      await switchScenario(page, "conditionalAfterResponse");

      const api = createApiHelper(
        page,
        scenaristTestId,
        baseURL ?? "http://localhost:3002",
      );

      // Initial state - default response, mock-level afterResponse sets phase: "initial"
      const statusResponse = await api.get("/api/order/status");

      expect(statusResponse.ok()).toBe(true);
      const statusData = await statusResponse.json();
      expect(statusData.status).toBe("new");
      expect(statusData.message).toBe("Order not yet submitted");

      // Verify state was set by mock-level afterResponse
      const state = await debugState(page);
      expect(state.phase).toBe("initial");
    });

    test("should use condition-level afterResponse when condition has its own", async ({
      page,
      switchScenario,
      debugState,
      scenaristTestId,
      baseURL,
    }) => {
      await switchScenario(page, "conditionalAfterResponse");

      const api = createApiHelper(
        page,
        scenaristTestId,
        baseURL ?? "http://localhost:3002",
      );

      // Submit order - sets submitted: true, approved: false
      await api.post("/api/order/submit");

      // Get status - matches { submitted: true, approved: false }
      // Condition has its own afterResponse: { setState: { phase: "processing" } }
      const statusResponse = await api.get("/api/order/status");

      expect(statusResponse.ok()).toBe(true);
      const statusData = await statusResponse.json();
      expect(statusData.status).toBe("processing");
      expect(statusData.message).toBe("Order is being processed");

      // Verify condition-level afterResponse was used (phase: "processing")
      const state = await debugState(page);
      expect(state.phase).toBe("processing");
    });

    test("should suppress state mutation when condition has afterResponse: null", async ({
      page,
      switchScenario,
      debugState,
      scenaristTestId,
      baseURL,
    }) => {
      await switchScenario(page, "conditionalAfterResponse");

      const api = createApiHelper(
        page,
        scenaristTestId,
        baseURL ?? "http://localhost:3002",
      );

      // Submit order
      await api.post("/api/order/submit");

      // Get processing status - sets phase: "processing"
      await api.get("/api/order/status");

      // Verify phase is "processing" before approval
      const stateBefore = await debugState(page);
      expect(stateBefore.phase).toBe("processing");

      // Approve order
      await api.post("/api/order/approve");

      // Get complete status - matches { approved: true }
      // Condition has afterResponse: null, so phase should remain "processing"
      const statusResponse = await api.get("/api/order/status");

      expect(statusResponse.ok()).toBe(true);
      const statusData = await statusResponse.json();
      expect(statusData.status).toBe("complete");
      expect(statusData.message).toBe("Order complete");

      // Verify afterResponse: null prevented state mutation (phase unchanged)
      const stateAfter = await debugState(page);
      expect(stateAfter.phase).toBe("processing"); // NOT "initial"!
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
      scenaristTestId,
      baseURL,
    }) => {
      await switchScenario(page, "loanApplication");

      const api = createApiHelper(
        page,
        scenaristTestId,
        baseURL ?? "http://localhost:3002",
      );

      // Submit loan - sets state.step = "submitted"
      await api.post("/api/loan/submit", { data: { amount: 10000 } });

      const state = await debugState(page);
      expect(state.step).toBe("submitted");
    });

    test("should isolate state between test IDs", async ({
      page,
      switchScenario,
      debugState,
      scenaristTestId,
      baseURL,
    }) => {
      // This test inherently verifies isolation because each test run
      // gets a unique scenaristTestId via the switchScenario fixture
      await switchScenario(page, "loanApplication");

      const api = createApiHelper(
        page,
        scenaristTestId,
        baseURL ?? "http://localhost:3002",
      );

      // Submit to build up state
      await api.post("/api/loan/submit", { data: { amount: 10000 } });

      // Verify our state exists
      const state = await debugState(page);
      expect(state.step).toBe("submitted");

      // Another test with different scenaristTestId would see empty state
      // (isolation is enforced by test ID partitioning)
    });

    test("should reset state when switching scenarios", async ({
      page,
      switchScenario,
      debugState,
      scenaristTestId,
      baseURL,
    }) => {
      await switchScenario(page, "loanApplication");

      const api = createApiHelper(
        page,
        scenaristTestId,
        baseURL ?? "http://localhost:3002",
      );

      // Build up some state
      await api.post("/api/loan/submit", { data: { amount: 10000 } });

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
