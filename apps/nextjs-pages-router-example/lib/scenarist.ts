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
 * CRITICAL: Always use `export const scenarist = createScenarist(...)` pattern.
 * The adapter handles singleton logic internally (MSW, registry, store).
 * Never wrap in a function or default export - module duplication requires this pattern.
 */
export const scenarist = createScenarist({
  enabled: true, // Always enabled in example app for demonstration
  scenarios, // All scenarios registered at initialization (must include 'default')
});

/**
 * Auto-start MSW server in development
 *
 * NOTE: The SKIP_MSW environment variable is ONLY used for comparison tests
 * in this example app (tests/comparison/*). These tests verify that Scenarist
 * responses match real json-server responses.
 *
 * **For your own app**, you should use:
 * ```typescript
 * export const scenarist = createScenarist({
 *   enabled: process.env.NODE_ENV === 'test',  // Only enable in test environment
 *   scenarios,
 * });
 *
 * if (typeof window === 'undefined' && scenarist) {
 *   scenarist.start();
 * }
 * ```
 */
if (typeof window === 'undefined' && scenarist && process.env.SKIP_MSW !== 'true') {
  scenarist.start();
}
