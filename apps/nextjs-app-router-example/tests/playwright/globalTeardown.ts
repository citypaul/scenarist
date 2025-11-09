/**
 * Playwright Global Teardown
 *
 * Stops MSW server and cleans up resources.
 *
 * This runs once after all Playwright tests complete.
 * It stops the MSW server and cleans up resources.
 */

import { scenarist } from '../../lib/scenarist.js';

export default async function globalTeardown(): Promise<void> {
  console.log('✅ Stopping MSW server');
  await scenarist.stop();
}
