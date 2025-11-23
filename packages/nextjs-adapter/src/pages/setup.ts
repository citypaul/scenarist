// Re-export types from impl for public API
export type { PagesAdapterOptions, PagesScenarist } from './impl.js';

/**
 * Create a Scenarist instance for Next.js Pages Router.
 *
 * In production (NODE_ENV=production), this returns undefined to enable
 * tree-shaking of all Scenarist code. In development/test environments,
 * it returns a fully-functional PagesScenarist instance.
 *
 * This pattern uses dynamic import to enable tree-shaking: the impl.js module
 * is only loaded when needed (non-production). Combined with conditional exports
 * and sideEffects: false, bundlers can eliminate the entire impl.js module
 * from production builds.
 *
 * **Defense in Depth:**
 * 1. Conditional exports (`"production": "./dist/pages/production.js"`) - Bundler-level
 * 2. NODE_ENV check + dynamic imports (this file) - Code-level fallback
 *
 * This ensures production safety even if bundler configuration is non-standard.
 *
 * @example
 * ```typescript
 * // lib/scenarist.ts
 * import { createScenarist } from '@scenarist/nextjs-adapter/pages';
 * import { scenarios } from './scenarios';
 *
 * export const scenarist = await createScenarist({
 *   enabled: true,
 *   scenarios,
 * });
 *
 * // pages/api/__scenario__.ts
 * import { scenarist } from '../../lib/scenarist';
 *
 * export default scenarist?.createScenarioEndpoint();
 *
 * // tests/setup.ts
 * if (scenarist) {
 *   beforeAll(() => scenarist.start());
 *   afterAll(() => scenarist.stop());
 * }
 * ```
 */
export const createScenarist = async (
  options: import('./impl.js').PagesAdapterOptions
): Promise<import('./impl.js').PagesScenarist | undefined> => {
  // In production, return undefined without loading impl.js
  // Dynamic import below is never executed, enabling tree-shaking
  if (process.env.NODE_ENV === 'production') {
    return undefined;
  }

  // In non-production, dynamically import and create instance
  const { createScenaristImpl } = await import('./impl.js');
  return createScenaristImpl(options);
};
