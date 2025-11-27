/**
 * Products with Repository Pattern - Express Route
 *
 * This demonstrates the COMBINED testing strategy:
 * - Repository pattern for database access (with test ID isolation)
 * - Scenarist for HTTP API mocking
 *
 * NOTE: Repository pattern is NOT a Scenarist feature. It's a complementary
 * pattern for handling direct database queries.
 *
 * Learn more: https://scenarist.io/guides/testing-database-apps/repository-pattern
 */

import { Router } from "express";

/**
 * Sanitizes a string for safe logging to prevent log injection attacks.
 * Removes control characters and limits length.
 *
 * @see https://github.com/citypaul/scenarist/security/code-scanning/93
 * @see https://github.com/citypaul/scenarist/security/code-scanning/94
 */
const sanitizeForLog = (value: string, maxLength = 100): string => {
  return value
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\r\n]/g, ' ')          // Replace newlines with spaces
    .slice(0, maxLength);             // Limit length
};
import { z } from "zod";
import { getUserRepository, runWithTestId } from "../container.js";
import { scenarioRepositoryData } from "../repository-data.js";

const SeedRequestSchema = z.object({
  scenarioId: z.string().min(1),
});

export const setupProductsRepoRoutes = (router: Router): void => {
  /**
   * Test Seed Endpoint
   *
   * Seeds repository with scenario data. Called by tests to set up
   * both HTTP mocks (Scenarist) and database state (this endpoint) together.
   */
  router.post("/test/seed", async (req, res) => {
    try {
      const testId = (req.headers["x-scenarist-test-id"] as string) ?? "default-test";

      const parseResult = SeedRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.message });
      }

      const { scenarioId } = parseResult.data;

      console.log("[Seed] testId:", sanitizeForLog(testId), "scenarioId:", sanitizeForLog(scenarioId));

      // Get the repository data for this scenario
      const seedData = scenarioRepositoryData[scenarioId];

      if (!seedData) {
        // No seed data for this scenario - that's OK, not all scenarios need repository data
        return res.json({ seeded: false, message: "No seed data for scenario" });
      }

      // Seed the repository within the test ID context
      const createdUsers = await runWithTestId(testId, async () => {
        const userRepository = getUserRepository();
        const created: Array<{ id: string; name: string }> = [];

        // Seed users if provided
        if (seedData.users) {
          for (const userData of seedData.users) {
            const user = await userRepository.create({
              email: userData.email,
              name: userData.name,
              tier: userData.tier,
            });
            created.push({ id: user.id, name: user.name });
            console.log(
              "[Seed] Created user:",
              sanitizeForLog(user.id),
              sanitizeForLog(user.name),
              "in partition:",
              sanitizeForLog(testId)
            );
          }
        }
        return created;
      });

      return res.json({
        seeded: true,
        scenarioId,
        users: createdUsers,
      });
    } catch (error) {
      console.error("[Seed] Error:", error);
      return res.status(500).json({ error: "Failed to seed repository" });
    }
  });

  /**
   * Get User from Repository
   *
   * Fetches user from in-memory repository with test ID isolation.
   */
  router.get("/users/:userId", async (req, res) => {
    try {
      const testId = (req.headers["x-scenarist-test-id"] as string) ?? "default-test";
      const { userId } = req.params;

      const user = await runWithTestId(testId, async () => {
        const userRepository = getUserRepository();
        return userRepository.findById(userId);
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      console.error("[Users] Error:", error);
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  /**
   * Products with Repository Integration
   *
   * Demonstrates fetching user from repository and products from external API.
   */
  router.get("/products-repo", async (req, res) => {
    try {
      const testId = (req.headers["x-scenarist-test-id"] as string) ?? "default-test";
      const userId = (req.query.userId as string) ?? "user-1";

      // 1. Get user from repository (in-memory with test ID isolation)
      const user = await runWithTestId(testId, async () => {
        const userRepository = getUserRepository();
        return userRepository.findById(userId);
      });

      // 2. Get products from external API (mocked by Scenarist)
      const tier = user?.tier ?? "standard";
      const response = await fetch("http://localhost:3001/products", {
        headers: {
          "x-scenarist-test-id": testId,
          "x-user-tier": tier,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();

      return res.json({
        user,
        products: data.products,
        testId,
      });
    } catch (error) {
      console.error("[ProductsRepo] Error:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  });
};
