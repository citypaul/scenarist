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
 *
 * Note: createScenarist is now async for defense-in-depth tree-shaking.
 * We use top-level await here (supported in Next.js 13+).
 */
export const scenarist = await createScenarist({
  enabled: true, // Always enabled in example app for demonstration
  scenarios, // All scenarios registered at initialization (must include 'default')
});

// Auto-start MSW server in development (only when Scenarist is enabled)
// Skip for comparison tests (they use real json-server instead)
if (typeof window === 'undefined' && scenarist && process.env.SKIP_MSW !== 'true') {
  scenarist.start();
}
