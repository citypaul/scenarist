import type {
  ScenarioManager,
  ScenarioRegistry,
  ScenarioStore,
} from '../ports/index.js';
import type {
  ScenarioDefinition,
  ActiveScenario,
  Result,
} from '../types/index.js';

class ScenarioNotFoundError extends Error {
  constructor(scenarioId: string) {
    super(`Scenario '${scenarioId}' not found. Did you forget to register it?`);
    this.name = 'ScenarioNotFoundError';
  }
}

/**
 * Factory function to create a ScenarioManager implementation.
 *
 * Follows dependency injection principle - both ScenarioRegistry and
 * ScenarioStore are injected, never created internally.
 *
 * This enables:
 * - Any registry implementation (in-memory, Redis, files, remote)
 * - Any store implementation (in-memory, Redis, database)
 * - Proper testing with mock dependencies
 * - True hexagonal architecture
 */
export const createScenarioManager = ({
  registry,
  store,
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
}): ScenarioManager => {
  return {
    registerScenario(definition: ScenarioDefinition): void {
      registry.register(definition);
    },

    switchScenario(
      testId: string,
      scenarioId: string,
      variantName?: string,
    ): Result<void, Error> {
      const definition = registry.get(scenarioId);

      if (!definition) {
        return {
          success: false,
          error: new ScenarioNotFoundError(scenarioId),
        };
      }

      const activeScenario: ActiveScenario = {
        scenarioId,
        variantName,
      };

      store.set(testId, activeScenario);

      return { success: true, data: undefined };
    },

    getActiveScenario(testId: string): ActiveScenario | undefined {
      return store.get(testId);
    },

    listScenarios(): ReadonlyArray<ScenarioDefinition> {
      return registry.list();
    },

    clearScenario(testId: string): void {
      store.delete(testId);
    },

    getScenarioById(id: string): ScenarioDefinition | undefined {
      return registry.get(id);
    },
  };
};
