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
 * Production-safe helper that returns empty headers.
 * In production, scenarist is undefined, so this always returns an empty object.
 */
export function getScenaristHeaders(_req: unknown): Record<string, string> {
  return {};
}
