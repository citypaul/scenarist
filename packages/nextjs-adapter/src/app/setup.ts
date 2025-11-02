import type { BaseAdapterOptions, ScenaristAdapter } from '@scenarist/core';
import { createScenaristBase } from '../common/create-scenarist-base.js';
import { createScenarioEndpoint } from './endpoints.js';

/**
 * Next.js App Router adapter options.
 *
 * Extends BaseAdapterOptions to ensure consistency across all adapters.
 */
export type AppAdapterOptions = BaseAdapterOptions;

/**
 * Next.js App Router adapter instance.
 *
 * Provides MSW server lifecycle management and scenario endpoint factory.
 * Unlike Express adapter, doesn't provide middleware (Next.js doesn't have global middleware for App Router).
 */
export type AppScenarist = Omit<ScenaristAdapter<never>, 'middleware'> & {
  /**
   * Create scenario endpoint handler for use in app/api/__scenario__/route.ts
   *
   * @example
   * ```typescript
   * // app/api/__scenario__/route.ts
   * import { scenarist } from '@/lib/scenarist';
   *
   * export const POST = scenarist.createScenarioEndpoint();
   * export const GET = scenarist.createScenarioEndpoint();
   * ```
   */
  createScenarioEndpoint: () => ReturnType<typeof createScenarioEndpoint>;
};

/**
 * Create a Scenarist instance for Next.js App Router.
 *
 * This is the primary API for Next.js App Router users. It wires everything automatically:
 * - MSW server with dynamic handler
 * - Scenario manager
 * - State manager and sequence tracker
 * - Response selector
 *
 * Unlike Express adapter, this doesn't return middleware. Instead, use `createScenarioEndpoint()`
 * to create the handler for your app/api/__scenario__/route.ts file.
 *
 * @example
 * ```typescript
 * // lib/scenarist.ts
 * import { createScenarist } from '@scenarist/nextjs-adapter/app';
 * import { defaultScenario } from './scenarios';
 *
 * export const scenarist = createScenarist({
 *   enabled: process.env.NODE_ENV === 'development',
 *   defaultScenario,
 * });
 *
 * // app/api/__scenario__/route.ts
 * export const POST = scenarist.createScenarioEndpoint();
 * export const GET = scenarist.createScenarioEndpoint();
 *
 * // tests/setup.ts
 * beforeAll(() => scenarist.start());
 * afterAll(() => scenarist.stop());
 * ```
 */
export const createScenarist = (options: AppAdapterOptions): AppScenarist => {
  const { config, manager, server, currentTestId } =
    createScenaristBase(options);

  return {
    config,
    switchScenario: (testId, scenarioId, variantName) => {
      currentTestId.value = testId; // Update for MSW handler
      return manager.switchScenario(testId, scenarioId, variantName);
    },
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioById: (scenarioId) => manager.getScenarioById(scenarioId),
    listScenarios: () => manager.listScenarios(),
    clearScenario: (testId) => manager.clearScenario(testId),
    createScenarioEndpoint: () => createScenarioEndpoint(manager, config),
    start: () => server.listen(),
    stop: async () => server.close(),
  };
};
