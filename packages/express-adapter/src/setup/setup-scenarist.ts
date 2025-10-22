import { Router } from 'express';
import { setupServer } from 'msw/node';
import {
  buildConfig,
  createScenarioManager,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  type ScenaristConfigInput,
  type ScenarioManager,
  type ScenarioRegistry,
  type ScenarioStore,
  type ScenarioDefinition,
  type Result,
} from '@scenarist/core';
import { createDynamicHandler } from '@scenarist/msw-adapter';
import { testIdStorage } from '../middleware/test-id-middleware.js';
import { createTestIdMiddleware } from '../middleware/test-id-middleware.js';
import { createScenarioEndpoints } from '../endpoints/scenario-endpoints.js';

export type CreateScenaristOptions = ScenaristConfigInput & {
  readonly registry?: ScenarioRegistry;
  readonly store?: ScenarioStore;
};

export type Scenarist = {
  readonly middleware: Router;
  readonly registerScenario: (definition: ScenarioDefinition) => void;
  readonly switchScenario: (
    testId: string,
    scenarioId: string,
    variantName?: string
  ) => Result<void, Error>;
  readonly getActiveScenario: ScenarioManager['getActiveScenario'];
  readonly getScenarioById: ScenarioManager['getScenarioById'];
  readonly listScenarios: ScenarioManager['listScenarios'];
  readonly clearScenario: ScenarioManager['clearScenario'];
  readonly start: () => void;
  readonly stop: () => Promise<void>;
};

export const createScenarist = (options: CreateScenaristOptions): Scenarist => {
  const config = buildConfig(options);
  const registry = options.registry ?? new InMemoryScenarioRegistry();
  const store = options.store ?? new InMemoryScenarioStore();
  const manager = createScenarioManager({ registry, store });

  const handler = createDynamicHandler({
    getTestId: () => testIdStorage.getStore() ?? config.defaultTestId,
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
    strictMode: config.strictMode,
  });

  const server = setupServer(handler);

  const middleware = Router();
  middleware.use(createTestIdMiddleware(config));
  middleware.use(createScenarioEndpoints(manager, config));

  return {
    middleware,
    registerScenario: (definition) => manager.registerScenario(definition),
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
