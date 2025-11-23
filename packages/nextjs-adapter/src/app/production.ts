// Re-export types from setup for public API
export type { AppAdapterOptions, AppScenarist } from './setup.js';

/**
 * Production-only entry point that returns undefined without loading test dependencies.
 *
 * This file returns undefined from createScenarist to prevent MSW and test code from
 * being included in production bundles. Conditional exports ensure this file is used
 * when NODE_ENV=production, achieving 100% tree-shaking of test infrastructure.
 *
 * Note: Helper functions are NOT exported here - they're exported from index.ts and
 * access the global singleton, which will be undefined in production, causing them
 * to safely return empty objects/defaults.
 */
export const createScenarist = (
  _options: import('./setup.js').AppAdapterOptions
): import('./setup.js').AppScenarist | undefined => {
  return undefined;
};
