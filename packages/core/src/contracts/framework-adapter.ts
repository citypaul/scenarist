import type {
  ScenarioDefinition,
  ActiveScenario,
  Result,
  ScenaristConfigInput,
  ScenaristConfig,
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
 * export type ExpressAdapterOptions = BaseAdapterOptions;
 *
 * // Fastify adapter - adds framework-specific options
 * export type FastifyAdapterOptions = BaseAdapterOptions & {
 *   readonly logLevel?: 'debug' | 'info' | 'warn' | 'error';
 * };
 * ```
 */
export type BaseAdapterOptions = ScenaristConfigInput & {
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
 */
export type ScenaristAdapter<TMiddleware = unknown> = {
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
   *   .send({ scenario: scenarios.success.id });
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
   * Register a scenario definition.
   */
  readonly registerScenario: (definition: ScenarioDefinition) => void;

  /**
   * Register multiple scenario definitions at once.
   *
   * This is a convenience method for batch registration.
   *
   * @example
   * ```typescript
   * scenarist.registerScenarios([
   *   successScenario,
   *   errorScenario,
   *   slowNetworkScenario,
   * ]);
   * ```
   */
  readonly registerScenarios: (
    definitions: ReadonlyArray<ScenarioDefinition>
  ) => void;

  /**
   * Switch active scenario for a test ID.
   */
  readonly switchScenario: (
    testId: string,
    scenarioId: string,
    variantName?: string
  ) => Result<void, Error>;

  /**
   * Get the active scenario for a test ID.
   */
  readonly getActiveScenario: (testId: string) => ActiveScenario | undefined;

  /**
   * Get a scenario definition by ID.
   */
  readonly getScenarioById: (
    scenarioId: string
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
