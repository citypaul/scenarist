// Re-export types from setup for public API
export type { AppAdapterOptions, AppScenarist } from './setup.js';

/**
 * Production-only entry point that returns undefined without loading any dependencies.
 * This file has ZERO imports to guarantee tree-shaking.
 */
export const createScenarist = (
  _options: import('./setup.js').AppAdapterOptions
): import('./setup.js').AppScenarist | undefined => {
  return undefined;
};
