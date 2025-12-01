// Re-export types from impl for public API
export type { ExpressAdapterOptions, ExpressScenarist } from "./impl.js";

/**
 * Create a Scenarist instance for Express.
 *
 * Production tree-shaking is handled via conditional exports in package.json:
 * - Development/test: Uses this file (imports impl.js with full MSW setup)
 * - Production builds: Uses production.js (returns undefined, zero imports)
 *
 * This ensures all test code is eliminated from production bundles.
 *
 * @example
 * ```typescript
 * // src/app.ts
 * import { createScenarist } from '@scenarist/express-adapter';
 * import { scenarios } from './scenarios';
 *
 * export const scenarist = createScenarist({
 *   enabled: true,
 *   scenarios,
 * });
 *
 * if (scenarist) {
 *   app.use(scenarist.middleware);
 * }
 *
 * // tests/setup.ts
 * beforeAll(() => scenarist?.start());
 * afterAll(() => scenarist?.stop());
 * ```
 */
export { createScenaristImpl as createScenarist } from "./impl.js";
