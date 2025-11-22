/**
 * Scenarist Setup for Next.js Pages Router
 *
 * Phase 1: Minimal setup
 * Phase 2: Auto-start MSW for development
 *
 * **PRODUCTION TREE-SHAKING:**
 * In production builds, createScenarist() returns undefined and all test code
 * is eliminated from the bundle (0kb overhead). The `if (scenarist)` guards
 * protect against runtime errors while enabling tree-shaking.
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
  scenarios, // All scenarios registered at initialization (must include 'default')
});

// Auto-start MSW server in development (only when Scenarist is enabled)
if (typeof window === 'undefined' && scenarist) {
  scenarist.start();
}
