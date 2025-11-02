/**
 * Playwright Global Setup
 *
 * Phase 1 (GREEN): Initialize MSW server before all tests
 *
 * This runs once before all Playwright tests begin.
 * It starts the MSW server which intercepts API calls based on active scenarios.
 *
 * For baseline tests (without Scenarist), MSW is skipped so tests hit real json-server.
 */

import { scenarist } from '../../lib/scenarist';

export default async function globalSetup(): Promise<void> {
  // Skip MSW for baseline tests (they should hit real json-server)
  if (process.env.SKIP_MSW === 'true') {
    console.log('⏭️  Skipping MSW server (baseline tests use real json-server)');
    return;
  }

  // Start MSW server
  scenarist.start();

  console.log('✅ MSW server started for Playwright tests');
}
