/**
 * Test Seed API Route
 *
 * This endpoint seeds the in-memory repository with data for the given scenario.
 * Called automatically by the switchScenario Playwright fixture.
 *
 * This demonstrates the pattern: scenario switch → repository seed → navigate → assert
 * No direct API calls in tests!
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserRepository, runWithTestId } from '@/lib/container';
import { scenarioRepositoryData } from '@/lib/repository-data';

/**
 * POST /api/test/seed
 *
 * Seed the repository with data for the specified scenario.
 *
 * Headers:
 * - x-test-id: Test ID for isolation (required)
 *
 * Body:
 * - scenarioId: ID of the scenario to seed data for
 */
export async function POST(request: NextRequest) {
  const testId = request.headers.get('x-test-id') ?? 'default-test';
  const body = (await request.json()) as { scenarioId: string };
  const { scenarioId } = body;

  console.log('[Seed] testId:', testId, 'scenarioId:', scenarioId);

  // Get the repository data for this scenario
  const seedData = scenarioRepositoryData[scenarioId];

  if (!seedData) {
    // No seed data for this scenario - that's OK, not all scenarios need repository data
    return NextResponse.json({ seeded: false, message: 'No seed data for scenario' });
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
        console.log('[Seed] Created user:', user.id, user.name, 'in partition:', testId);
      }
    }
    return created;
  });

  return NextResponse.json({
    seeded: true,
    scenarioId,
    users: createdUsers,
  });
}
