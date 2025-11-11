/**
 * Scenarist Setup - App Router (with Next.js Singleton Pattern)
 *
 * Creates and configures Scenarist instance for scenario-based testing.
 * Server Components fetch data server-side, so MSW runs in Node.js (not browser).
 *
 * IMPORTANT: Uses global singleton pattern to prevent Next.js from creating
 * multiple instances of this module. Without this, Next.js creates separate
 * instances for each API route, causing scenario switching to fail.
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
 * This ensures all API routes and MSW handlers share the same
 * ScenarioStore instance, allowing scenario switching to work correctly.
 */
export const getScenarist = () => {
  if (!global.__scenarist) {
    global.__scenarist = createScenarist({
      enabled: true,
      scenarios,
    });

    // Auto-start MSW in Node.js environment
    if (typeof window === 'undefined') {
      global.__scenarist.start();
    }
  }

  return global.__scenarist;
};

// For convenience and backward compatibility
export const scenarist = getScenarist();
