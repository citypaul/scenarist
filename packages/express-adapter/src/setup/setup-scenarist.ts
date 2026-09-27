import type { ScenaristScenarios } from "@scenarist/core";
import {
  createScenaristImpl,
  type ExpressAdapterOptions,
  type ExpressScenarist,
} from "./impl.js";

// Re-export types from impl for public API
export type { ExpressAdapterOptions, ExpressScenarist } from "./impl.js";

/**
 * The NODE_ENV check is defense-in-depth: unbundled `node server.js` deploys don't apply the `production` export condition, so without it the scenario endpoints would mount in production.
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
