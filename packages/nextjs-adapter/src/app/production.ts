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
 * Production-safe helper that returns empty headers.
 * In production, scenarist is undefined, so this always returns an empty object.
 */
export function getScenaristHeaders(_request: unknown): Record<string, string> {
  return {};
}

/**
 * Production-safe helper that returns empty headers for ReadonlyHeaders.
 * In production, scenarist is undefined, so this always returns an empty object.
 */
export function getScenaristHeadersFromReadonlyHeaders(_headers: unknown): Record<string, string> {
  return {};
}

/**
 * Default Scenarist configuration constants.
 * Safe to use even in production.
 */
export const SCENARIST_TEST_ID_HEADER = 'x-test-id';
export const SCENARIST_DEFAULT_TEST_ID = 'default-test';
