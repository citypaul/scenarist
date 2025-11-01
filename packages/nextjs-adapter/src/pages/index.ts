/**
 * Next.js Pages Router adapter for Scenarist.
 *
 * Provides MSW-based scenario management for Next.js applications using Pages Router.
 *
 * @module @scenarist/nextjs-adapter/pages
 *
 * @example
 * ```typescript
 * // lib/scenarist.ts
 * import { createScenarist } from '@scenarist/nextjs-adapter/pages';
 *
 * export const scenarist = createScenarist({
 *   enabled: process.env.NODE_ENV === 'development',
 *   defaultScenario: myDefaultScenario,
 * });
 *
 * // pages/api/__scenario__.ts
 * import { scenarist } from '../../lib/scenarist';
 *
 * export default scenarist.createScenarioEndpoint();
 *
 * // tests/setup.ts
 * import { scenarist } from '../lib/scenarist';
 *
 * beforeAll(() => scenarist.start());
 * afterAll(() => scenarist.stop());
 * ```
 */

export { createScenarist } from './setup.js';
export { PagesRequestContext } from './context.js';
export { createScenarioEndpoint } from './endpoints.js';
export type { PagesAdapterOptions, PagesScenarist } from './setup.js';
