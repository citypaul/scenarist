/**
 * Playwright Global Setup
 *
 * Phase 1 (GREEN): Initialize MSW server before all tests
 *
 * This runs once before all Playwright tests begin.
 * It starts the MSW server which intercepts API calls based on active scenarios.
 */

import { scenarist } from '../../lib/scenarist';

export default async function globalSetup(): Promise<void> {
  // Start MSW server
  scenarist.start();

  console.log('✅ MSW server started for Playwright tests');
}
