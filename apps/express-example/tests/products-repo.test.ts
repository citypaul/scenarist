import { createTestFixtures } from './test-helpers.js';
import { scenarios } from '../src/scenarios.js';

/**
 * Products with Repository Pattern - Integration Tests
 *
 * =============================================================================
 * WHAT THIS DEMONSTRATES
 * =============================================================================
 *
 * These tests demonstrate the "shared identity for parallel test isolation" pattern:
 *
 *   Test → x-test-id → ┬─→ Scenarist (HTTP mocks)
 *                      └─→ Repository (database state)
 *
 * Both Scenarist and the repository use the SAME test ID to partition their data,
 * enabling parallel test execution without interference.
 *
 * =============================================================================
 * KEY CONCEPTS
 * =============================================================================
 *
 * 1. THE PATTERN (not specific to repositories):
 *    Use a single identifier (test ID) to partition ALL data sources.
 *    This is the same pattern used in distributed tracing, multi-tenancy, etc.
 *
 * 2. SCENARIST'S ROLE:
 *    - Extracts test ID from x-test-id header
 *    - Returns scenario-specific HTTP mock responses
 *    - Built-in: you get this for free
 *
 * 3. YOUR ROLE (what these tests demonstrate):
 *    - Extract test ID from the same header
 *    - Partition database queries by test ID
 *    - You implement this: Scenarist doesn't touch databases
 *
 * 4. THE REPOSITORY PATTERN (implementation approach):
 *    One way to implement database isolation. Abstract database access behind
 *    interfaces, inject test implementations that partition by test ID.
 *    Other approaches exist (RLS, fixtures, snapshots) - see docs.
 *
 * =============================================================================
 * THE FLOW IN EACH TEST
 * =============================================================================
 *
 *   1. Generate unique test ID
 *   2. Switch Scenarist scenario (configures HTTP mocks for this test ID)
 *   3. Seed repository (configures database state for this test ID)
 *   4. Make request with x-test-id header
 *   5. Server fetches:
 *      - User from repository → partitioned by test ID
 *      - Products from HTTP API → mocked by Scenarist using test ID
 *   6. Assert combined response
 *
 * =============================================================================
 * IMPORTANT: THIS IS NOT A SCENARIST FEATURE
 * =============================================================================
 *
 * The repository pattern shown here is a COMPLEMENTARY technique for handling
 * direct database queries. Scenarist handles HTTP mocking; you implement
 * database isolation using whatever approach fits your architecture.
 *
 * Learn more:
 * - Pattern overview: https://scenarist.io/guides/testing-database-apps
 * - Repository approach: https://scenarist.io/guides/testing-database-apps/repository-pattern
 * - Alternative approaches: https://scenarist.io/guides/testing-database-apps#implementing-database-isolation
 */

import { describe, it, expect } from "vitest";
import request from "supertest";
import type { Express } from "express";
import type { ExpressScenarist } from "@scenarist/express-adapter";
import { scenarios } from "../src/scenarios.js";

const fixtures = await createTestFixtures();

describe("Products with Repository Pattern", () => {


  // Start MSW for HTTP mocking
  if (!fixtures.scenarist) throw new Error('Scenarist not initialized');
  fixtures.scenarist.start();

  /**
   * Helper function that performs both:
   * 1. Scenarist scenario switch (HTTP mocks)
   * 2. Repository seeding (database state)
   *
   * This demonstrates the "combined" setup pattern where both data sources
   * are configured for the same test ID before making requests.
   */
  const switchScenarioAndSeed = async (testId: string, scenarioId: string) => {
    // 1. Switch Scenarist scenario (HTTP mocks)
    // This tells Scenarist which mock responses to return for this test ID
    await request(fixtures.app)
      .post("/__scenario__")
      .set("x-test-id", testId)
      .send({ scenario: scenarioId })
      .expect(200);

    // 2. Seed repository with scenario data
    // This populates the in-memory repository with user data for this test ID
    // The repository partitions data by test ID internally
    await request(fixtures.app)
      .post("/test/seed")
      .set("x-test-id", testId)
      .send({ scenarioId })
      .expect(200);
  };

  /**
   * TEST: Combined data sources with premium tier
   *
   * DEMONSTRATES:
   * - User comes from repository (direct "database" access)
   * - Products come from Scenarist (HTTP API mock)
   * - Both are coordinated via the same test ID
   *
   * WHAT'S BEING PROVEN:
   * - Repository returns correct user for this test ID
   * - Scenarist returns premium pricing mocks for this test ID
   * - The combination works seamlessly
   */
  it("[REPO] should show premium pricing for premium user", async () => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await switchScenarioAndSeed(testId, "premiumUser");

    const response = await request(fixtures.app)
      .get("/products-repo?userId=user-1")
      .set("x-test-id", testId)
      .expect(200);

    // User from repository (database isolation)
    expect(response.body.user).toBeDefined();
    expect(response.body.user.name).toBe("Premium User");
    expect(response.body.user.tier).toBe("premium");

    // Products from Scenarist (HTTP mock isolation)
    // Premium pricing: £99.99, £149.99, £79.99
    expect(response.body.products[0].price).toBe(99.99);
    expect(response.body.products[1].price).toBe(149.99);
    expect(response.body.products[2].price).toBe(79.99);
  });

  /**
   * TEST: Combined data sources with standard tier
   *
   * DEMONSTRATES:
   * - Same endpoint, different scenario = different data
   * - Scenario controls both repository seed AND HTTP mocks
   *
   * WHAT'S BEING PROVEN:
   * - Switching scenarios changes both data sources
   * - Standard user gets standard pricing
   */
  it("[REPO] should show standard pricing for standard user", async () => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await switchScenarioAndSeed(testId, "default");

    const response = await request(fixtures.app)
      .get("/products-repo?userId=user-1")
      .set("x-test-id", testId)
      .expect(200);

    // User from repository
    expect(response.body.user.name).toBe("Standard User");
    expect(response.body.user.tier).toBe("standard");

    // Products from Scenarist
    // Standard pricing: £149.99, £199.99, £99.99
    expect(response.body.products[0].price).toBe(149.99);
    expect(response.body.products[1].price).toBe(199.99);
    expect(response.body.products[2].price).toBe(99.99);
  });

  /**
   * TEST: Repository handles missing data
   *
   * DEMONSTRATES:
   * - Repository returns null for non-existent users
   * - Application handles gracefully
   * - Scenarist still returns products (independent concern)
   *
   * WHAT'S BEING PROVEN:
   * - Repository isolation works correctly for missing data
   * - HTTP mocking continues to work regardless of repository state
   */
  it("[REPO] should return null user when user not found", async () => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await switchScenarioAndSeed(testId, "default");

    const response = await request(fixtures.app)
      .get("/products-repo?userId=non-existent")
      .set("x-test-id", testId)
      .expect(200);

    // Repository correctly returns null for unknown user
    expect(response.body.user).toBeNull();

    // Products still come from Scenarist (fallback to standard pricing)
    expect(response.body.products[0].price).toBe(149.99);
  });

  /**
   * TEST: Parallel test isolation
   *
   * THIS IS THE KEY TEST - demonstrates why the pattern matters.
   *
   * DEMONSTRATES:
   * - Two "tests" with different test IDs run concurrently
   * - Each sees completely different data
   * - No interference between them
   *
   * WHAT'S BEING PROVEN:
   * - Test ID isolation works for BOTH repository AND Scenarist
   * - Same user ID (user-1) returns different data based on test ID
   * - This enables parallel test execution at scale
   *
   * WHY THIS MATTERS:
   * Without test ID isolation, parallel tests would corrupt each other's data.
   * With it, you can run hundreds of tests concurrently with full isolation.
   */
  it("[REPO] should isolate data between parallel tests", async () => {
    // Simulate two parallel tests with different test IDs
    const testId1 = `test-1-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const testId2 = `test-2-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Setup different scenarios for different test IDs
    // In real parallel execution, these would happen in separate test processes
    await switchScenarioAndSeed(testId1, "premiumUser");
    await switchScenarioAndSeed(testId2, "default");

    // Test 1: Premium user, premium pricing
    const response1 = await request(fixtures.app)
      .get("/products-repo?userId=user-1")
      .set("x-test-id", testId1)
      .expect(200);

    expect(response1.body.user.name).toBe("Premium User");
    expect(response1.body.user.tier).toBe("premium");
    expect(response1.body.products[0].price).toBe(99.99); // Premium pricing

    // Test 2: Standard user, standard pricing
    // SAME user ID (user-1), but DIFFERENT test ID → DIFFERENT data
    const response2 = await request(fixtures.app)
      .get("/products-repo?userId=user-1")
      .set("x-test-id", testId2)
      .expect(200);

    expect(response2.body.user.name).toBe("Standard User");
    expect(response2.body.user.tier).toBe("standard");
    expect(response2.body.products[0].price).toBe(149.99); // Standard pricing

    // This proves: same endpoint, same user ID, but completely isolated data
    // based on test ID. This is what enables parallel test execution.
  });

  /**
   * TEST: Direct repository endpoint
   *
   * DEMONSTRATES:
   * - Repository can be accessed directly (not just via combined endpoint)
   * - Test ID isolation works for all repository operations
   *
   * WHAT'S BEING PROVEN:
   * - The repository pattern works independently of Scenarist
   * - You can have endpoints that only use the repository (no HTTP mocking)
   */
  it("[REPO] should return user from repository by ID", async () => {
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await switchScenarioAndSeed(testId, "premiumUser");

    // Direct repository access (no Scenarist involvement)
    const response = await request(fixtures.app)
      .get("/users/user-1")
      .set("x-test-id", testId)
      .expect(200);

    expect(response.body.id).toBe("user-1");
    expect(response.body.name).toBe("Premium User");
    expect(response.body.email).toBe("premium@example.com");
    expect(response.body.tier).toBe("premium");
  });
});
