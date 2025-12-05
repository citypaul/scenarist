import { SCENARIST_TEST_ID_HEADER } from "@scenarist/express-adapter";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";

import { createTestFixtures } from "./test-helpers.js";

const fixtures = createTestFixtures();

/**
 * Issue #335: Scenario switching must use active scenario's response
 *
 * When switching to a scenario, that scenario's mocks must take precedence
 * over default scenario mocks for the same endpoint - regardless of specificity.
 *
 * @see https://github.com/citypaul/scenarist/issues/335
 */
describe("Issue #335: Active scenario simple response overrides default sequence", () => {
  afterAll(async () => {
    await fixtures.cleanup();
  });

  it("returns active scenario's simple response instead of default's sequence mock", async () => {
    const testId = "issue335-simple-response-wins";

    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, testId)
      .send({ scenario: "issue335-simple-response" });

    const response = await request(fixtures.app)
      .get("/api/issue328/applications/app-123")
      .set(SCENARIST_TEST_ID_HEADER, testId);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      state: "ready",
      source: "issue335-simple-response",
    });
  });

  it("uses default sequence when no scenario is set", async () => {
    const testId = "issue335-default-still-works";

    const response = await request(fixtures.app)
      .get("/api/issue328/applications/app-456")
      .set(SCENARIST_TEST_ID_HEADER, testId);

    expect(response.status).toBe(200);
    expect(response.body.source).toBe("default-sequence");
  });

  it("resumes default sequence after switching back from active scenario", async () => {
    const testId = "issue335-switch-back";

    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, testId)
      .send({ scenario: "issue335-simple-response" });

    const firstResponse = await request(fixtures.app)
      .get("/api/issue328/applications/app-789")
      .set(SCENARIST_TEST_ID_HEADER, testId);

    expect(firstResponse.body.source).toBe("issue335-simple-response");

    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, testId)
      .send({ scenario: "default" });

    const secondResponse = await request(fixtures.app)
      .get("/api/issue328/applications/app-789")
      .set(SCENARIST_TEST_ID_HEADER, testId);

    expect(secondResponse.body.source).toBe("default-sequence");
  });
});
