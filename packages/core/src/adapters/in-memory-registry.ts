import type { ScenarioRegistry } from '../ports/index.js';
import type { ScenaristScenario } from '../types/index.js';

/**
 * In-memory implementation of ScenarioRegistry using a Map.
 * Suitable for single-process testing and development.
 *
 * For distributed testing across multiple processes,
 * consider implementing a Redis-based or database-backed registry.
 */
export class InMemoryScenarioRegistry implements ScenarioRegistry {
  private readonly registry = new Map<string, ScenaristScenario>();

  register(definition: ScenaristScenario): void {
    this.registry.set(definition.id, definition);
  }

  get(id: string): ScenaristScenario | undefined {
    return this.registry.get(id);
  }

  has(id: string): boolean {
    return this.registry.has(id);
  }

  list(): ReadonlyArray<ScenaristScenario> {
    return Array.from(this.registry.values());
  }

  unregister(id: string): void {
    this.registry.delete(id);
  }
}
