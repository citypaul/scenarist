import {
  buildConfig,
  createScenarioManager,
  InMemoryScenarioRegistry,
  InMemoryScenarioStore,
  type ScenarioDefinition,
  type ScenarioManager,
  type ScenaristConfig,
} from '@scenarist/core';

/**
 * Create a default scenario for testing.
 *
 * Reusable across all adapter test suites to ensure consistency.
 */
export const createDefaultScenario = (): ScenarioDefinition => ({
  id: 'default',
  name: 'Default Scenario',
  description: 'Default test scenario',
  mocks: [],
});

/**
 * Create a premium scenario for testing.
 *
 * Used to test scenario switching functionality.
 */
export const createPremiumScenario = (): ScenarioDefinition => ({
  id: 'premium',
  name: 'Premium Scenario',
  description: 'Premium test scenario',
  mocks: [],
});

/**
 * Shared test setup result.
 *
 * Contains all dependencies needed for endpoint testing.
 */
export type EndpointTestSetup<T> = {
  readonly handler: T;
  readonly manager: ScenarioManager;
  readonly config: ScenaristConfig;
};

/**
 * Create shared test setup for endpoint tests.
 *
 * Eliminates ~50 lines of duplicated setup code between
 * Pages Router and App Router endpoint tests.
 *
 * Factory pattern ensures:
 * - Fresh dependencies for each test (no shared mutable state)
 * - Consistent test data across adapter implementations
 * - Easy to extend with new scenarios
 *
 * @param createHandler - Framework-specific handler factory
 * @returns Test setup with handler, manager, and config
 *
 * @example
 * ```typescript
 * // In Pages Router tests
 * const createTestSetup = () =>
 *   createEndpointTestSetup(createScenarioEndpoint);
 *
 * it('should switch scenarios', () => {
 *   const { handler, manager } = createTestSetup();
 *   // Test with fresh dependencies
 * });
 * ```
 */
export const createEndpointTestSetup = <T>(
  createHandler: (manager: ScenarioManager, config: ScenaristConfig) => T
): EndpointTestSetup<T> => {
  const defaultScenario = createDefaultScenario();
  const premiumScenario = createPremiumScenario();

  const scenarios = {
    default: defaultScenario,
    premium: premiumScenario,
  } as const;

  const registry = new InMemoryScenarioRegistry();
  const store = new InMemoryScenarioStore();
  const config = buildConfig({ enabled: true, scenarios });
  const manager = createScenarioManager({ registry, store });

  manager.registerScenario(defaultScenario);
  manager.registerScenario(premiumScenario);

  const handler = createHandler(manager, config);

  return { handler, manager, config };
};
