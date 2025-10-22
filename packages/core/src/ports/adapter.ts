import type {
  ScenarioDefinition,
  ActiveScenario,
  Result,
} from '../types/scenario.js';
import type { ScenarioRegistry } from './scenario-registry.js';
import type { ScenarioStore } from './scenario-store.js';

/**
 * Base configuration options that all adapters must support.
 *
 * Adapters can extend this with framework-specific options.
 */
export type BaseAdapterOptions = {
  readonly enabled: boolean;
  readonly strictMode?: boolean;
  readonly headers?: {
    readonly testId?: string;
    readonly mockEnabled?: string;
  };
  readonly endpoints?: {
    readonly setScenario?: string;
    readonly getScenario?: string;
  };
  readonly defaultScenario?: string;
  readonly defaultTestId?: string;
  readonly registry?: ScenarioRegistry;
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
