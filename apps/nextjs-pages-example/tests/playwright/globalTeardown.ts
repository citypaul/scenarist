/**
 * Playwright Global Teardown
 *
 * Phase 1 (GREEN): Clean up MSW server after all tests
 *
 * This runs once after all Playwright tests complete.
 * It stops the MSW server and cleans up resources.
 */

import { scenarist } from '../../lib/scenarist';

export default async function globalTeardown(): Promise<void> {
  // Stop MSW server
  scenarist.stop();

  console.log('✅ MSW server stopped after Playwright tests');
}
