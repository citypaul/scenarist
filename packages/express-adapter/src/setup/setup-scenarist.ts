import type { ScenaristScenarios } from "@scenarist/core";
import {
  createScenaristImpl,
  type ExpressAdapterOptions,
  type ExpressScenarist,
} from "./impl.js";

// Re-export types from impl for public API
export type { ExpressAdapterOptions, ExpressScenarist } from "./impl.js";

/**
 * Create a Scenarist instance for Express, or `undefined` when `enabled` is false or `NODE_ENV` is 'production'.
 *
 * @example
 * ```typescript
 * export const scenarist = createScenarist({
 *   enabled: process.env.NODE_ENV === "test",
 *   scenarios,
 * });
 *
 * if (scenarist) {
 *   app.use(scenarist.middleware);
 * }
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
