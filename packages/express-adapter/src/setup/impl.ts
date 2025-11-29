import { Router } from "express";
import { setupServer } from "msw/node";
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
  type ScenaristScenarios,
} from "@scenarist/core";
import { createDynamicHandler } from "@scenarist/msw-adapter";
import { testIdStorage } from "../middleware/test-id-middleware.js";
import { createTestIdMiddleware } from "../middleware/test-id-middleware.js";
import { createScenarioEndpoints } from "../endpoints/scenario-endpoints.js";

/**
 * Express-specific adapter options.
 *
 * Extends BaseAdapterOptions to ensure consistency across all adapters.
 *
 * @template T - Scenarios object for type-safe scenario IDs
 */
export type ExpressAdapterOptions<
  T extends ScenaristScenarios = ScenaristScenarios,
> = BaseAdapterOptions<T>;

/**
 * Express adapter instance.
 *
 * Implements ScenaristAdapter<Router> to ensure API consistency.
 *
 * @template T - Scenarios object for type-safe scenario IDs
 */
export type ExpressScenarist<
  T extends ScenaristScenarios = ScenaristScenarios,
> = ScenaristAdapter<Router, T>;

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
 * } as const satisfies ScenaristScenarios;
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
export const createScenaristImpl = <T extends ScenaristScenarios>(
  options: ExpressAdapterOptions<T>,
): ExpressScenarist<T> => {
  const config = buildConfig(options);
  const registry = options.registry ?? new InMemoryScenarioRegistry();
  const store = options.store ?? new InMemoryScenarioStore();

  const stateManager = createInMemoryStateManager();
  const sequenceTracker = createInMemorySequenceTracker();

  const manager = createScenarioManager({
    registry,
    store,
    stateManager,
    sequenceTracker,
  });

  // Register all scenarios upfront from the scenarios object
  Object.values(options.scenarios).forEach((scenario) => {
    manager.registerScenario(scenario);
  });

  const responseSelector = createResponseSelector({
    sequenceTracker,
    stateManager,
  });

  const handler = createDynamicHandler({
    getTestId: (_request) => testIdStorage.getStore() ?? config.defaultTestId,
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
    strictMode: config.strictMode,
    responseSelector,
  });

  const server = setupServer(handler);

  const middleware = Router();
  middleware.use(createTestIdMiddleware(config));
  middleware.use(createScenarioEndpoints(manager, config));

  return {
    config,
    middleware,
    switchScenario: (testId, scenarioId) =>
      manager.switchScenario(testId, scenarioId),
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioById: (scenarioId) => manager.getScenarioById(scenarioId),
    listScenarios: () => manager.listScenarios(),
    clearScenario: (testId) => manager.clearScenario(testId),
    start: () => server.listen(),
    stop: async () => server.close(),
  };
};
