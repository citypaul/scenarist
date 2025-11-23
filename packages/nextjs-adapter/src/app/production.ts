// Re-export types from setup for public API
export type { AppAdapterOptions, AppScenarist } from './setup.js';

/**
 * Production-only entry point that returns undefined without loading any dependencies.
 * This file has ZERO imports to guarantee tree-shaking.
 */
export const createScenarist = async (
  _options: import('./setup.js').AppAdapterOptions
): Promise<import('./setup.js').AppScenarist | undefined> => {
  return undefined;
};

/**
 * Re-export helpers from helpers.ts.
 * These are safe to export in production because they access the global singleton,
 * which will be undefined in production builds, causing them to return empty objects/defaults.
 */
export {
  getScenaristHeaders,
  getScenaristHeadersFromReadonlyHeaders,
  getScenaristTestId,
  getScenaristTestIdFromReadonlyHeaders,
} from './helpers.js';
