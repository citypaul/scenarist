/**
 * Sequence position state for a specific mock.
 */
export type SequencePosition = {
  readonly position: number; // Current position in the sequence (0-indexed)
  readonly exhausted: boolean; // True if repeat: 'none' and past end
};

/**
 * Secondary port for sequence position tracking.
 *
 * Tracks which response in a sequence should be returned next for each
 * (testId + scenarioId + mockIndex) combination.
 *
 * This port enables:
 * - Default implementation: In-memory tracking (Map-based)
 * - Redis implementation: Distributed testing across processes
 * - File-based implementation: Persistent state across restarts
 * - Test doubles: Mock sequence tracking for adapter tests
 */
export interface SequenceTracker {
  /**
   * Get the current sequence position for a specific mock.
   *
   * @param testId - Test ID for isolation
   * @param scenarioId - Scenario ID
   * @param mockIndex - Index of the mock in the scenario's mocks array
   * @returns Current position (0-indexed) and exhaustion status
   */
  getPosition(
    testId: string,
    scenarioId: string,
    mockIndex: number,
  ): SequencePosition;

  /**
   * Advance the sequence position for a specific mock.
   *
   * @param testId - Test ID for isolation
   * @param scenarioId - Scenario ID
   * @param mockIndex - Index of the mock in the scenario's mocks array
   * @param totalResponses - Total number of responses in the sequence
   * @param repeatMode - Repeat behavior ('last' | 'cycle' | 'none')
   */
  advance(
    testId: string,
    scenarioId: string,
    mockIndex: number,
    totalResponses: number,
    repeatMode: "last" | "cycle" | "none",
  ): void;

  /**
   * Reset all sequence positions for a specific test ID.
   *
   * Called when switching scenarios to ensure sequences start fresh.
   *
   * @param testId - Test ID to reset
   */
  reset(testId: string): void;
}
