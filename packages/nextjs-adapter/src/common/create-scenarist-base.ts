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
  type ScenaristConfig,
  type ScenarioManager,
  type ResponseSelector,
} from '@scenarist/core';
import { createDynamicHandler } from '@scenarist/msw-adapter';

/**
 * Shared setup logic for both Pages Router and App Router adapters.
 *
 * Contains all common initialization: config building, manager creation,
 * MSW handler setup, and server initialization. This eliminates ~150 lines
 * of duplication between the two adapter implementations.
 */
export type ScenaristBaseSetup = {
  readonly config: ScenaristConfig;
  readonly manager: ScenarioManager;
  readonly responseSelector: ResponseSelector;
  readonly server: ReturnType<typeof setupServer>;
  readonly currentTestId: { value: string }; // Mutable ref for MSW handler
};

/**
 * Creates the base Scenarist setup shared by both Pages and App Router.
 *
 * Follows hexagonal architecture:
 * - Accepts optional port implementations via dependency injection
 * - Uses in-memory defaults if not provided
 * - Sets up MSW dynamic handler with response selector
 * - Initializes MSW server
 *
 * @param options - Adapter configuration options
 * @returns Shared setup objects for both router implementations
 */
export const createScenaristBase = (
  options: BaseAdapterOptions
): ScenaristBaseSetup => {
  const config = buildConfig(options);

  // Use injected ports or in-memory defaults
  const registry = options.registry ?? new InMemoryScenarioRegistry();
  const store = options.store ?? new InMemoryScenarioStore();

  // Create state and sequence managers
  const stateManager = createInMemoryStateManager();
  const sequenceTracker = createInMemorySequenceTracker();

  // Create scenario manager with all dependencies
  const manager = createScenarioManager({
    registry,
    store,
    stateManager,
    sequenceTracker,
  });

  // Register all scenarios upfront from scenarios object
  Object.values(options.scenarios).forEach((scenario) => {
    manager.registerScenario(scenario);
  });

  // Create response selector for dynamic responses
  const responseSelector = createResponseSelector({
    sequenceTracker,
    stateManager,
  });

  // Mutable ref to current test ID (updated by adapter methods)
  const currentTestId = { value: config.defaultTestId };

  // Create MSW dynamic handler
  const handler = createDynamicHandler({
    getTestId: (request) => {
      // Extract test ID from request headers (MSW Request object)
      const headerName = config.headers.testId.toLowerCase();
      const headerValue = request.headers.get(headerName);
      return headerValue || config.defaultTestId;
    },
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
    strictMode: config.strictMode,
    responseSelector,
  });

  // Initialize MSW server
  const server = setupServer(handler);

  // Add request:start listener for debugging
  server.events.on('request:start', ({ request }) => {
    console.log('[MSW] Intercepted:', request.method, request.url);
  });

  return {
    config,
    manager,
    responseSelector,
    server,
    currentTestId,
  };
};
