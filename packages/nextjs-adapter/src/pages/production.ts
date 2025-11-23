// Re-export types from setup for public API
export type { PagesAdapterOptions, PagesScenarist } from './setup.js';

/**
 * Production-only entry point that returns undefined without loading any dependencies.
 * This file has ZERO imports to guarantee tree-shaking.
 *
 * NOTE: Helpers (getScenaristHeaders) are NOT exported from production.ts because
 * they're imported from index.ts, which always uses the regular entry point.
 * The helper accesses the global singleton directly, so in production (when scenarist
 * is undefined), it safely returns {} via the implementation in helpers.ts.
 */
export const createScenarist = async (
  _options: import('./setup.js').PagesAdapterOptions
): Promise<import('./setup.js').PagesScenarist | undefined> => {
  return undefined;
};
