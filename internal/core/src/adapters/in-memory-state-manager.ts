import type { StateManager } from "../ports/driven/state-manager.js";

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const isDangerousKey = (key: string): boolean => DANGEROUS_KEYS.has(key);

/**
 * Type guard to check if a value is a plain object (Record).
 * Used to properly narrow types after typeof checks.
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

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

    const path = key.split(".");
    return this.getNestedValue(testState, path);
  }

  set(testId: string, key: string, value: unknown): void {
    const testState = this.getOrCreateTestState(testId);

    // Guard: Normal set (no array syntax)
    if (!key.endsWith("[]")) {
      const path = key.split(".");
      this.setNestedValue(testState, path, value);
      return;
    }

    // Array append syntax
    const actualKey = key.slice(0, -2);
    const path = actualKey.split(".");
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

  merge(testId: string, partial: Record<string, unknown>): void {
    const currentState = this.getOrCreateTestState(testId);

    // Filter out dangerous keys and shallow merge
    for (const [key, value] of Object.entries(partial)) {
      if (!isDangerousKey(key)) {
        Object.defineProperty(currentState, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  private getOrCreateTestState(testId: string): Record<string, unknown> {
    let testState = this.storage.get(testId);
    if (!testState) {
      testState = {};
      this.storage.set(testId, testState);
    }
    return testState;
  }

  private setNestedValue(
    obj: Record<string, unknown>,
    path: string[],
    value: unknown,
  ): void {
    const key = path[0]!;

    // Guard: Prevent prototype pollution attacks
    if (isDangerousKey(key)) {
      return;
    }

    if (path.length === 1) {
      Object.defineProperty(obj, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      return;
    }

    // Get or create nested object for this path segment
    // eslint-disable-next-line security/detect-object-injection -- Guarded by isDangerousKey and Object.hasOwn
    const existingValue = Object.hasOwn(obj, key) ? obj[key] : undefined;

    // Determine target: use existing record OR create new empty object
    const target: Record<string, unknown> = isRecord(existingValue)
      ? existingValue
      : {};

    // If we created a new object, assign it to the parent
    if (!isRecord(existingValue)) {
      Object.defineProperty(obj, key, {
        value: target,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    // Recurse to next path segment
    this.setNestedValue(target, path.slice(1), value);
  }

  private getNestedValue(
    obj: Record<string, unknown>,
    path: readonly string[],
  ): unknown {
    const key = path[0]!;

    // Guard: Prevent prototype pollution attacks
    if (isDangerousKey(key)) {
      return undefined;
    }

    // Guard: Only access own properties, not inherited ones
    if (!Object.hasOwn(obj, key)) {
      return undefined;
    }

    // eslint-disable-next-line security/detect-object-injection -- Guarded by isDangerousKey and Object.hasOwn
    const value = obj[key];

    if (path.length === 1) {
      return value;
    }

    // Use type guard for proper type narrowing instead of assertion
    if (!isRecord(value)) {
      return undefined;
    }

    return this.getNestedValue(value, path.slice(1));
  }
}

/**
 * Factory function for creating InMemoryStateManager instances.
 * Consistent with existing adapter factory pattern.
 */
export const createInMemoryStateManager = (): StateManager => {
  return new InMemoryStateManager();
};
