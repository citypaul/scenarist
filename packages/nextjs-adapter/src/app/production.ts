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
 * Production-safe helper that returns the default test ID.
 * In production, scenarist is undefined, so this always returns 'default-test'.
 */
export function getScenaristTestId(_request: unknown): string {
  return 'default-test';
}

/**
 * Production-safe helper that returns the default test ID from ReadonlyHeaders.
 * In production, scenarist is undefined, so this always returns 'default-test'.
 */
export function getScenaristTestIdFromReadonlyHeaders(_headers: unknown): string {
  return 'default-test';
}
