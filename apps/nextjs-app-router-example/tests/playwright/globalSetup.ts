/**
 * Playwright Global Setup - App Router
 *
 * NOTE: For App Router, MSW runs in the Next.js dev server process (NOT Playwright process).
 * This is because Server Components execute server-side, so MSW must run server-side to intercept fetches.
 *
 * The actual MSW server is started by lib/scenarist.ts when Next.js imports it.
 * This globalSetup is kept for consistency with other test setups, but the start() call
 * here runs in the Playwright process and doesn't intercept any requests.
 *
 * The singleton pattern in lib/scenarist.ts ensures all Next.js route handlers share
 * the same Scenarist instance, allowing scenario switching to work correctly.
 */

import { scenarist } from '../../lib/scenarist.js';

/**
 * Wait for server to be ready before starting tests.
 * Playwright's webServer.waitOnServer ensures server is listening,
 * but we verify it responds to requests.
 */
async function waitForServer(): Promise<void> {
  const baseURL = 'http://localhost:3002';
  const maxRetries = 30;
  const retryDelay = 500;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        return;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Server not ready after ${maxRetries} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

export default async function globalSetup(): Promise<void> {
  // Note: This start() call runs in Playwright process and doesn't intercept Next.js requests.
  // It's kept here for API consistency and potential future use.
  await scenarist.start();

  // Wait for server to be ready before tests start
  await waitForServer();
}
