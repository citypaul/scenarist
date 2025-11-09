/**
 * Scenarist Setup - App Router
 *
 * Creates and configures Scenarist instance for scenario-based testing.
 * Server Components fetch data server-side, so MSW runs in Node.js (not browser).
 */

import { createScenarist } from '@scenarist/nextjs-adapter/app';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  enabled: true,
  scenarios,
});

// Auto-start MSW server for server-side API route interception
// Server Components and Route Handlers run in Node.js, not the browser
// Note: This starts MSW in the Next.js server process
// Playwright globalSetup also starts MSW in its own process (both needed!)
if (typeof window === 'undefined') {
  scenarist.start();
}
