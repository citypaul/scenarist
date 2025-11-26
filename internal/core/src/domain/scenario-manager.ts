import type {
  ScenarioManager,
  ScenarioRegistry,
  ScenarioStore,
  SequenceTracker,
  StateManager,
} from "../ports/index.js";
import type {
  ActiveScenario,
  ScenaristResult,
  ScenaristScenario,
} from "../types/index.js";
import { ScenaristScenarioSchema } from "../schemas/index.js";

class ScenarioNotFoundError extends Error {
  constructor(scenarioId: string) {
    super(`Scenario '${scenarioId}' not found. Did you forget to register it?`);
    this.name = "ScenarioNotFoundError";
  }
}

class DuplicateScenarioError extends Error {
  constructor(scenarioId: string) {
    super(`Scenario '${scenarioId}' is already registered. Each scenario must have a unique ID.`);
    this.name = "DuplicateScenarioError";
  }
}

class ScenarioValidationError extends Error {
  constructor(message: string, public readonly validationErrors: string[]) {
    super(message);
    this.name = "ScenarioValidationError";
  }
}

/**
 * Factory function to create a ScenarioManager implementation.
 *
 * Follows dependency injection principle - all ports are injected, never created internally.
 *
 * This enables:
 * - Any registry implementation (in-memory, Redis, files, remote)
 * - Any store implementation (in-memory, Redis, database)
 * - Any state manager implementation (in-memory, Redis, database)
 * - Proper testing with mock dependencies
 * - True hexagonal architecture
 */
export const createScenarioManager = ({
  registry,
  store,
  stateManager,
  sequenceTracker,
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
  stateManager?: StateManager;
  sequenceTracker?: SequenceTracker;
}): ScenarioManager => {
  return {
    registerScenario(definition: ScenaristScenario): void {
      // Validate scenario definition at trust boundary
      const validationResult = ScenaristScenarioSchema.safeParse(definition);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        );
        const scenarioId = (definition as any)?.id || '<unknown>';
        throw new ScenarioValidationError(
          `Invalid scenario definition for '${scenarioId}': ${errorMessages.join(', ')}`,
          errorMessages
        );
      }

      const existing = registry.get(definition.id);

      // Allow re-registering the exact same scenario object (idempotent)
      if (existing === definition) {
        return;
      }

      // Prevent registering a different scenario with the same ID
      if (existing) {
        throw new DuplicateScenarioError(definition.id);
      }

      registry.register(definition);
    },

    switchScenario(
      testId: string,
      scenarioId: string
    ): ScenaristResult<void, Error> {
      const definition = registry.get(scenarioId);

      if (!definition) {
        return {
          success: false,
          error: new ScenarioNotFoundError(scenarioId),
        };
      }

      const activeScenario: ActiveScenario = {
        scenarioId,
      };

      store.set(testId, activeScenario);

      // Phase 2: Reset sequence positions on scenario switch (clean slate)
      if (sequenceTracker) {
        sequenceTracker.reset(testId);
      }

      // Phase 3: Reset state on scenario switch (clean slate)
      if (stateManager) {
        stateManager.reset(testId);
      }

      return { success: true, data: undefined };
    },

    getActiveScenario(testId: string): ActiveScenario | undefined {
      return store.get(testId);
    },

    listScenarios(): ReadonlyArray<ScenaristScenario> {
      return registry.list();
    },

    clearScenario(testId: string): void {
      store.delete(testId);
    },

    getScenarioById(id: string): ScenaristScenario | undefined {
      return registry.get(id);
    },
  };
};
