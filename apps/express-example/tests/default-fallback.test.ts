import { SCENARIST_TEST_ID_HEADER } from "@scenarist/express-adapter";
import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";

import { createTestFixtures } from "./test-helpers.js";

const fixtures = await createTestFixtures();

describe("Default Scenario Fallback E2E", () => {
  afterAll(async () => {
    await fixtures.cleanup();
  });

  describe("Partial scenario fallback", () => {
    it("should fall back to default for unmocked endpoints in github-not-found scenario", async () => {
      // github-not-found only defines GitHub mock, not weather or stripe
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-1")
        .send({ scenario: "github-not-found" });

      // GitHub should use github-not-found scenario
      const githubResponse = await request(fixtures.app)
        .get("/api/github/user/testuser")
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-1");

      expect(githubResponse.status).toBe(404);
      expect(githubResponse.body.message).toBe("Not Found");

      // Weather should fall back to default scenario
      const weatherResponse = await request(fixtures.app)
        .get("/api/weather/london")
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-1");

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body).toEqual({
        city: "London",
        temperature: 18,
        conditions: "Cloudy",
        humidity: 65,
      });

      // Stripe should also fall back to default scenario
      const stripeResponse = await request(fixtures.app)
        .post("/api/payment")
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-1")
        .send({ amount: 1000, currency: "usd" });

      expect(stripeResponse.status).toBe(200);
      expect(stripeResponse.body.id).toBe("ch_default123");
    });

    it("should fall back to default for unmocked endpoints in weather-error scenario", async () => {
      // weather-error only defines weather mock, not GitHub or stripe
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-2")
        .send({ scenario: "weather-error" });

      // Weather should use weather-error scenario
      const weatherResponse = await request(fixtures.app)
        .get("/api/weather/tokyo")
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-2");

      expect(weatherResponse.status).toBe(500);
      expect(weatherResponse.body.error).toBe("Internal Server Error");

      // GitHub should fall back to default scenario
      const githubResponse = await request(fixtures.app)
        .get("/api/github/user/testuser")
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-2");

      expect(githubResponse.status).toBe(200);
      expect(githubResponse.body.login).toBe("octocat");

      // Stripe should also fall back to default
      const stripeResponse = await request(fixtures.app)
        .post("/api/payment")
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-2")
        .send({ amount: 1000, currency: "usd" });

      expect(stripeResponse.status).toBe(200);
      expect(stripeResponse.body.id).toBe("ch_default123");
    });

    it("should fall back to default for unmocked endpoints in stripe-failure scenario", async () => {
      // stripe-failure only defines stripe mock, not GitHub or weather
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-3")
        .send({ scenario: "stripe-failure" });

      // Stripe should use stripe-failure scenario
      const stripeResponse = await request(fixtures.app)
        .post("/api/payment")
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-3")
        .send({ amount: 1000, currency: "usd" });

      expect(stripeResponse.status).toBe(402);
      expect(stripeResponse.body.error.code).toBe("insufficient_funds");

      // GitHub should fall back to default
      const githubResponse = await request(fixtures.app)
        .get("/api/github/user/testuser")
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-3");

      expect(githubResponse.status).toBe(200);
      expect(githubResponse.body.login).toBe("octocat");

      // Weather should fall back to default
      const weatherResponse = await request(fixtures.app)
        .get("/api/weather/london")
        .set(SCENARIST_TEST_ID_HEADER, "fallback-test-3");

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body.city).toBe("London");
    });
  });

  describe("Mixed results scenario", () => {
    it("should use mixed-results scenario for defined mocks and default for others", async () => {
      // mixed-results defines GitHub (success), weather (error), and stripe (success)
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "mixed-test")
        .send({ scenario: "mixed-results" });

      // GitHub should use mixed-results success data
      const githubResponse = await request(fixtures.app)
        .get("/api/github/user/testuser")
        .set(SCENARIST_TEST_ID_HEADER, "mixed-test");

      expect(githubResponse.status).toBe(200);
      expect(githubResponse.body.login).toBe("mixeduser");
      expect(githubResponse.body.id).toBe(456);

      // Weather should use mixed-results error
      const weatherResponse = await request(fixtures.app)
        .get("/api/weather/city")
        .set(SCENARIST_TEST_ID_HEADER, "mixed-test");

      expect(weatherResponse.status).toBe(503);
      expect(weatherResponse.body.error).toBe("Service Unavailable");

      // Stripe should use mixed-results success data
      const stripeResponse = await request(fixtures.app)
        .post("/api/payment")
        .set(SCENARIST_TEST_ID_HEADER, "mixed-test")
        .send({ amount: 1000, currency: "usd" });

      expect(stripeResponse.status).toBe(200);
      expect(stripeResponse.body.id).toBe("ch_mixed123");
    });
  });

  describe("No scenario set", () => {
    it("should use default scenario for all requests when no scenario is set", async () => {
      // Don't set any scenario, just use a new test ID
      const testId = "no-scenario-set-test";

      // All requests should use default scenario
      const githubResponse = await request(fixtures.app)
        .get("/api/github/user/testuser")
        .set(SCENARIST_TEST_ID_HEADER, testId);

      expect(githubResponse.status).toBe(200);
      expect(githubResponse.body.login).toBe("octocat");

      const weatherResponse = await request(fixtures.app)
        .get("/api/weather/london")
        .set(SCENARIST_TEST_ID_HEADER, testId);

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body.city).toBe("London");

      const stripeResponse = await request(fixtures.app)
        .post("/api/payment")
        .set(SCENARIST_TEST_ID_HEADER, testId)
        .send({ amount: 1000, currency: "usd" });

      expect(stripeResponse.status).toBe(200);
      expect(stripeResponse.body.id).toBe("ch_default123");
    });
  });

  describe("Scenario override then fallback", () => {
    it("should override default when active scenario has mock, then fall back for others", async () => {
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, "override-fallback-test")
        .send({ scenario: "success" });

      // Success scenario defines all three APIs
      const githubResponse = await request(fixtures.app)
        .get("/api/github/user/testuser")
        .set(SCENARIST_TEST_ID_HEADER, "override-fallback-test");

      expect(githubResponse.status).toBe(200);
      expect(githubResponse.body.login).toBe("testuser"); // Success scenario
      expect(githubResponse.body.id).toBe(123); // Not default's octocat

      const weatherResponse = await request(fixtures.app)
        .get("/api/weather/city")
        .set(SCENARIST_TEST_ID_HEADER, "override-fallback-test");

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body.city).toBe("San Francisco"); // Success scenario
      expect(weatherResponse.body.city).not.toBe("London"); // Not default

      const stripeResponse = await request(fixtures.app)
        .post("/api/payment")
        .set(SCENARIST_TEST_ID_HEADER, "override-fallback-test")
        .send({ amount: 1000, currency: "usd" });

      expect(stripeResponse.status).toBe(200);
      expect(stripeResponse.body.id).toBe("ch_success123"); // Success scenario
      expect(stripeResponse.body.id).not.toBe("ch_default123"); // Not default
    });
  });
});
