import type {
  ScenarioManager,
  ScenarioRegistry,
  ScenarioStore,
  SequenceTracker,
  StateManager,
  Logger,
} from "../ports/index.js";
import { noOpLogger } from "../adapters/index.js";
import type {
  ActiveScenario,
  ScenaristResult,
  ScenaristScenario,
} from "../types/index.js";
import { ScenaristScenarioSchema } from "../schemas/index.js";
import { ScenaristError, ErrorCodes } from "../types/errors.js";
import { LogCategories, LogEvents } from "./log-events.js";

const createDuplicateScenarioError = (scenarioId: string): ScenaristError => {
  return new ScenaristError(
    `Scenario '${scenarioId}' is already registered. Each scenario must have a unique ID.`,
    {
      code: ErrorCodes.DUPLICATE_SCENARIO,
      context: {
        scenarioId,
        hint: "Use a different scenario ID, or remove the existing scenario before registering a new one.",
      },
    },
  );
};

const createScenarioValidationError = (
  scenarioId: string,
  validationErrors: string[],
): ScenaristError => {
  return new ScenaristError(
    `Invalid scenario definition for '${scenarioId}': ${validationErrors.join(", ")}`,
    {
      code: ErrorCodes.VALIDATION_ERROR,
      context: {
        scenarioId,
        hint: `Check your scenario definition. Validation errors: ${validationErrors.join("; ")}`,
      },
    },
  );
};

/**
 * Factory function to create a ScenarioManager implementation.
 *
 * Follows dependency injection principle - all ports are injected, never created internally.
 *
 * This enables:
 * - Any registry implementation (in-memory, Redis, files, remote)
 * - Any store implementation (in-memory, Redis, database)
 * - Any state manager implementation (in-memory, Redis, database)
 * - Any logger implementation (console, file, remote)
 * - Proper testing with mock dependencies
 * - True hexagonal architecture
 */
export const createScenarioManager = ({
  registry,
  store,
  stateManager,
  sequenceTracker,
  logger = noOpLogger,
}: {
  registry: ScenarioRegistry;
  store: ScenarioStore;
  stateManager?: StateManager;
  sequenceTracker?: SequenceTracker;
  logger?: Logger;
}): ScenarioManager => {
  return {
    registerScenario(definition: ScenaristScenario): void {
      // Validate scenario definition at trust boundary
      const validationResult = ScenaristScenarioSchema.safeParse(definition);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        );
        const scenarioId = (definition as { id?: string })?.id || "<unknown>";
        throw createScenarioValidationError(scenarioId, errorMessages);
      }

      const existing = registry.get(definition.id);

      // Allow re-registering the exact same scenario object (idempotent)
      if (existing === definition) {
        return;
      }

      // Prevent registering a different scenario with the same ID
      if (existing) {
        throw createDuplicateScenarioError(definition.id);
      }

      registry.register(definition);

      logger.debug(
        LogCategories.SCENARIO,
        LogEvents.SCENARIO_REGISTERED,
        {},
        {
          scenarioId: definition.id,
          mockCount: definition.mocks.length, // mocks is required by ScenaristScenarioSchema
        },
      );
    },

    switchScenario(
      testId: string,
      scenarioId: string,
    ): ScenaristResult<void, Error> {
      const definition = registry.get(scenarioId);

      if (!definition) {
        logger.error(
          LogCategories.SCENARIO,
          LogEvents.SCENARIO_NOT_FOUND,
          { testId },
          {
            requestedScenarioId: scenarioId,
          },
        );

        return {
          success: false,
          error: new ScenaristError(
            `Scenario '${scenarioId}' not found. Did you forget to register it?`,
            {
              code: ErrorCodes.SCENARIO_NOT_FOUND,
              context: {
                testId,
                scenarioId,
                hint: "Make sure to register the scenario before switching to it. Use manager.registerScenario(definition) first.",
              },
            },
          ),
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

      logger.info(
        LogCategories.SCENARIO,
        LogEvents.SCENARIO_SWITCHED,
        { testId, scenarioId },
        {},
      );

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

      logger.debug(
        LogCategories.SCENARIO,
        LogEvents.SCENARIO_CLEARED,
        { testId },
        {},
      );
    },

    getScenarioById(id: string): ScenaristScenario | undefined {
      return registry.get(id);
    },
  };
};
