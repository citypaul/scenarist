// Re-export types from impl for public API
export type { AppAdapterOptions, AppScenarist } from './impl.js';

/**
 * Create a Scenarist instance for Next.js App Router.
 *
 * Production tree-shaking is handled via conditional exports in package.json:
 * - Development/test: Uses this file (imports impl.js with full MSW setup)
 * - Production builds: Uses production.js (returns undefined, zero imports)
 *
 * This ensures all test code is eliminated from production bundles.
 *
 * @example
 * ```typescript
 * // lib/scenarist.ts
 * import { createScenarist } from '@scenarist/nextjs-adapter/app';
 * import { scenarios } from './scenarios';
 *
 * export const scenarist = createScenarist({
 *   enabled: true,
 *   scenarios,
 * });
 *
 * // Start MSW in Node.js environment
 * if (typeof window === 'undefined') {
 *   scenarist.start();
 * }
 * ```
 */
export { createScenaristImpl as createScenarist } from './impl.js';
