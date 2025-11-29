/**
 * Test Seed API Route
 *
 * NOTE: This is NOT a Scenarist feature. This endpoint seeds database state
 * alongside Scenarist's HTTP mocking, using the same test ID for isolation.
 *
 * Called by the switchScenario fixture to set up both HTTP mocks (Scenarist)
 * and database state (this endpoint) together.
 *
 * Learn more: https://scenarist.io/guides/testing-database-apps/repository-pattern
 */

import type { NextApiRequest, NextApiResponse } from "next";

import { z } from "zod";
import { getUserRepository, runWithTestId } from "@/lib/container";
import { scenarioRepositoryData } from "@/lib/repository-data";

const SeedRequestSchema = z.object({
  scenarioId: z.string().min(1),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const testId =
    (req.headers["x-scenarist-test-id"] as string) ?? "default-test";

  const parseResult = SeedRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.message });
  }

  const { scenarioId } = parseResult.data;

  // Security: Don't log user-provided values to prevent log injection
  // @see https://github.com/citypaul/scenarist/security/code-scanning/95
  console.log("[Seed] Processing seed request");

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
        // Security: Don't log user-provided values to prevent log injection
        // @see https://github.com/citypaul/scenarist/security/code-scanning/96
        console.log("[Seed] Created user in partition");
      }
    }
    return created;
  });

  return res.json({
    seeded: true,
    scenarioId,
    users: createdUsers,
  });
}
