import type {
  ScenaristScenario,
  ActiveScenario,
  ScenaristResult,
  ScenaristConfigInput,
  ScenaristConfig,
  ScenaristScenarios,
  ScenarioIds,
} from "../types/index.js";
import type { ScenarioRegistry } from "../ports/driven/scenario-registry.js";
import type { ScenarioStore } from "../ports/driven/scenario-store.js";
import type { StateManager } from "../ports/driven/state-manager.js";
import type { SequenceTracker } from "../ports/driven/sequence-tracker.js";
import type { Logger } from "../ports/driven/logger.js";

/**
 * Base configuration options that all framework adapters must support.
 *
 * Extends ScenaristConfigInput (the core config) with adapter-specific options
 * for registry and store injection.
 *
 * Framework adapters can extend this further with framework-specific options:
 *
 * @example
 * ```typescript
 * // Express adapter - uses base options directly
 * export type ExpressAdapterOptions<T extends ScenaristScenarios = ScenaristScenarios> =
 *   BaseAdapterOptions<T>;
 *
 * // Fastify adapter - adds framework-specific options
 * export type FastifyAdapterOptions<T extends ScenaristScenarios = ScenaristScenarios> =
 *   BaseAdapterOptions<T> & {
 *     readonly logLevel?: 'debug' | 'info' | 'warn' | 'error';
 *   };
 * ```
 */
export type BaseAdapterOptions<
  T extends ScenaristScenarios = ScenaristScenarios,
> = ScenaristConfigInput<T> & {
  /**
   * Custom scenario registry implementation.
   *
   * If not provided, InMemoryScenarioRegistry will be used.
   */
  readonly registry?: ScenarioRegistry;

  /**
   * Custom scenario store implementation.
   *
   * If not provided, InMemoryScenarioStore will be used.
   */
  readonly store?: ScenarioStore;

  /**
   * Custom state manager implementation.
   *
   * If not provided, an in-memory state manager will be used.
   */
  readonly stateManager?: StateManager;

  /**
   * Custom sequence tracker implementation.
   *
   * If not provided, an in-memory sequence tracker will be used.
   */
  readonly sequenceTracker?: SequenceTracker;

  /**
   * Logger implementation for debugging and observability.
   *
   * If not provided, NoOpLogger will be used (silent).
   *
   * @example
   * ```typescript
   * import { createConsoleLogger } from '@scenarist/express-adapter';
   *
   * const scenarist = createScenarist({
   *   enabled: true,
   *   scenarios,
   *   logger: createConsoleLogger({ level: 'debug' }),
   * });
   * ```
   */
  readonly logger?: Logger;
};

/**
 * The contract that all Scenarist adapters must satisfy.
 *
 * This ensures consistent API across Express, Fastify, Next.js, etc.
 *
 * @template TMiddleware - Framework-specific middleware type
 *   - Express: Router
 *   - Fastify: FastifyPluginCallback
 *   - Next.js: NextMiddleware
 * @template TScenarios - Scenarios object for type-safe scenario IDs
 */
export type ScenaristAdapter<
  TMiddleware = unknown,
  TScenarios extends ScenaristScenarios = ScenaristScenarios,
> = {
  /**
   * Resolved configuration.
   *
   * Use this to access configured endpoints in tests.
   *
   * @example
   * ```typescript
   * import { SCENARIST_TEST_ID_HEADER } from '@scenarist/core';
   *
   * await request(app)
   *   .post(scenarist.config.endpoints.setScenario)
   *   .set(SCENARIST_TEST_ID_HEADER, 'test-123')
   *   .send({ scenario: 'cartWithState' });
   * ```
   */
  readonly config: ScenaristConfig;

  /**
   * Framework-specific middleware/plugin.
   *
   * - Express: app.use(scenarist.middleware)
   * - Fastify: app.register(scenarist.middleware)
   * - Next.js: export const middleware = scenarist.middleware
   */
  readonly middleware: TMiddleware;

  /**
   * Switch active scenario for a test ID.
   *
   * Scenario IDs are type-safe based on the scenarios object passed during creation.
   *
   * @example
   * ```typescript
   * const result = scenarist.switchScenario('test-123', 'cartWithState');
   * // TypeScript ensures 'cartWithState' is a valid scenario ID
   * ```
   */
  readonly switchScenario: (
    testId: string,
    scenarioId: ScenarioIds<TScenarios>,
  ) => ScenaristResult<void, Error>;

  /**
   * Get the active scenario for a test ID.
   */
  readonly getActiveScenario: (testId: string) => ActiveScenario | undefined;

  /**
   * Get a scenario definition by ID.
   *
   * Scenario IDs are type-safe based on the scenarios object.
   */
  readonly getScenarioById: (
    scenarioId: ScenarioIds<TScenarios>,
  ) => ScenaristScenario | undefined;

  /**
   * List all registered scenarios.
   */
  readonly listScenarios: () => ReadonlyArray<ScenaristScenario>;

  /**
   * Clear the active scenario for a test ID.
   */
  readonly clearScenario: (testId: string) => void;

  /**
   * Start the MSW server.
   *
   * Call in beforeAll() hook.
   */
  readonly start: () => void;

  /**
   * Stop the MSW server.
   *
   * Call in afterAll() hook.
   */
  readonly stop: () => Promise<void>;
};
