/**
 * Products with Repository Pattern - Integration Tests
 *
 * These tests demonstrate the combined testing strategy:
 * - Repository pattern for database access (with test ID isolation)
 * - Scenarist for HTTP API mocking
 *
 * Key points:
 * - Tests run in PARALLEL without interfering with each other
 * - Each test gets its own data partition via test ID
 * - Repository and Scenarist both use the same test ID for isolation
 *
 * The pattern:
 * - Switch scenario (HTTP mocks)
 * - Seed repository (database state)
 * - Make request
 * - Assert on response
 *
 * NOTE: Repository pattern is NOT a Scenarist feature. It's a complementary
 * pattern for handling direct database queries.
 *
 * Learn more: https://scenarist.io/guides/testing-database-apps/repository-pattern
 */

import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/server.js";

describe("Products with Repository Pattern", () => {
  const { app, scenarist } = createApp();

  // Start MSW for HTTP mocking
  scenarist.start();

  const switchScenarioAndSeed = async (testId: string, scenarioId: string) => {
    // 1. Switch Scenarist scenario (HTTP mocks)
    await request(app)
      .post("/__scenario__")
      .set("x-test-id", testId)
      .send({ scenario: scenarioId })
      .expect(200);

    // 2. Seed repository with scenario data
    await request(app)
      .post("/test/seed")
      .set("x-test-id", testId)
      .send({ scenarioId })
      .expect(200);
  };

  it("[REPO] should show premium pricing for premium user", async () => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // 1. Switch scenario and seed repository
    await switchScenarioAndSeed(testId, "premiumUser");

    // 2. Get products with repository integration
    const response = await request(app)
      .get("/products-repo?userId=user-1")
      .set("x-test-id", testId)
      .expect(200);

    // 3. Verify user from repository
    expect(response.body.user).toBeDefined();
    expect(response.body.user.name).toBe("Premium User");
    expect(response.body.user.email).toBe("premium@example.com");
    expect(response.body.user.tier).toBe("premium");

    // 4. Verify products from Scenarist mock (premium pricing)
    expect(response.body.products).toBeDefined();
    expect(response.body.products).toHaveLength(3);
    // Premium prices: Product A £99.99, Product B £149.99, Product C £79.99
    expect(response.body.products[0].price).toBe(99.99);
    expect(response.body.products[1].price).toBe(149.99);
    expect(response.body.products[2].price).toBe(79.99);
  });

  it("[REPO] should show standard pricing for standard user", async () => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // 1. Switch to default scenario (standard user + standard pricing)
    await switchScenarioAndSeed(testId, "default");

    // 2. Get products with repository integration
    const response = await request(app)
      .get("/products-repo?userId=user-1")
      .set("x-test-id", testId)
      .expect(200);

    // 3. Verify user from repository
    expect(response.body.user).toBeDefined();
    expect(response.body.user.name).toBe("Standard User");
    expect(response.body.user.email).toBe("standard@example.com");
    expect(response.body.user.tier).toBe("standard");

    // 4. Verify products from Scenarist mock (standard pricing)
    // Standard prices: Product A £149.99, Product B £199.99, Product C £99.99
    expect(response.body.products[0].price).toBe(149.99);
    expect(response.body.products[1].price).toBe(199.99);
    expect(response.body.products[2].price).toBe(99.99);
  });

  it("[REPO] should return null user when user not found", async () => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // 1. Switch to default scenario
    await switchScenarioAndSeed(testId, "default");

    // 2. Get products with non-existent user
    const response = await request(app)
      .get("/products-repo?userId=non-existent")
      .set("x-test-id", testId)
      .expect(200);

    // 3. Verify null user
    expect(response.body.user).toBeNull();

    // 4. Products should still render with standard pricing (fallback tier)
    expect(response.body.products[0].price).toBe(149.99);
  });

  it("[REPO] should isolate data between parallel tests", async () => {
    const testId1 = `test-1-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const testId2 = `test-2-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Setup different scenarios for different test IDs
    await switchScenarioAndSeed(testId1, "premiumUser");
    await switchScenarioAndSeed(testId2, "default");

    // Test 1 should see premium user
    const response1 = await request(app)
      .get("/products-repo?userId=user-1")
      .set("x-test-id", testId1)
      .expect(200);

    expect(response1.body.user.name).toBe("Premium User");
    expect(response1.body.user.tier).toBe("premium");
    expect(response1.body.products[0].price).toBe(99.99); // Premium pricing

    // Test 2 should see standard user
    const response2 = await request(app)
      .get("/products-repo?userId=user-1")
      .set("x-test-id", testId2)
      .expect(200);

    expect(response2.body.user.name).toBe("Standard User");
    expect(response2.body.user.tier).toBe("standard");
    expect(response2.body.products[0].price).toBe(149.99); // Standard pricing
  });

  it("[REPO] should return user from repository by ID", async () => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Seed premium user
    await switchScenarioAndSeed(testId, "premiumUser");

    // Get user directly from repository endpoint
    const response = await request(app)
      .get("/users/user-1")
      .set("x-test-id", testId)
      .expect(200);

    expect(response.body.id).toBe("user-1");
    expect(response.body.name).toBe("Premium User");
    expect(response.body.email).toBe("premium@example.com");
    expect(response.body.tier).toBe("premium");
  });
});
