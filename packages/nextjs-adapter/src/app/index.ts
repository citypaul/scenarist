/**
 * Next.js App Router adapter for Scenarist.
 *
 * Provides MSW-based scenario management for Next.js applications using App Router.
 *
 * @module @scenarist/nextjs-adapter/app
 *
 * @example
 * ```typescript
 * // lib/scenarist.ts
 * import { createScenarist } from '@scenarist/nextjs-adapter/app';
 *
 * export const scenarist = createScenarist({
 *   enabled: process.env.NODE_ENV === 'development',
 *   defaultScenario: myDefaultScenario,
 * });
 *
 * // app/api/%5F%5Fscenario%5F%5F/route.ts
 * // Note: Use %5F (URL-encoded underscore) because Next.js treats
 * // folders starting with _ as private folders excluded from routing
 * import { scenarist } from '@/lib/scenarist';
 *
 * export const POST = scenarist.createScenarioEndpoint();
 * export const GET = scenarist.createScenarioEndpoint();
 *
 * // tests/setup.ts
 * import { scenarist } from '../lib/scenarist';
 *
 * beforeAll(() => scenarist.start());
 * afterAll(() => scenarist.stop());
 * ```
 */

export { createScenarist } from "./setup.js";
export { AppRequestContext } from "./context.js";
export { createScenarioEndpoint } from "./endpoints.js";
export {
  getScenaristHeaders,
  getScenaristHeadersFromReadonlyHeaders,
  getScenaristTestId,
  getScenaristTestIdFromReadonlyHeaders,
} from "./helpers.js";
export type { AppAdapterOptions, AppScenarist } from "./setup.js";

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

// Logger exports - for debugging and observability
export {
  noOpLogger,
  createNoOpLogger,
  createConsoleLogger,
} from "@scenarist/core";
export type {
  Logger,
  LogLevel,
  LogCategory,
  LogContext,
  ConsoleLoggerConfig,
  LogFormat,
} from "@scenarist/core";
