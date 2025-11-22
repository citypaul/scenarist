// Re-export types from setup for public API
export type { PagesAdapterOptions, PagesScenarist } from './setup.js';

/**
 * Production-only entry point that returns undefined without loading any dependencies.
 * This file has ZERO imports to guarantee tree-shaking.
 */
export const createScenarist = (
  _options: import('./setup.js').PagesAdapterOptions
): import('./setup.js').PagesScenarist | undefined => {
  return undefined;
};
