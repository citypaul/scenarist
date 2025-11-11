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
 * Wait for server to be fully ready by making warmup requests.
 * This ensures Next.js has compiled routes and MSW is initialized.
 */
async function warmupServer(): Promise<void> {
  const baseURL = 'http://localhost:3002';
  const maxRetries = 30;
  const retryDelay = 500;

  console.log('🔥 Warming up Next.js server and MSW...');

  // Warmup: Fetch home page to trigger Next.js compilation and MSW initialization
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        console.log('✅ Server responding');
        break;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Server not ready after ${maxRetries} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // Warmup: Fetch products API to ensure route handlers are compiled
  try {
    await fetch(`${baseURL}/api/products`);
    console.log('✅ API routes compiled');
  } catch (error) {
    console.warn('⚠️  API warmup failed (non-fatal):', error);
  }

  // Give MSW a moment to fully register all handlers
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('✅ MSW initialization complete');
}

export default async function globalSetup(): Promise<void> {
  console.log('✅ MSW server runs in Next.js process (started by lib/scenarist.ts)');

  // Note: This start() call runs in Playwright process and doesn't intercept Next.js requests.
  // It's kept here for API consistency and potential future use.
  await scenarist.start();

  // Warmup server to ensure everything is ready before tests run
  await warmupServer();
}
