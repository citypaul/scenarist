import type { StateManager } from '../ports/driven/state-manager.js';

/**
 * In-memory implementation of StateManager port.
 * Fast, single-process state storage for stateful mocks.
 *
 * For distributed testing across multiple processes,
 * consider implementing a Redis-based or database-backed state manager.
 */
export class InMemoryStateManager implements StateManager {
  private readonly storage = new Map<string, Record<string, unknown>>();

  get(testId: string, key: string): unknown {
    const testState = this.storage.get(testId);
    if (!testState) {
      return undefined;
    }

    const path = key.split('.');
    return this.getNestedValue(testState, path);
  }

  set(testId: string, key: string, value: unknown): void {
    const testState = this.getOrCreateTestState(testId);

    // Guard: Normal set (no array syntax)
    if (!key.endsWith('[]')) {
      const path = key.split('.');
      this.setNestedValue(testState, path, value);
      return;
    }

    // Array append syntax
    const actualKey = key.slice(0, -2);
    const path = actualKey.split('.');
    const currentValue = this.get(testId, actualKey);

    // Guard: If current value is already an array, append immutably
    if (Array.isArray(currentValue)) {
      this.setNestedValue(testState, path, [...currentValue, value]);
      return;
    }

    // Create new array (either undefined or non-array value)
    this.setNestedValue(testState, path, [value]);
  }

  getAll(testId: string): Record<string, unknown> {
    return this.storage.get(testId) ?? {};
  }

  reset(testId: string): void {
    this.storage.delete(testId);
  }

  private getOrCreateTestState(testId: string): Record<string, unknown> {
    let testState = this.storage.get(testId);
    if (!testState) {
      testState = {};
      this.storage.set(testId, testState);
    }
    return testState;
  }

  private setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
    const key = path[0]!;

    // Guard: Prevent prototype pollution attacks
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return;
    }

    if (path.length === 1) {
      obj[key] = value;
      return;
    }

    if (typeof obj[key] !== 'object' || obj[key] === null || Array.isArray(obj[key])) {
      obj[key] = {};
    }

    this.setNestedValue(obj[key] as Record<string, unknown>, path.slice(1), value);
  }

  private getNestedValue(obj: Record<string, unknown>, path: readonly string[]): unknown {
    const key = path[0]!;

    // Guard: Prevent prototype pollution attacks
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }

    if (path.length === 1) {
      return obj[key];
    }

    const nested = obj[key];
    if (typeof nested !== 'object' || nested === null || Array.isArray(nested)) {
      return undefined;
    }

    return this.getNestedValue(nested as Record<string, unknown>, path.slice(1));
  }
}

/**
 * Factory function for creating InMemoryStateManager instances.
 * Consistent with existing adapter factory pattern.
 */
export const createInMemoryStateManager = (): StateManager => {
  return new InMemoryStateManager();
};
