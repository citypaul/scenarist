import {
  buildConfig,
  createScenarioManager,
  createResponseSelector,
  createInMemorySequenceTracker,
  createInMemoryStateManager,
  noOpLogger,
  SCENARIST_TEST_ID_HEADER,
  type BaseAdapterOptions,
  type ScenaristConfig,
  type ScenarioManager,
  type ScenarioRegistry,
  type ScenarioStore,
  type ResponseSelector,
} from "@scenarist/core";
import {
  createSharedMswServer,
  type SharedMswServer,
} from "@scenarist/msw-adapter";

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
  readonly server: SharedMswServer;
  readonly currentTestId: { value: string }; // Mutable ref for MSW handler
};

/**
 * Creates the base Scenarist setup shared by both Pages and App Router.
 *
 * Follows hexagonal architecture:
 * - Accepts optional port implementations via dependency injection
 * - Requires the injected registry and store; state manager and sequence tracker default to in-memory
 * - Sets up MSW dynamic handler with response selector
 * - Initializes MSW server
 *
 * @param options - Adapter configuration options
 * @returns Shared setup objects for both router implementations
 */
export const createScenaristBase = (
  options: BaseAdapterOptions & {
    readonly registry: ScenarioRegistry;
    readonly store: ScenarioStore;
  },
): ScenaristBaseSetup => {
  const config = buildConfig(options);
  const logger = options.logger ?? noOpLogger;

  // Registry and store are the router's global singletons, injected by impl.ts
  const { registry, store } = options;
  const stateManager = options.stateManager ?? createInMemoryStateManager();
  const sequenceTracker =
    options.sequenceTracker ?? createInMemorySequenceTracker();

  // Create scenario manager with all dependencies
  const manager = createScenarioManager({
    registry,
    store,
    stateManager,
    sequenceTracker,
    logger,
  });

  // Register all scenarios upfront from scenarios object
  Object.values(options.scenarios).forEach((scenario) => {
    manager.registerScenario(scenario);
  });

  // Create response selector for dynamic responses
  const responseSelector = createResponseSelector({
    sequenceTracker,
    stateManager,
    logger,
  });

  // Mutable ref to current test ID (updated by adapter methods)
  const currentTestId = { value: config.defaultTestId };

  // Create MSW dynamic handler
  const server = createSharedMswServer({
    getTestId: (request) => {
      // Extract test ID from request headers (MSW Request object)
      const headerValue = request.headers.get(SCENARIST_TEST_ID_HEADER);
      return headerValue || config.defaultTestId;
    },
    getActiveScenario: (testId) => manager.getActiveScenario(testId),
    getScenarioDefinition: (scenarioId) => manager.getScenarioById(scenarioId),
    strictMode: config.strictMode,
    responseSelector,
    errorBehaviors: config.errorBehaviors,
    logger,
  });

  return {
    config,
    manager,
    responseSelector,
    server,
    currentTestId,
  };
};
