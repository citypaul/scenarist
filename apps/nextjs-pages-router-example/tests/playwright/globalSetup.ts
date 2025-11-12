/**
 * Playwright Global Setup
 *
 * Phase 1 (GREEN): Initialize MSW server before all tests
 *
 * This runs once before all Playwright tests begin.
 * It starts the MSW server which intercepts API calls based on active scenarios.
 *
 * For comparison tests (without Scenarist), MSW is skipped so tests hit real json-server.
 */

export default async function globalSetup(): Promise<void> {
  // Skip MSW for comparison tests (they should hit real json-server)
  if (process.env.SKIP_MSW === 'true') {
    console.log('⏭️  Skipping MSW server (comparison tests use real json-server)');
    return;
  }

  // MSW is auto-started in Next.js process by lib/scenarist.ts
  // No additional setup needed here
}
