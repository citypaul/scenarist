// Re-export types from setup for public API
export type { PagesAdapterOptions, PagesScenarist } from './setup.js';

/**
 * Production-only entry point that returns undefined without loading any dependencies.
 * This file has ZERO imports to guarantee tree-shaking.
 */
export const createScenarist = async (
  _options: import('./setup.js').PagesAdapterOptions
): Promise<import('./setup.js').PagesScenarist | undefined> => {
  return undefined;
};

/**
 * Re-export helper from helpers.ts.
 * This is safe to export in production because it accesses the global singleton,
 * which will be undefined in production builds, causing it to return an empty object.
 */
export { getScenaristHeaders } from './helpers.js';
