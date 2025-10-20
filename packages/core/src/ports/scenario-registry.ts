import type { Scenario } from '../types/index.js';

/**
 * Secondary port for scenario registry.
 * Manages the catalog of available scenarios.
 *
 * This is separate from ScenarioStore to maintain architectural purity:
 * - ScenarioRegistry: what scenarios exist (the catalog)
 * - ScenarioStore: which scenario each test is using (active state)
 *
 * Examples:
 * - InMemoryScenarioRegistry: Map-based registry (default)
 * - FileSystemScenarioRegistry: Load scenarios from files
 * - RemoteScenarioRegistry: Fetch scenarios from API
 */
export interface ScenarioRegistry {
  /**
   * Register a scenario with a unique ID.
   * Makes the scenario available for use.
   */
  register(id: string, scenario: Scenario): void;

  /**
   * Retrieve a registered scenario by ID.
   * Returns undefined if scenario not found.
   */
  get(id: string): Scenario | undefined;

  /**
   * Check if a scenario ID is registered.
   */
  has(id: string): boolean;

  /**
   * List all registered scenarios.
   * Useful for debugging, dev tools, and scenario discovery.
   */
  list(): ReadonlyArray<{ id: string; scenario: Scenario }>;

  /**
   * Remove a scenario from the registry.
   * Does not affect already-active scenarios in the store.
   */
  unregister(id: string): void;
}
