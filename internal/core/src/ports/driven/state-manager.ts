/**
 * StateManager port for managing runtime state in stateful mocks (Phase 3).
 *
 * Implementations store state per test ID, enabling:
 * - Capturing values from requests
 * - Injecting state into responses via templates
 * - State isolation between concurrent tests
 *
 * State values MUST be JSON-serializable to support distributed implementations:
 * - ✅ Primitives: string, number, boolean, null
 * - ✅ Objects and arrays (plain data)
 * - ❌ Functions, classes, symbols, undefined, circular references
 *
 * This enables multiple implementations:
 * - InMemoryStateManager (default): Fast, single-process
 * - RedisStateManager (future): Distributed testing
 * - FileSystemStateManager (future): Persistent state
 */
export interface StateManager {
  /**
   * Get a state value for a specific test ID.
   *
   * @param testId - Test identifier for state isolation
   * @param key - State key (can be nested path like 'user.profile.name')
   * @returns Value from state, or undefined if not found
   */
  get(testId: string, key: string): unknown;

  /**
   * Set a state value for a specific test ID.
   *
   * @param testId - Test identifier for state isolation
   * @param key - State key (supports nested paths)
   * @param value - Value to store (must be JSON-serializable)
   */
  set(testId: string, key: string, value: unknown): void;

  /**
   * Get all state for a specific test ID.
   *
   * @param testId - Test identifier
   * @returns Complete state object for this test ID
   */
  getAll(testId: string): Record<string, unknown>;

  /**
   * Reset all state for a specific test ID.
   *
   * Called automatically by ScenarioManager when switching scenarios to prevent
   * state pollution between scenarios. Tests may also call this manually to reset
   * state mid-test.
   *
   * Note: New test IDs start with empty state automatically (no reset needed).
   *
   * @param testId - Test identifier
   */
  reset(testId: string): void;

  /**
   * Merge partial state into existing state for a test ID (ADR-0019).
   *
   * Performs a shallow merge: `{ ...currentState, ...partial }`.
   * Used by afterResponse.setState to update test state after mock responses.
   *
   * @param testId - Test identifier for state isolation
   * @param partial - Partial state to merge into existing state
   */
  merge(testId: string, partial: Record<string, unknown>): void;
}
