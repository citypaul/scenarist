import type { ScenaristScenarios } from '@scenarist/core';

// Re-export types from impl for public API
export type { ExpressAdapterOptions, ExpressScenarist } from './impl.js';

/**
 * Production-only entry point that returns undefined without loading any dependencies.
 * This file has ZERO imports to guarantee tree-shaking.
 */
export const createScenarist = async <T extends ScenaristScenarios>(
  _options: import('./impl.js').ExpressAdapterOptions<T>
): Promise<import('./impl.js').ExpressScenarist<T> | undefined> => {
  return undefined;
};
