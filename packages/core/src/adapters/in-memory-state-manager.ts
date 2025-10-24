import type { StateManager } from '../ports/driven/state-manager.js';

/**
 * In-memory implementation of StateManager port.
 * Fast, single-process state storage for stateful mocks.
 */
export const createInMemoryStateManager = (): StateManager => {
  const storage = new Map<string, Record<string, unknown>>();

  const getOrCreateTestState = (testId: string): Record<string, unknown> => {
    let testState = storage.get(testId);
    if (!testState) {
      testState = {};
      storage.set(testId, testState);
    }
    return testState;
  };

  const setNestedValue = (obj: Record<string, unknown>, path: string[], value: unknown): void => {
    if (path.length === 1) {
      obj[path[0]!] = value;
      return;
    }

    const key = path[0]!;
    if (typeof obj[key] !== 'object' || obj[key] === null || Array.isArray(obj[key])) {
      obj[key] = {};
    }

    setNestedValue(obj[key] as Record<string, unknown>, path.slice(1), value);
  };

  const getNestedValue = (obj: Record<string, unknown>, path: string[]): unknown => {
    if (path.length === 1) {
      return obj[path[0]!];
    }

    const key = path[0]!;
    const nested = obj[key];
    if (typeof nested !== 'object' || nested === null || Array.isArray(nested)) {
      return undefined;
    }

    return getNestedValue(nested as Record<string, unknown>, path.slice(1));
  };

  return {
    get(testId: string, key: string): unknown {
      const testState = storage.get(testId);
      if (!testState) {
        return undefined;
      }

      const path = key.split('.');
      return getNestedValue(testState, path);
    },

    set(testId: string, key: string, value: unknown): void {
      const testState = getOrCreateTestState(testId);

      // Check for array append syntax (key ends with [])
      if (key.endsWith('[]')) {
        const actualKey = key.slice(0, -2); // Remove []
        const path = actualKey.split('.');

        // Get current value at path
        const currentValue = this.get(testId, actualKey);

        if (currentValue === undefined) {
          // Create new array
          setNestedValue(testState, path, [value]);
        } else if (Array.isArray(currentValue)) {
          // Append to existing array
          currentValue.push(value);
        } else {
          // Overwrite non-array with new array
          setNestedValue(testState, path, [value]);
        }
      } else {
        // Normal set (overwrite)
        const path = key.split('.');
        setNestedValue(testState, path, value);
      }
    },

    getAll(testId: string): Record<string, unknown> {
      return storage.get(testId) ?? {};
    },

    reset(testId: string): void {
      storage.delete(testId);
    },
  };
};
