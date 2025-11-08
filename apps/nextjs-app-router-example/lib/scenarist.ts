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
if (typeof window === 'undefined') {
  scenarist.start();
}
