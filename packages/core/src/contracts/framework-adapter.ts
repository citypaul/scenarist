import type {
  ScenarioDefinition,
  ActiveScenario,
  Result,
  ScenaristConfigInput,
  ScenaristConfig,
  ScenariosObject,
  ScenarioIds,
} from '../types/index.js';
import type { ScenarioRegistry } from '../ports/driven/scenario-registry.js';
import type { ScenarioStore } from '../ports/driven/scenario-store.js';

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
 * export type ExpressAdapterOptions<T extends ScenariosObject = ScenariosObject> =
 *   BaseAdapterOptions<T>;
 *
 * // Fastify adapter - adds framework-specific options
 * export type FastifyAdapterOptions<T extends ScenariosObject = ScenariosObject> =
 *   BaseAdapterOptions<T> & {
 *     readonly logLevel?: 'debug' | 'info' | 'warn' | 'error';
 *   };
 * ```
 */
export type BaseAdapterOptions<T extends ScenariosObject = ScenariosObject> =
  ScenaristConfigInput<T> & {
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
  TScenarios extends ScenariosObject = ScenariosObject
> = {
  /**
   * Resolved configuration.
   *
   * Use this to access configured endpoints and headers in tests.
   *
   * @example
   * ```typescript
   * await request(app)
   *   .post(scenarist.config.endpoints.setScenario)
   *   .set(scenarist.config.headers.testId, 'test-123')
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
    variantName?: string
  ) => Result<void, Error>;

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
    scenarioId: ScenarioIds<TScenarios>
  ) => ScenarioDefinition | undefined;

  /**
   * List all registered scenarios.
   */
  readonly listScenarios: () => ReadonlyArray<ScenarioDefinition>;

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
