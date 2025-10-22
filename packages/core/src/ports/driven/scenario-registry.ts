import type { ScenarioDefinition } from '../../types/index.js';

/**
 * Secondary port for scenario registry.
 * Manages the catalog of available scenarios.
 *
 * This is separate from ScenarioStore to maintain architectural purity:
 * - ScenarioRegistry: what scenarios exist (the catalog)
 * - ScenarioStore: which scenario each test is using (active state)
 *
 * ScenarioDefinitions are serializable, enabling:
 * - InMemoryScenarioRegistry: Map-based registry (default, fastest)
 * - RedisScenarioRegistry: Distributed scenarios across processes
 * - FileSystemScenarioRegistry: Load scenarios from JSON/YAML files
 * - RemoteScenarioRegistry: Fetch scenarios from REST API
 * - DatabaseScenarioRegistry: Store scenarios in PostgreSQL/MongoDB
 *
 * At runtime, MockDefinitions are converted to MSW HttpHandlers.
 */
export interface ScenarioRegistry {
  /**
   * Register a scenario definition.
   * The definition.id is used as the unique identifier.
   * Makes the scenario available for use.
   */
  register(definition: ScenarioDefinition): void;

  /**
   * Retrieve a registered scenario definition by ID.
   * Returns undefined if scenario not found.
   */
  get(id: string): ScenarioDefinition | undefined;

  /**
   * Check if a scenario ID is registered.
   */
  has(id: string): boolean;

  /**
   * List all registered scenario definitions.
   * Useful for debugging, dev tools, and scenario discovery.
   */
  list(): ReadonlyArray<ScenarioDefinition>;

  /**
   * Remove a scenario from the registry.
   * Does not affect already-active scenarios in the store.
   */
  unregister(id: string): void;
}
