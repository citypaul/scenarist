import type {
  SequenceTracker,
  SequencePosition,
} from '../ports/driven/sequence-tracker.js';

/**
 * In-memory implementation of SequenceTracker.
 *
 * Tracks sequence positions using a Map in memory.
 * Suitable for single-process testing scenarios.
 *
 * For distributed testing across multiple processes, use a Redis-based
 * implementation instead.
 */
export class InMemorySequenceTracker implements SequenceTracker {
  private readonly positions: Map<string, SequencePosition>;

  constructor() {
    this.positions = new Map();
  }

  /**
   * Generate key for tracking sequence position.
   * Format: `${testId}:${scenarioId}:${mockIndex}`
   */
  private getKey(testId: string, scenarioId: string, mockIndex: number): string {
    return `${testId}:${scenarioId}:${mockIndex}`;
  }

  getPosition(
    testId: string,
    scenarioId: string,
    mockIndex: number
  ): SequencePosition {
    const key = this.getKey(testId, scenarioId, mockIndex);
    const existing = this.positions.get(key);

    // If no position exists yet, start at 0
    if (!existing) {
      return { position: 0, exhausted: false };
    }

    return existing;
  }

  advance(
    testId: string,
    scenarioId: string,
    mockIndex: number,
    totalResponses: number,
    repeatMode: 'last' | 'cycle' | 'none'
  ): void {
    const key = this.getKey(testId, scenarioId, mockIndex);
    const current = this.getPosition(testId, scenarioId, mockIndex);

    const nextPosition = current.position + 1;

    // Handle different repeat modes
    if (nextPosition >= totalResponses) {
      switch (repeatMode) {
        case 'last':
          // Stay at last position (don't increment beyond last)
          this.positions.set(key, {
            position: totalResponses - 1,
            exhausted: false,
          });
          break;

        case 'cycle':
          // Wrap back to first position
          this.positions.set(key, {
            position: 0,
            exhausted: false,
          });
          break;

        case 'none':
          // Mark as exhausted
          this.positions.set(key, {
            position: totalResponses,
            exhausted: true,
          });
          break;
      }
    } else {
      // Normal advancement (not at end yet)
      this.positions.set(key, {
        position: nextPosition,
        exhausted: false,
      });
    }
  }

  reset(testId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.positions.keys()) {
      if (key.startsWith(`${testId}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.positions.delete(key);
    }
  }
}

/**
 * Create an in-memory sequence tracker.
 * Factory function following the pattern established for other domain services.
 */
export const createInMemorySequenceTracker = (): SequenceTracker => {
  return new InMemorySequenceTracker();
};
