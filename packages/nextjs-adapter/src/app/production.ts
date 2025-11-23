// Re-export types from setup for public API
export type { AppAdapterOptions, AppScenarist } from './setup.js';

/**
 * Production-only entry point that returns undefined without loading any dependencies.
 * This file has ZERO imports to guarantee tree-shaking.
 *
 * NOTE: Helpers (getScenaristHeaders, getScenaristTestId, etc.) are NOT exported from
 * production.ts because they're imported from index.ts, which always uses the regular
 * entry point. The helpers access the global singleton directly, so in production
 * (when scenarist is undefined), they safely return defaults via the constants in helpers.ts.
 */
export const createScenarist = async (
  _options: import('./setup.js').AppAdapterOptions
): Promise<import('./setup.js').AppScenarist | undefined> => {
  return undefined;
};
