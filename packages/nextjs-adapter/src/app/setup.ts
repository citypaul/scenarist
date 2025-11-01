import { setupServer } from 'msw/node';
import {
  buildConfig,
  createScenarioManager,
  createResponseSelector,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  createInMemorySequenceTracker,
  createInMemoryStateManager,
  type BaseAdapterOptions,
  type ScenaristAdapter,
} from '@scenarist/core';
import { createDynamicHandler } from '@scenarist/msw-adapter';
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
  const config = buildConfig(options);
  const registry = options.registry ?? new InMemoryScenarioRegistry();
  const store = options.store ?? new InMemoryScenarioStore();

  const stateManager = createInMemoryStateManager();
  const sequenceTracker = createInMemorySequenceTracker();

  const manager = createScenarioManager({ registry, store, stateManager, sequenceTracker });

  manager.registerScenario(options.defaultScenario);

  const responseSelector = createResponseSelector({ sequenceTracker, stateManager });

  // For Next.js, we don't have AsyncLocalStorage context like Express
  // Instead, test ID is extracted per-request in the endpoint handlers
  let currentTestId = config.defaultTestId;

  const handler = createDynamicHandler({
    getTestId: () => currentTestId,
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
    strictMode: config.strictMode,
    defaultScenarioId: config.defaultScenarioId,
    responseSelector,
  });

  const server = setupServer(handler);

  return {
    config,
    registerScenario: (definition) => manager.registerScenario(definition),
    registerScenarios: (definitions) => {
      definitions.forEach((definition) => manager.registerScenario(definition));
    },
    switchScenario: (testId, scenarioId, variantName) => {
      currentTestId = testId; // Update for MSW handler
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
