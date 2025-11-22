import type { ScenaristScenarios } from '@scenarist/core';

// Re-export types from impl for public API
export type { ExpressAdapterOptions, ExpressScenarist } from './impl.js';

/**
 * Create a Scenarist instance for Express.
 *
 * In production (NODE_ENV=production), this returns undefined to enable
 * tree-shaking of all Scenarist code. In development/test environments,
 * it returns a fully-functional ExpressScenarist instance.
 *
 * This allows bundlers to eliminate all Scenarist code from production builds.
 *
 * @example
 * ```typescript
 * const scenarist = await createScenarist({
 *   enabled: true,
 *   scenarios,
 * });
 *
 * if (scenarist) {
 *   app.use(scenarist.middleware);
 *   beforeAll(() => scenarist.start());
 *   afterAll(() => scenarist.stop());
 * }
 * ```
 */
export const createScenarist = async <T extends ScenaristScenarios>(
  options: import('./impl.js').ExpressAdapterOptions<T>
): Promise<import('./impl.js').ExpressScenarist<T> | undefined> => {
  // In production, return undefined to enable tree-shaking
  if (process.env.NODE_ENV === 'production') {
    return undefined;
  }

  // In non-production, dynamically import and create instance
  const { createScenaristImpl } = await import('./impl.js');
  return createScenaristImpl(options);
};
