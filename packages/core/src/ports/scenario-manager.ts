import type { ScenarioDefinition, ActiveScenario, Result } from '../types/index.js';

/**
 * Primary port for scenario management.
 * This is the main interface for interacting with scenarios.
 *
 * Implementations must be thread-safe for concurrent test execution.
 */
export interface ScenarioManager {
  /**
   * Register a scenario definition.
   * The definition.id must be unique across all registered scenarios.
   * @throws Error if scenario ID is already registered
   */
  registerScenario(definition: ScenarioDefinition): void;

  /**
   * Switch to a different scenario for a specific test ID.
   * This enables test isolation - different tests can run different scenarios.
   */
  switchScenario(
    testId: string,
    scenarioId: string,
    variantName?: string
  ): Result<void, Error>;

  /**
   * Get the currently active scenario for a test ID.
   * Returns undefined if no scenario is active for this test.
   *
   * Note: This returns only the reference (scenarioId + variantName).
   * To get the full ScenarioDefinition, use getScenarioById().
   */
  getActiveScenario(testId: string): ActiveScenario | undefined;

  /**
   * List all registered scenario definitions.
   * Useful for debugging and dev tools.
   */
  listScenarios(): ReadonlyArray<ScenarioDefinition>;

  /**
   * Clear the active scenario for a specific test ID.
   * Useful for cleanup after tests.
   */
  clearScenario(testId: string): void;

  /**
   * Get a registered scenario definition by ID without activating it.
   * Returns undefined if scenario not found.
   */
  getScenarioById(id: string): ScenarioDefinition | undefined;
}
