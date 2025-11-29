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

export { createScenarist } from "./setup.js";
export { PagesRequestContext } from "./context.js";
export { createScenarioEndpoint } from "./endpoints.js";
export { getScenaristHeaders } from "./helpers.js";
export type { PagesAdapterOptions, PagesScenarist } from "./setup.js";

// Re-export core types and constants for user convenience (users should only install this adapter)
export { SCENARIST_TEST_ID_HEADER } from "@scenarist/core";
export type {
  ScenaristScenario,
  ScenaristMock,
  ScenaristResponse,
  ScenaristSequence,
  ScenaristMatch,
  ScenaristCaptureConfig,
  ScenaristScenarios,
  ScenaristConfig,
  ScenaristResult,
} from "@scenarist/core";
