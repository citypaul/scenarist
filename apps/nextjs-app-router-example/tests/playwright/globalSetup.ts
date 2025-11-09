/**
 * Playwright Global Setup
 *
 * Initializes MSW server to intercept API calls for all tests.
 *
 * This runs once before all Playwright tests begin.
 * It starts the MSW server which intercepts API calls based on active scenarios.
 */

import { scenarist } from '../../lib/scenarist.js';

export default async function globalSetup(): Promise<void> {
  console.log('✅ Starting MSW server for Playwright tests');
  await scenarist.start();
}
