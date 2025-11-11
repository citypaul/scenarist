/**
 * Scenarist Setup - App Router
 *
 * Creates and configures Scenarist instance for scenario-based testing.
 * Server Components fetch data server-side, so MSW runs in Node.js (not browser).
 *
 * Note: Next.js (Turbopack) creates multiple module instances. This singleton pattern
 * ensures all route handlers share the same Scenarist instance, while the adapter
 * handles store/MSW singleton logic internally.
 */

import { createScenarist } from '@scenarist/nextjs-adapter/app';
import { scenarios } from './scenarios';

// Declare global variable for singleton instance
declare global {
  // eslint-disable-next-line no-var
  var __scenarist: ReturnType<typeof createScenarist> | undefined;
}

/**
 * Get or create the singleton Scenarist instance.
 *
 * This ensures all API routes and MSW handlers share the same instance.
 * The adapter handles store and MSW singleton logic internally.
 */
export const getScenarist = () => {
  if (!global.__scenarist) {
    global.__scenarist = createScenarist({
      enabled: true,
      scenarios,
    });

    // Start MSW in Node.js environment
    if (typeof window === 'undefined') {
      global.__scenarist.start();
    }
  }

  return global.__scenarist;
};

// For convenience and backward compatibility
export const scenarist = getScenarist();
