import type { ScenarioStore } from "../ports/index.js";
import type { ActiveScenario } from "../types/index.js";

/**
 * In-memory implementation of ScenarioStore using a Map.
 * Suitable for single-process testing.
 *
 * For distributed testing across multiple processes,
 * consider implementing a Redis-based store.
 */
export class InMemoryScenarioStore implements ScenarioStore {
  private readonly store = new Map<string, ActiveScenario>();

  set(testId: string, scenario: ActiveScenario): void {
    this.store.set(testId, scenario);
  }

  get(testId: string): ActiveScenario | undefined {
    return this.store.get(testId);
  }

  has(testId: string): boolean {
    return this.store.has(testId);
  }

  delete(testId: string): void {
    this.store.delete(testId);
  }

  clear(): void {
    this.store.clear();
  }
}
