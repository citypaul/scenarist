import type { Scenario, ActiveScenario, Result } from '../types/index.js';

/**
 * Primary port for scenario management.
 * This is the main interface for interacting with scenarios.
 *
 * Implementations must be thread-safe for concurrent test execution.
 */
export interface ScenarioManager {
  /**
   * Register a scenario with a unique ID.
   * @throws Error if scenario ID is already registered
   */
  registerScenario(id: string, scenario: Scenario): void;

  /**
   * Switch to a different scenario for a specific test ID.
   * This enables test isolation - different tests can run different scenarios.
   */
  switchScenario(
    testId: string,
    scenarioId: string,
    variant?: { name: string; meta?: unknown }
  ): Result<void, Error>;

  /**
   * Get the currently active scenario for a test ID.
   * Returns undefined if no scenario is active for this test.
   */
  getActiveScenario(testId: string): ActiveScenario | undefined;

  /**
   * List all registered scenarios.
   * Useful for debugging and dev tools.
   */
  listScenarios(): ReadonlyArray<{ id: string; scenario: Scenario }>;

  /**
   * Clear the active scenario for a specific test ID.
   * Useful for cleanup after tests.
   */
  clearScenario(testId: string): void;

  /**
   * Get a registered scenario by ID without activating it.
   */
  getScenarioById(id: string): Scenario | undefined;
}
