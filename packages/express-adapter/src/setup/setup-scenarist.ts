import { Router } from 'express';
import { setupServer } from 'msw/node';
import {
  buildConfig,
  createScenarioManager,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  type BaseAdapterOptions,
  type ScenaristAdapter,
} from '@scenarist/core';
import { createDynamicHandler } from '@scenarist/msw-adapter';
import { testIdStorage } from '../middleware/test-id-middleware.js';
import { createTestIdMiddleware } from '../middleware/test-id-middleware.js';
import { createScenarioEndpoints } from '../endpoints/scenario-endpoints.js';

/**
 * Express-specific adapter options.
 *
 * Extends BaseAdapterOptions to ensure consistency across all adapters.
 */
export type ExpressAdapterOptions = BaseAdapterOptions;

/**
 * Express adapter instance.
 *
 * Implements ScenaristAdapter<Router> to ensure API consistency.
 */
export type ExpressScenarist = ScenaristAdapter<Router>;

/**
 * Create a Scenarist instance for Express.
 *
 * This is the primary API for Express users. It wires everything automatically:
 * - MSW server with dynamic handler
 * - Test ID middleware
 * - Scenario endpoints
 * - Scenario manager
 *
 * @example
 * ```typescript
 * const scenarist = createScenarist({ enabled: true });
 * scenarist.registerScenario(myScenario);
 * app.use(scenarist.middleware);
 * beforeAll(() => scenarist.start());
 * afterAll(() => scenarist.stop());
 * ```
 */
export const createScenarist = (
  options: ExpressAdapterOptions
): ExpressScenarist => {
  const config = buildConfig(options);
  const registry = options.registry ?? new InMemoryScenarioRegistry();
  const store = options.store ?? new InMemoryScenarioStore();
  const manager = createScenarioManager({ registry, store });

  // Auto-register the default scenario
  manager.registerScenario(options.defaultScenario);

  const handler = createDynamicHandler({
    getTestId: () => testIdStorage.getStore() ?? config.defaultTestId,
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
    strictMode: config.strictMode,
    defaultScenarioId: config.defaultScenarioId,
  });

  const server = setupServer(handler);

  const middleware = Router();
  middleware.use(createTestIdMiddleware(config));
  middleware.use(createScenarioEndpoints(manager, config));

  return {
    config,
    middleware,
    registerScenario: (definition) => manager.registerScenario(definition),
    registerScenarios: (definitions) => {
      // Validate all scenarios first (fail-fast before registering any)
      // This provides transaction-like behavior - either all succeed or none are registered
      definitions.forEach((definition) => {
        const existing = manager.getScenarioById(definition.id);
        if (existing) {
          throw new Error(
            `Scenario '${definition.id}' is already registered. Each scenario must have a unique ID.`
          );
        }
      });

      // If validation passed, register all scenarios
      definitions.forEach((definition) => manager.registerScenario(definition));
    },
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
