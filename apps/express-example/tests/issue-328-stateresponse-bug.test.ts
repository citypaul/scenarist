import { SCENARIST_TEST_ID_HEADER } from "@scenarist/express-adapter";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";

import { createTestFixtures } from "./test-helpers.js";

const fixtures = createTestFixtures();

/**
 * Issue #328: stateResponse conditions not evaluated when default scenario
 * has sequence mock for same endpoint.
 *
 * BUG REPRODUCTION TEST
 *
 * This test reproduces the exact pattern from plum-bff that fails:
 *
 * Setup:
 * - Default scenario has SEQUENCE mock for GET /applications/:id
 *   (returns { state: 'appStarted', source: 'default-sequence' })
 *
 * - Active scenario (issue328-stateresponse) has STATERESPONSE mock for same endpoint
 *   (returns { state: 'quoteAccept', source: 'stateResponse-condition' } when phase='quoteAccept')
 *
 * - POST /eligibility sets state { phase: 'quoteAccept' } via afterResponse.setState
 *
 * Expected behavior:
 * 1. Switch to issue328-stateresponse scenario
 * 2. POST /eligibility → sets state { phase: 'quoteAccept' }
 * 3. GET /applications/:id → should return stateResponse condition match:
 *    { state: 'quoteAccept', source: 'stateResponse-condition' }
 *
 * Actual behavior (BUG):
 * - GET /applications/:id always returns default response:
 *   { state: 'appStarted', source: 'stateResponse-default' }
 *
 * OR even worse (if sequence mock wins):
 *   { state: 'appStarted', source: 'default-sequence' }
 *
 * Root cause investigation:
 * - Debug logs show `hasCriteria: false` and `specificity: 0`
 * - This suggests the stateResponse mock isn't being recognized properly
 *
 * @see https://github.com/citypaul/scenarist/issues/328
 */
describe("Issue #328: stateResponse conditions not evaluated", () => {
  afterAll(async () => {
    await fixtures.cleanup();
  });

  /**
   * Diagnostic test: Verify the mock array structure
   *
   * This test verifies that:
   * 1. The stateResponse property exists on the mock at runtime
   * 2. The conditions array is properly defined
   * 3. The mock structure matches what response-selector expects
   */
  describe("Diagnostic: Mock structure verification", () => {
    it("should verify stateResponse property exists on mock object", async () => {
      // Import the scenarios directly to inspect at runtime
      // This helps diagnose if the property is being lost during import/export
      const { scenarios } = await import("../src/scenarios.js");

      const stateResponseScenario = scenarios["issue328-stateresponse"];
      expect(stateResponseScenario).toBeDefined();
      expect(stateResponseScenario.mocks).toBeDefined();
      expect(stateResponseScenario.mocks.length).toBeGreaterThan(0);

      // Find the GET mock with stateResponse
      const getMock = stateResponseScenario.mocks.find(
        (m) => m.method === "GET" && m.stateResponse,
      );

      // THE CRITICAL CHECK: Does the mock have stateResponse at runtime?
      expect(getMock).toBeDefined();
      if (!getMock) throw new Error("getMock is undefined");
      expect(getMock.stateResponse).toBeDefined();
      if (!getMock.stateResponse) throw new Error("stateResponse is undefined");
      expect(getMock.stateResponse.default).toBeDefined();
      expect(getMock.stateResponse.conditions).toBeDefined();
      expect(Array.isArray(getMock.stateResponse.conditions)).toBe(true);

      // Verify default scenario has sequence mock
      const defaultScenario = scenarios["default"];
      const sequenceMock = defaultScenario.mocks.find(
        (m) =>
          m.method === "GET" &&
          typeof m.url === "string" &&
          m.url.includes("issue328") &&
          m.sequence,
      );

      expect(sequenceMock).toBeDefined();
      if (!sequenceMock) throw new Error("sequenceMock is undefined");
      expect(sequenceMock.sequence).toBeDefined();
      if (!sequenceMock.sequence) throw new Error("sequence is undefined");
      expect(sequenceMock.sequence.responses).toBeDefined();
    });
  });

  describe("BUG: Default sequence vs Active stateResponse - same endpoint", () => {
    /**
     * This test MUST FAIL to prove the bug exists.
     *
     * If it passes, then:
     * 1. The bug has been fixed, OR
     * 2. The test doesn't reproduce the exact conditions
     */
    it("should return stateResponse condition when state is set, NOT default sequence", async () => {
      const testId = "issue328-bug-test-1";

      // Step 1: Switch to the scenario with stateResponse
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, testId)
        .send({ scenario: "issue328-stateresponse" });

      // Step 2: First GET - should return stateResponse DEFAULT (not sequence!)
      // This verifies the stateResponse mock is being selected at all
      const firstGet = await request(fixtures.app)
        .get("/api/issue328/applications/app-123")
        .set(SCENARIST_TEST_ID_HEADER, testId);

      // IMPORTANT: This assertion tells us WHICH mock was selected
      // - "stateResponse-default" = stateResponse mock selected (correct)
      // - "default-sequence" = sequence mock selected (bug!)
      expect(firstGet.status).toBe(200);
      expect(firstGet.body.source).toBe("stateResponse-default");
      expect(firstGet.body.state).toBe("appStarted");

      // Step 3: POST /eligibility - sets state { phase: 'quoteAccept' }
      const postEligibility = await request(fixtures.app)
        .post("/api/issue328/applications/app-123/eligibility")
        .set(SCENARIST_TEST_ID_HEADER, testId)
        .send({ amount: 10000 });

      expect(postEligibility.status).toBe(200);

      // Step 4: Second GET - should now match stateResponse CONDITION
      // This is where the bug manifests
      const secondGet = await request(fixtures.app)
        .get("/api/issue328/applications/app-123")
        .set(SCENARIST_TEST_ID_HEADER, testId);

      expect(secondGet.status).toBe(200);

      // THE CRITICAL ASSERTION - This is where the bug manifests
      // Expected: { state: 'quoteAccept', source: 'stateResponse-condition' }
      // Actual (bug): { state: 'appStarted', source: 'stateResponse-default' }
      //           or: { state: 'appStarted', source: 'default-sequence' }
      expect(secondGet.body).toEqual({
        state: "quoteAccept",
        source: "stateResponse-condition",
      });
    });

    /**
     * Variant: Multiple state transitions
     *
     * Tests the full workflow from appStarted → quoteAccept → sign
     */
    it("should correctly evaluate stateResponse conditions through multiple state transitions", async () => {
      const testId = "issue328-bug-test-2";

      // Switch to stateResponse scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, testId)
        .send({ scenario: "issue328-stateresponse" });

      // Initial state - should be appStarted (stateResponse default)
      const initial = await request(fixtures.app)
        .get("/api/issue328/applications/app-456")
        .set(SCENARIST_TEST_ID_HEADER, testId);

      expect(initial.body.state).toBe("appStarted");
      expect(initial.body.source).toBe("stateResponse-default");

      // Transition 1: POST eligibility → sets phase: 'quoteAccept'
      await request(fixtures.app)
        .post("/api/issue328/applications/app-456/eligibility")
        .set(SCENARIST_TEST_ID_HEADER, testId)
        .send({});

      // Check state transition - should now be quoteAccept
      const afterEligibility = await request(fixtures.app)
        .get("/api/issue328/applications/app-456")
        .set(SCENARIST_TEST_ID_HEADER, testId);

      expect(afterEligibility.body.state).toBe("quoteAccept");
      expect(afterEligibility.body.source).toBe("stateResponse-condition");
    });
  });

  describe("Control: Verify stateResponse works WITHOUT default sequence conflict", () => {
    /**
     * This test uses the existing loanApplication scenario which has
     * stateResponse but NO conflicting default sequence mock.
     *
     * If this passes but the above fails, we've isolated the bug to
     * the default sequence + active stateResponse interaction.
     */
    it("should work correctly when no default sequence conflict exists", async () => {
      const testId = "issue328-control-test";

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, testId)
        .send({ scenario: "loanApplication" });

      // Initial state - pending
      const initial = await request(fixtures.app)
        .get("/api/loan/status")
        .set(SCENARIST_TEST_ID_HEADER, testId);

      expect(initial.body.status).toBe("pending");

      // Submit - sets state
      await request(fixtures.app)
        .post("/api/loan/submit")
        .set(SCENARIST_TEST_ID_HEADER, testId)
        .send({ amount: 10000 });

      // After submit - should be reviewing
      const afterSubmit = await request(fixtures.app)
        .get("/api/loan/status")
        .set(SCENARIST_TEST_ID_HEADER, testId);

      expect(afterSubmit.body.status).toBe("reviewing");
    });
  });

  describe("Monorepo simulation: Verify 'as const satisfies' pattern doesn't break stateResponse", () => {
    /**
     * This test replicates the EXACT plum-bff pattern to see if
     * the TypeScript 'as const satisfies ScenaristScenarios' pattern
     * could be causing the stateResponse property to be lost at runtime.
     *
     * The plum-bff scenario structure:
     * ```typescript
     * export const scenarios = {
     *   default: { ... sequence mock ... },
     *   'eligible-stateful': { ... stateResponse mock ... }
     * } as const satisfies ScenaristScenarios;
     * ```
     */
    it("should verify mock properties are preserved at runtime with satisfies pattern", async () => {
      // Import the scenarios to verify runtime structure matches
      const { scenarios } = await import("../src/scenarios.js");

      // The issue328-stateresponse scenario MUST have stateResponse property
      const stateResponseScenario = scenarios["issue328-stateresponse"];

      // Find the GET mock that should have stateResponse
      const getMock = stateResponseScenario.mocks.find(
        (m) =>
          m.method === "GET" &&
          typeof m.url === "string" &&
          m.url.includes("issue328") &&
          m.stateResponse,
      );

      // CRITICAL: Log the actual mock structure for debugging
      console.log("\n=== MOCK STRUCTURE VERIFICATION ===");
      console.log("Mock found:", getMock ? "YES" : "NO");

      if (getMock) {
        console.log("Has stateResponse:", "stateResponse" in getMock);
        console.log(
          "stateResponse.default:",
          getMock.stateResponse?.default ? "YES" : "NO",
        );
        console.log(
          "stateResponse.conditions:",
          getMock.stateResponse?.conditions
            ? `Array[${getMock.stateResponse.conditions.length}]`
            : "NO",
        );
      }

      // The mock MUST have stateResponse with conditions
      expect(getMock).toBeDefined();
      if (!getMock) throw new Error("getMock is undefined");

      expect(getMock.stateResponse).toBeDefined();
      if (!getMock.stateResponse) throw new Error("stateResponse is undefined");

      expect(getMock.stateResponse.conditions).toBeInstanceOf(Array);
      expect(getMock.stateResponse.conditions.length).toBeGreaterThan(0);

      // Verify the condition structure
      const quoteAcceptCondition = getMock.stateResponse.conditions.find(
        (c: { when: Record<string, unknown> }) =>
          c.when.phase === "quoteAccept",
      );
      expect(quoteAcceptCondition).toBeDefined();
      if (!quoteAcceptCondition)
        throw new Error("quoteAcceptCondition not found");

      const thenBody = quoteAcceptCondition.then.body as { state: string };
      expect(thenBody.state).toBe("quoteAccept");
    });
  });
});
