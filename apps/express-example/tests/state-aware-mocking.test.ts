import { SCENARIST_TEST_ID_HEADER } from "@scenarist/express-adapter";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";

import { createTestFixtures } from "./test-helpers.js";
const fixtures = createTestFixtures();

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
describe("State-Aware Mocking (ADR-0019)", () => {
  afterAll(async () => {
    await fixtures.cleanup();
  });

  describe("Loan Application Workflow - stateResponse + afterResponse.setState", () => {
    /**
     * This test demonstrates a loan application workflow where:
     * 1. GET /loan/status returns state-dependent responses
     * 2. POST /loan/submit advances the workflow state via afterResponse.setState
     *
     * Flow:
     * - Initial: status returns "pending" (no state)
     * - After submit: status returns "reviewing" (state.step = "submitted")
     * - After review: status returns "approved" (state.step = "reviewed")
     */
    it("should return different responses based on workflow state", async () => {
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "loan-workflow-1")
        .send({ scenario: "loanApplication" });

      // Initial state - no step set, returns default "pending"
      const status1 = await request(fixtures.app)
        .get("/api/loan/status")
        .set(SCENARIST_TEST_ID_HEADER, "loan-workflow-1");

      expect(status1.status).toBe(200);
      expect(status1.body.status).toBe("pending");
      expect(status1.body.message).toBe("Application not yet submitted");

      // Submit application - sets state.step = "submitted" via afterResponse.setState
      const submit = await request(fixtures.app)
        .post("/api/loan/submit")
        .set(SCENARIST_TEST_ID_HEADER, "loan-workflow-1")
        .send({ amount: 10000 });

      expect(submit.status).toBe(200);
      expect(submit.body.success).toBe(true);

      // After submit - stateResponse condition matches step = "submitted"
      const status2 = await request(fixtures.app)
        .get("/api/loan/status")
        .set(SCENARIST_TEST_ID_HEADER, "loan-workflow-1");

      expect(status2.status).toBe(200);
      expect(status2.body.status).toBe("reviewing");
      expect(status2.body.message).toBe("Application under review");

      // Review completes - sets state.step = "reviewed"
      const review = await request(fixtures.app)
        .post("/api/loan/review")
        .set(SCENARIST_TEST_ID_HEADER, "loan-workflow-1");

      expect(review.status).toBe(200);

      // After review - stateResponse condition matches step = "reviewed"
      const status3 = await request(fixtures.app)
        .get("/api/loan/status")
        .set(SCENARIST_TEST_ID_HEADER, "loan-workflow-1");

      expect(status3.status).toBe(200);
      expect(status3.body.status).toBe("approved");
      expect(status3.body.message).toBe("Application approved");
    });
  });

  describe("Feature Flags - match.state for mock selection", () => {
    /**
     * This test demonstrates using match.state to select different mocks
     * based on feature flag state. Different from stateResponse (one mock,
     * many responses), match.state selects WHICH mock handles the request.
     *
     * Flow:
     * - Set feature flag via POST /features
     * - GET /api/pricing returns different mock based on feature state
     */
    it("should select different mocks based on feature flag state", async () => {
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "feature-flag-1")
        .send({ scenario: "featureFlags" });

      // Initial state - no feature flags, returns standard pricing
      const pricing1 = await request(fixtures.app)
        .get("/api/pricing")
        .set(SCENARIST_TEST_ID_HEADER, "feature-flag-1");

      expect(pricing1.status).toBe(200);
      expect(pricing1.body.tier).toBe("standard");
      expect(pricing1.body.price).toBe(100);

      // Enable premium feature flag
      const enableFlag = await request(fixtures.app)
        .post("/api/features")
        .set(SCENARIST_TEST_ID_HEADER, "feature-flag-1")
        .send({ flag: "premium_pricing", enabled: true });

      expect(enableFlag.status).toBe(200);
      expect(enableFlag.body).toEqual({
        success: true,
        message: "Feature flag updated",
      });

      // Now pricing returns premium tier (mock selected via match.state)
      const pricing2 = await request(fixtures.app)
        .get("/api/pricing")
        .set(SCENARIST_TEST_ID_HEADER, "feature-flag-1");

      expect(pricing2.status).toBe(200);
      expect(pricing2.body.tier).toBe("premium");
      expect(pricing2.body.price).toBe(50);
    });
  });

  describe("State Isolation - Different test IDs have independent state", () => {
    it("should maintain independent workflow state for different test IDs", async () => {
      // Set up both tests with same scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "isolation-A")
        .send({ scenario: "loanApplication" });

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "isolation-B")
        .send({ scenario: "loanApplication" });

      // Test A submits application
      await request(fixtures.app)
        .post("/api/loan/submit")
        .set(SCENARIST_TEST_ID_HEADER, "isolation-A")
        .send({ amount: 10000 });

      // Test A should be "reviewing"
      const statusA = await request(fixtures.app)
        .get("/api/loan/status")
        .set(SCENARIST_TEST_ID_HEADER, "isolation-A");

      expect(statusA.body.status).toBe("reviewing");

      // Test B should still be "pending" (independent state)
      const statusB = await request(fixtures.app)
        .get("/api/loan/status")
        .set(SCENARIST_TEST_ID_HEADER, "isolation-B");

      expect(statusB.body.status).toBe("pending");
    });
  });

  describe("State Reset on Scenario Switch", () => {
    it("should reset state-aware workflow when switching scenarios", async () => {
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "reset-test")
        .send({ scenario: "loanApplication" });

      // Advance to "reviewing" state
      await request(fixtures.app)
        .post("/api/loan/submit")
        .set(SCENARIST_TEST_ID_HEADER, "reset-test")
        .send({ amount: 10000 });

      const status1 = await request(fixtures.app)
        .get("/api/loan/status")
        .set(SCENARIST_TEST_ID_HEADER, "reset-test");

      expect(status1.body.status).toBe("reviewing");

      // Switch to different scenario and back
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "reset-test")
        .send({ scenario: "success" });

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "reset-test")
        .send({ scenario: "loanApplication" });

      // State should be reset - back to "pending"
      const status2 = await request(fixtures.app)
        .get("/api/loan/status")
        .set(SCENARIST_TEST_ID_HEADER, "reset-test");

      expect(status2.body.status).toBe("pending");
    });
  });
});
