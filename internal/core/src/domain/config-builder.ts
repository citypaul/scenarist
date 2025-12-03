import type {
  ScenaristConfig,
  ScenaristConfigInput,
  ScenaristScenarios,
  ErrorBehaviors,
} from "../types/index.js";
import { ScenariosObjectSchema } from "../schemas/index.js";

/**
 * Default error behaviors - strict by default.
 * All errors throw to ensure tests fail clearly when something goes wrong.
 */
const DEFAULT_ERROR_BEHAVIORS: ErrorBehaviors = {
  onNoMockFound: "throw",
  onSequenceExhausted: "throw",
  onNoStateMatch: "throw",
  onMissingTestId: "throw",
};

/**
 * Build a complete config from partial user input.
 * Applies sensible defaults for missing values.
 *
 * **Validation:** Ensures scenarios object has a 'default' key.
 */
export const buildConfig = <T extends ScenaristScenarios>(
  input: ScenaristConfigInput<T>,
): ScenaristConfig => {
  // Validate scenarios object has 'default' key (trust boundary)
  ScenariosObjectSchema.parse(input.scenarios);

  return {
    enabled: input.enabled,
    strictMode: input.strictMode ?? false,
    endpoints: {
      setScenario: input.endpoints?.setScenario ?? "/__scenario__",
      getScenario: input.endpoints?.getScenario ?? "/__scenario__",
    },
    defaultTestId: input.defaultTestId ?? "default-test",
    errorBehaviors: {
      ...DEFAULT_ERROR_BEHAVIORS,
      ...input.errorBehaviors,
    },
  };
};
