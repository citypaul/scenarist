import type { ActiveScenario } from '../../types/index.js';

/**
 * Secondary port for scenario storage.
 * Implementations determine where active scenarios are stored.
 *
 * Examples:
 * - InMemoryScenarioStore: Map-based storage (single process)
 * - RedisScenarioStore: Redis-based storage (distributed tests)
 */
export interface ScenarioStore {
  /**
   * Store an active scenario for a test ID.
   */
  set(testId: string, scenario: ActiveScenario): void;

  /**
   * Retrieve an active scenario for a test ID.
   */
  get(testId: string): ActiveScenario | undefined;

  /**
   * Check if a test ID has an active scenario.
   */
  has(testId: string): boolean;

  /**
   * Remove the active scenario for a test ID.
   */
  delete(testId: string): void;

  /**
   * Clear all active scenarios.
   * Use with caution - affects all test IDs.
   */
  clear(): void;
}
