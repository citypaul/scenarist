/**
 * Scenarist Setup for Next.js Pages Router
 *
 * Phase 1: Minimal setup
 * Phase 2: Auto-start MSW for server-side interception
 */

import { createScenarist } from '@scenarist/nextjs-adapter/pages';
import { scenarios } from './scenarios';

/**
 * Create Scenarist instance with scenarios
 *
 * This provides:
 * - MSW server integration
 * - Scenario management
 * - Test ID isolation
 * - Scenario endpoint handlers
 */
export const scenarist = createScenarist({
  enabled: true, // Always enabled in example app for demonstration
  scenarios, // All scenarios registered at initialization
  defaultScenarioId: 'default', // ID of the default scenario to use as fallback
});

// Auto-start MSW server for server-side API route interception
// This ensures fetch() calls from API routes are intercepted by MSW
if (typeof window === 'undefined') {
  // Only start on server-side (Node.js environment)
  scenarist.start();
}
