/**
 * Test Users API Route
 *
 * This endpoint allows Playwright tests to set up user data in the
 * in-memory repository. The test ID header ensures data is isolated
 * to the specific test.
 *
 * Note: This endpoint is only for testing purposes.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserRepository, runWithTestId } from "@/lib/container";
import type { CreateUserInput } from "@/lib/repositories";

/**
 * POST /api/test/users
 *
 * Create a user in the in-memory repository for the current test.
 *
 * Headers:
 * - x-test-id: Test ID for isolation (required for proper partitioning)
 *
 * Body:
 * - email: User email
 * - name: User name
 * - tier: 'standard' | 'premium'
 */
export async function POST(request: NextRequest) {
  const testId = request.headers.get("x-scenarist-test-id") ?? "default-test";

  const body = (await request.json()) as CreateUserInput;

  const user = await runWithTestId(testId, async () => {
    const userRepository = getUserRepository();
    return userRepository.create(body);
  });

  return NextResponse.json({ user });
}

/**
 * GET /api/test/users
 *
 * List all users in the in-memory repository for the current test.
 *
 * Headers:
 * - x-test-id: Test ID for isolation
 */
export async function GET(request: NextRequest) {
  const testId = request.headers.get("x-scenarist-test-id") ?? "default-test";

  const users = await runWithTestId(testId, async () => {
    const userRepository = getUserRepository();
    return userRepository.findAll();
  });

  return NextResponse.json({ users });
}
