import { describe, it, expect } from 'vitest';
import { InMemoryScenarioRegistry } from '../src/adapters/in-memory-registry.js';
import type { ScenarioDefinition } from '../src/types/index.js';

const createTestScenarioDefinition = (
  id: string,
  name: string = 'Test Scenario',
): ScenarioDefinition => ({
  id,
  name,
  description: `Description for ${name}`,
  devToolEnabled: false,
  mocks: [
    {
      method: 'GET',
      url: 'https://api.example.com/test',
      response: {
        status: 200,
        body: { message: 'mocked' },
      },
    },
  ],
});

describe('InMemoryScenarioRegistry', () => {
  describe('register', () => {
    it('should register a new scenario definition', () => {
      const registry = new InMemoryScenarioRegistry();
      const definition = createTestScenarioDefinition('test-1', 'Test 1');

      registry.register(definition);

      expect(registry.has('test-1')).toBe(true);
      expect(registry.get('test-1')).toEqual(definition);
    });

    it('should overwrite existing scenario with same ID', () => {
      const registry = new InMemoryScenarioRegistry();
      const definition1 = createTestScenarioDefinition('test', 'First');
      const definition2 = createTestScenarioDefinition('test', 'Second');

      registry.register(definition1);
      registry.register(definition2);

      const retrieved = registry.get('test');
      expect(retrieved?.name).toBe('Second');
    });
  });

  describe('get', () => {
    it('should retrieve registered scenario by ID', () => {
      const registry = new InMemoryScenarioRegistry();
      const definition = createTestScenarioDefinition('test', 'Test');
      registry.register(definition);

      const retrieved = registry.get('test');

      expect(retrieved).toEqual(definition);
    });

    it('should return undefined for non-existent scenario', () => {
      const registry = new InMemoryScenarioRegistry();

      const retrieved = registry.get('non-existent');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered scenario', () => {
      const registry = new InMemoryScenarioRegistry();
      const definition = createTestScenarioDefinition('test', 'Test');
      registry.register(definition);

      expect(registry.has('test')).toBe(true);
    });

    it('should return false for non-existent scenario', () => {
      const registry = new InMemoryScenarioRegistry();

      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('list', () => {
    it('should list all registered scenarios', () => {
      const registry = new InMemoryScenarioRegistry();
      const def1 = createTestScenarioDefinition('scenario-1', 'Scenario 1');
      const def2 = createTestScenarioDefinition('scenario-2', 'Scenario 2');

      registry.register(def1);
      registry.register(def2);

      const scenarios = registry.list();

      expect(scenarios).toHaveLength(2);
      expect(scenarios).toContainEqual(def1);
      expect(scenarios).toContainEqual(def2);
    });

    it('should return empty array when no scenarios registered', () => {
      const registry = new InMemoryScenarioRegistry();

      const scenarios = registry.list();

      expect(scenarios).toEqual([]);
    });

    it('should return immutable array', () => {
      const registry = new InMemoryScenarioRegistry();
      const definition = createTestScenarioDefinition('test', 'Test');
      registry.register(definition);

      const scenarios = registry.list();

      expect(Object.isFrozen(scenarios)).toBe(false);
      expect(Array.isArray(scenarios)).toBe(true);
    });
  });

  describe('unregister', () => {
    it('should remove scenario from registry', () => {
      const registry = new InMemoryScenarioRegistry();
      const definition = createTestScenarioDefinition('test', 'Test');
      registry.register(definition);

      registry.unregister('test');

      expect(registry.has('test')).toBe(false);
      expect(registry.get('test')).toBeUndefined();
    });

    it('should not throw when unregistering non-existent scenario', () => {
      const registry = new InMemoryScenarioRegistry();

      expect(() => registry.unregister('non-existent')).not.toThrow();
    });

    it('should not affect other registered scenarios', () => {
      const registry = new InMemoryScenarioRegistry();
      const def1 = createTestScenarioDefinition('test-1', 'Test 1');
      const def2 = createTestScenarioDefinition('test-2', 'Test 2');

      registry.register(def1);
      registry.register(def2);

      registry.unregister('test-1');

      expect(registry.has('test-1')).toBe(false);
      expect(registry.has('test-2')).toBe(true);
    });
  });
});
