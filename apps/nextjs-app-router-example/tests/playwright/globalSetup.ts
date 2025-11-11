/**
 * Playwright Global Setup - App Router
 *
 * NOTE: For App Router, MSW runs in the Next.js dev server process (NOT Playwright process).
 * This is because Server Components execute server-side, so MSW must run server-side to intercept fetches.
 *
 * The actual MSW server is started by lib/scenarist.ts when Next.js imports it.
 * This globalSetup is kept for consistency with other test setups, but the start() call
 * here runs in the Playwright process and doesn't actually intercept any requests.
 *
 * The singleton pattern in lib/scenarist.ts ensures all Next.js route handlers share
 * the same Scenarist instance, allowing scenario switching to work correctly.
 */

import { scenarist } from '../../lib/scenarist.js';

export default async function globalSetup(): Promise<void> {
  console.log('✅ MSW server runs in Next.js process (started by lib/scenarist.ts)');
  // Note: This start() call runs in Playwright process and doesn't intercept Next.js requests.
  // It's kept here for API consistency and potential future use.
  await scenarist.start();
}
