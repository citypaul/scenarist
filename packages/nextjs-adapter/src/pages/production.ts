// Re-export types from setup for public API
export type { PagesAdapterOptions, PagesScenarist } from './setup.js';

/**
 * Production-only entry point that returns undefined without loading test dependencies.
 *
 * This file provides safe stub implementations for all Scenarist functions to prevent
 * MSW and test code from being included in production bundles. Conditional exports
 * ensure this file is used when NODE_ENV=production, achieving 100% tree-shaking
 * of test infrastructure.
 *
 * All helper functions return safe defaults (empty objects) so that application code
 * can import and use them without production guards.
 */
export const createScenarist = (
  _options: import('./setup.js').PagesAdapterOptions
): import('./setup.js').PagesScenarist | undefined => {
  return undefined;
};

/**
 * Production stub: Returns empty object (no test headers needed in production)
 */
export function getScenaristHeaders(
  _req: import('next').NextApiRequest
): Record<string, string> {
  return {};
}
