// Re-export types from setup for public API
export type { PagesAdapterOptions, PagesScenarist } from './setup.js';

/**
 * Production-only entry point that returns undefined without loading test dependencies.
 *
 * This file returns undefined from createScenarist to prevent MSW and test code from
 * being included in production bundles. Conditional exports ensure this file is used
 * when NODE_ENV=production, achieving 100% tree-shaking of test infrastructure.
 *
 * Note: Helper function is NOT exported here - it's exported from index.ts and
 * accesses the global singleton, which will be undefined in production, causing it
 * to safely return an empty object.
 */
export const createScenarist = (
  _options: import('./setup.js').PagesAdapterOptions
): import('./setup.js').PagesScenarist | undefined => {
  return undefined;
};
