import { Router } from 'express';
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
  type ScenariosObject,
} from '@scenarist/core';
import { createDynamicHandler } from '@scenarist/msw-adapter';
import { testIdStorage } from '../middleware/test-id-middleware.js';
import { createTestIdMiddleware } from '../middleware/test-id-middleware.js';
import { createScenarioEndpoints } from '../endpoints/scenario-endpoints.js';

/**
 * Express-specific adapter options.
 *
 * Extends BaseAdapterOptions to ensure consistency across all adapters.
 *
 * @template T - Scenarios object for type-safe scenario IDs
 */
export type ExpressAdapterOptions<T extends ScenariosObject = ScenariosObject> =
  BaseAdapterOptions<T>;

/**
 * Express adapter instance.
 *
 * Implements ScenaristAdapter<Router> to ensure API consistency.
 *
 * @template T - Scenarios object for type-safe scenario IDs
 */
export type ExpressScenarist<T extends ScenariosObject = ScenariosObject> =
  ScenaristAdapter<Router, T>;

/**
 * Create a Scenarist instance for Express.
 *
 * This is the primary API for Express users. It wires everything automatically:
 * - MSW server with dynamic handler
 * - Test ID middleware
 * - Scenario endpoints
 * - Scenario manager with all scenarios registered upfront
 *
 * @example
 * ```typescript
 * const scenarios = {
 *   default: { id: 'default', ... },        // Required!
 *   cartWithState: { id: 'cartWithState', ... },
 *   premiumUser: { id: 'premiumUser', ... },
 * } as const satisfies ScenariosObject;
 *
 * const scenarist = createScenarist({
 *   enabled: true,
 *   scenarios,
 * });
 *
 * app.use(scenarist.middleware);
 * beforeAll(() => scenarist.start());
 * afterAll(() => scenarist.stop());
 *
 * // TypeScript provides autocomplete for scenario IDs:
 * scenarist.switchScenario('test-123', 'premiumUser');
 * ```
 */
export const createScenarist = <T extends ScenariosObject>(
  options: ExpressAdapterOptions<T>
): ExpressScenarist<T> => {
  const config = buildConfig(options);
  const registry = options.registry ?? new InMemoryScenarioRegistry();
  const store = options.store ?? new InMemoryScenarioStore();

  const stateManager = createInMemoryStateManager();
  const sequenceTracker = createInMemorySequenceTracker();

  const manager = createScenarioManager({ registry, store, stateManager, sequenceTracker });

  // Register all scenarios upfront from the scenarios object
  Object.values(options.scenarios).forEach((scenario) => {
    manager.registerScenario(scenario);
  });

  const responseSelector = createResponseSelector({ sequenceTracker, stateManager });

  const handler = createDynamicHandler({
    getTestId: (_request) => testIdStorage.getStore() ?? config.defaultTestId,
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
    strictMode: config.strictMode,
    defaultScenarioId: config.defaultScenarioId,
    responseSelector,
  });

  const server = setupServer(handler);

  const middleware = Router();
  middleware.use(createTestIdMiddleware(config));
  middleware.use(createScenarioEndpoints(manager, config));

  return {
    config,
    middleware,
    switchScenario: (testId, scenarioId, variantName) =>
      manager.switchScenario(testId, scenarioId, variantName),
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioById: (scenarioId) => manager.getScenarioById(scenarioId),
    listScenarios: () => manager.listScenarios(),
    clearScenario: (testId) => manager.clearScenario(testId),
    start: () => server.listen(),
    stop: async () => server.close(),
  };
};
