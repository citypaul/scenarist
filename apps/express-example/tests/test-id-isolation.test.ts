import { SCENARIST_TEST_ID_HEADER } from "@scenarist/express-adapter";
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";

import { createTestFixtures } from "./test-helpers.js";

const fixtures = await createTestFixtures();

describe("Test ID Isolation E2E", () => {
  afterAll(async () => {
    await fixtures.cleanup();
  });

  it("should allow different test IDs to use different scenarios concurrently", async () => {
    // Test ID 1: Set to success scenario
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "test-id-1")
      .send({ scenario: "success" });

    // Test ID 2: Set to github-not-found scenario
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "test-id-2")
      .send({ scenario: "github-not-found" });

    // Test ID 3: Set to weather-error scenario
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, "test-id-3")
      .send({ scenario: "weather-error" });

    // Verify Test ID 1 gets success scenario data
    const response1 = await request(fixtures.app)
      .get("/api/github/user/testuser")
      .set(SCENARIST_TEST_ID_HEADER, "test-id-1");

    expect(response1.status).toBe(200);
    expect(response1.body.login).toBe("testuser");

    // Verify Test ID 2 gets not-found scenario data
    const response2 = await request(fixtures.app)
      .get("/api/github/user/testuser")
      .set(SCENARIST_TEST_ID_HEADER, "test-id-2");

    expect(response2.status).toBe(404);

    // Verify Test ID 3 gets error scenario data
    const response3 = await request(fixtures.app)
      .get("/api/weather/london")
      .set(SCENARIST_TEST_ID_HEADER, "test-id-3");

    expect(response3.status).toBe(500);
  });

  it("should use default test ID when header is not provided", async () => {
    // Switch default test ID to success scenario
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .send({ scenario: "success" });

    // Request without test ID header (should use default)
    const response = await request(fixtures.app).get(
      "/api/github/user/testuser",
    );

    expect(response.status).toBe(200);
    expect(response.body.login).toBe("testuser");
  });
});
