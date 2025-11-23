/**
 * Scenarist Setup - App Router
 *
 * Creates and configures Scenarist instance for scenario-based testing.
 * Server Components fetch data server-side, so MSW runs in Node.js (not browser).
 *
 * CRITICAL: Always use `export const scenarist = createScenarist(...)` pattern.
 * The adapter handles singleton logic internally (MSW, registry, store).
 * Never wrap in a function or default export - module duplication requires this pattern.
 *
 * **PRODUCTION TREE-SHAKING:**
 * In production builds, createScenarist() returns undefined and all test code
 * is eliminated from the bundle (0kb overhead). The `if (scenarist)` guards
 * protect against runtime errors while enabling tree-shaking.
 */

import { createScenarist } from '@scenarist/nextjs-adapter/app';
import { scenarios } from './scenarios';

/**
 * Note: createScenarist is now async for defense-in-depth tree-shaking.
 * We use top-level await here (supported in Next.js 13+).
 */
export const scenarist = await createScenarist({
  enabled: true,
  scenarios,
});

/**
 * Auto-start MSW server in development
 *
 * NOTE: The SKIP_MSW environment variable is ONLY used for comparison tests
 * in this example app. These tests verify that Scenarist responses match
 * real json-server responses.
 *
 * **For your own app**, you should use:
 * ```typescript
 * export const scenarist = await createScenarist({
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
