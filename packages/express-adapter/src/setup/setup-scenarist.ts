import type { ScenaristScenarios } from "@scenarist/core";
import {
  createScenaristImpl,
  type ExpressAdapterOptions,
  type ExpressScenarist,
} from "./impl.js";

// Re-export types from impl for public API
export type { ExpressAdapterOptions, ExpressScenarist } from "./impl.js";

/**
 * Create a Scenarist instance for Express.
 *
 * Production safety uses two layers:
 * - Conditional exports: bundlers and `node --conditions=production` resolve
 *   production.js (returns undefined, zero imports)
 * - Runtime guard: returns undefined when NODE_ENV is 'production', for
 *   unbundled apps started without the production condition
 *
 * Also returns undefined when `enabled` is false.
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
export const createScenarist = <T extends ScenaristScenarios>(
  options: ExpressAdapterOptions<T>,
): ExpressScenarist<T> | undefined => {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }

  return createScenaristImpl(options);
};
