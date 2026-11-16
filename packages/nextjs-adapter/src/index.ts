/**
 * Next.js adapter for Scenarist.
 *
 * Provides MSW-based scenario management for Next.js applications (App Router and Pages Router).
 *
 * For App Router setup, import from `@scenarist/nextjs-adapter/app`.
 * For Pages Router setup, import from `@scenarist/nextjs-adapter/pages`.
 *
 * Shared Scenarist types, constants, loggers, and request contexts are available from the root package.
 *
 * @module @scenarist/nextjs-adapter
 *
 * @example
 * ```typescript
 * // Defining scenarios (router-agnostic)
 * import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/nextjs-adapter';
 *
 * export const defaultScenario: ScenaristScenario = {
 *   id: 'default',
 *   name: 'Default Scenario',
 *   description: 'Baseline mocks',
 *   mocks: [
 *     {
 *       method: 'GET',
 *       url: 'https://api.example.com/user',
 *       response: { status: 200, body: { name: 'Default User' } },
 *     },
 *   ],
 * };
 *
 * export const scenarios = {
 *   default: defaultScenario,
 * } as const satisfies ScenaristScenarios;
 * ```
 */

export { AppRequestContext } from "./app/context.js";
export { PagesRequestContext } from "./pages/context.js";
export type { AppAdapterOptions, AppScenarist } from "./app/setup.js";
export type { PagesAdapterOptions, PagesScenarist } from "./pages/setup.js";

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
