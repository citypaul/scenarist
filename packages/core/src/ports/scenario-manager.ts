import type { ScenarioDefinition, ActiveScenario, Result } from '../types/index.js';

/**
 * Primary port for scenario management.
 *
 * ScenarioManager is a coordinator/facade that orchestrates interactions between
 * ScenarioRegistry (catalog of available scenarios) and ScenarioStore (active
 * scenarios per test ID). It enforces business rules and provides a unified API.
 *
 * **Architectural Role:**
 * - Coordinates between registry and store
 * - Enforces business rules (e.g., can't activate non-existent scenarios)
 * - Provides test isolation via test IDs
 * - Main entry point for scenario operations
 *
 * **Implementation Pattern:**
 * Implementations accept ScenarioRegistry and ScenarioStore as constructor
 * parameters (dependency injection), never creating them internally.
 *
 * @example
 * ```typescript
 * // Factory function accepts both ports as dependencies
 * const manager = createScenarioManager({
 *   registry: new InMemoryScenarioRegistry(),
 *   store: new InMemoryScenarioStore(),
 *   config: buildConfig({ enabled: true }),
 * });
 * ```
 *
 * **Thread Safety:**
 * Implementations must be thread-safe for concurrent test execution.
 */
export interface ScenarioManager {
  /**
   * Register a scenario definition in the catalog.
   *
   * Delegates to: ScenarioRegistry.register()
   *
   * @param definition The scenario definition to register
   * @throws Error if scenario ID is already registered
   */
  registerScenario(definition: ScenarioDefinition): void;

  /**
   * Switch to a different scenario for a specific test ID.
   *
   * Business rule: Validates scenario exists in registry before activating.
   * Delegates to: ScenarioRegistry.get() then ScenarioStore.set()
   *
   * This enables test isolation - different tests can run different scenarios.
   *
   * @param testId Unique identifier for the test
   * @param scenarioId ID of the scenario to activate
   * @param variantName Optional variant name for the scenario
   * @returns Success or error if scenario not found in registry
   */
  switchScenario(
    testId: string,
    scenarioId: string,
    variantName?: string
  ): Result<void, Error>;

  /**
   * Get the currently active scenario reference for a test ID.
   *
   * Delegates to: ScenarioStore.get()
   *
   * Note: This returns only the reference (scenarioId + variantName).
   * To get the full ScenarioDefinition, use getScenarioById().
   *
   * @param testId Unique identifier for the test
   * @returns Active scenario reference or undefined if no scenario active
   */
  getActiveScenario(testId: string): ActiveScenario | undefined;

  /**
   * List all registered scenario definitions from the catalog.
   *
   * Delegates to: ScenarioRegistry.list()
   *
   * Useful for debugging and dev tools.
   *
   * @returns Array of all registered scenario definitions
   */
  listScenarios(): ReadonlyArray<ScenarioDefinition>;

  /**
   * Clear the active scenario for a specific test ID.
   *
   * Delegates to: ScenarioStore.delete()
   *
   * Useful for cleanup after tests.
   *
   * @param testId Unique identifier for the test
   */
  clearScenario(testId: string): void;

  /**
   * Get a registered scenario definition by ID without activating it.
   *
   * Delegates to: ScenarioRegistry.get()
   *
   * @param id Scenario definition ID
   * @returns Scenario definition or undefined if not found
   */
  getScenarioById(id: string): ScenarioDefinition | undefined;
}
