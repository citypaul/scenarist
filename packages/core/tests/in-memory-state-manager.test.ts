import { describe, it, expect } from 'vitest';
import { createInMemoryStateManager } from '../src/adapters/in-memory-state-manager.js';

describe('InMemoryStateManager', () => {
  it('should store and retrieve state per test ID', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'userId', 'user-123');

    const result = stateManager.get('test-1', 'userId');
    expect(result).toBe('user-123');
  });

  it('should isolate state between different test IDs', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'count', 5);
    stateManager.set('test-2', 'count', 10);

    expect(stateManager.get('test-1', 'count')).toBe(5);
    expect(stateManager.get('test-2', 'count')).toBe(10);
  });

  it('should return undefined for missing keys', () => {
    const stateManager = createInMemoryStateManager();

    const result = stateManager.get('test-1', 'nonexistent');

    expect(result).toBeUndefined();
  });

  it('should return all state for a test ID', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'key1', 'value1');
    stateManager.set('test-1', 'key2', 'value2');

    const allState = stateManager.getAll('test-1');

    expect(allState).toEqual({ key1: 'value1', key2: 'value2' });
  });

  it('should reset all state for a test ID', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'key1', 'value1');
    stateManager.set('test-1', 'key2', 'value2');

    stateManager.reset('test-1');

    expect(stateManager.get('test-1', 'key1')).toBeUndefined();
    expect(stateManager.get('test-1', 'key2')).toBeUndefined();
  });

  it('should not affect other test IDs when resetting', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'key', 'value1');
    stateManager.set('test-2', 'key', 'value2');

    stateManager.reset('test-1');

    expect(stateManager.get('test-1', 'key')).toBeUndefined();
    expect(stateManager.get('test-2', 'key')).toBe('value2');
  });

  it('should handle nested paths with dot notation', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'user.profile.name', 'Alice');

    const result = stateManager.get('test-1', 'user.profile.name');
    expect(result).toBe('Alice');
  });

  it('should handle array append syntax', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'items[]', 'item1');
    stateManager.set('test-1', 'items[]', 'item2');
    stateManager.set('test-1', 'items[]', 'item3');

    const items = stateManager.get('test-1', 'items');
    expect(items).toEqual(['item1', 'item2', 'item3']);
  });

  it('should differentiate between array append and overwrite', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'count', 5);
    stateManager.set('test-1', 'count', 10);

    expect(stateManager.get('test-1', 'count')).toBe(10); // Overwrites

    stateManager.set('test-1', 'items[]', 'first');
    stateManager.set('test-1', 'items[]', 'second');

    expect(stateManager.get('test-1', 'items')).toEqual(['first', 'second']); // Appends
  });

  it('should return undefined when trying to get nested path through non-object', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'value', 'string');

    // Try to get nested path through a string value
    const result = stateManager.get('test-1', 'value.nested.field');

    expect(result).toBeUndefined();
  });

  it('should return undefined when trying to get nested path through array', () => {
    const stateManager = createInMemoryStateManager();

    stateManager.set('test-1', 'items', ['a', 'b', 'c']);

    // Try to get nested path through an array
    const result = stateManager.get('test-1', 'items.nested.field');

    expect(result).toBeUndefined();
  });

  it('should overwrite non-array value with new array when using append syntax', () => {
    const stateManager = createInMemoryStateManager();

    // First set a non-array value
    stateManager.set('test-1', 'items', 'not-an-array');

    // Now use append syntax - should overwrite with new array
    stateManager.set('test-1', 'items[]', 'first');

    expect(stateManager.get('test-1', 'items')).toEqual(['first']);

    // Subsequent appends should work normally
    stateManager.set('test-1', 'items[]', 'second');
    expect(stateManager.get('test-1', 'items')).toEqual(['first', 'second']);
  });

  it('should return empty object for getAll on non-existent test ID', () => {
    const stateManager = createInMemoryStateManager();

    const result = stateManager.getAll('non-existent-test');

    expect(result).toEqual({});
  });

  it('should overwrite array with object when setting nested path through it', () => {
    const stateManager = createInMemoryStateManager();

    // First set an array value
    stateManager.set('test-1', 'data', ['a', 'b', 'c']);

    // Now set a nested path - should overwrite array with object
    stateManager.set('test-1', 'data.field', 'value');

    const result = stateManager.get('test-1', 'data.field');
    expect(result).toBe('value');
  });
});

  it('should overwrite null value with object when setting nested path through it', () => {
    const stateManager = createInMemoryStateManager();

    // First set a null value
    stateManager.set('test-1', 'data', null);

    // Now set a nested path - should overwrite null with object
    stateManager.set('test-1', 'data.field', 'value');

    const result = stateManager.get('test-1', 'data.field');
    expect(result).toBe('value');
  });

  it('should preserve existing nested objects when setting deeper paths', () => {
    const stateManager = createInMemoryStateManager();

    // Create a nested structure
    stateManager.set('test-1', 'user.profile.name', 'Alice');
    stateManager.set('test-1', 'user.profile.age', 30);

    // Add another field to the existing nested object
    stateManager.set('test-1', 'user.profile.email', 'alice@example.com');

    // All fields should exist
    expect(stateManager.get('test-1', 'user.profile.name')).toBe('Alice');
    expect(stateManager.get('test-1', 'user.profile.age')).toBe(30);
    expect(stateManager.get('test-1', 'user.profile.email')).toBe('alice@example.com');
  });
