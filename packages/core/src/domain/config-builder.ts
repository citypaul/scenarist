import type { ScenaristConfig, ScenaristConfigInput, ScenariosObject } from '../types/index.js';
import { ScenariosObjectSchema } from '../schemas/index.js';

/**
 * Build a complete config from partial user input.
 * Applies sensible defaults for missing values.
 *
 * **Validation:** Ensures scenarios object has a 'default' key.
 */
export const buildConfig = <T extends ScenariosObject>(
  input: ScenaristConfigInput<T>
): ScenaristConfig => {
  // Validate scenarios object has 'default' key (trust boundary)
  ScenariosObjectSchema.parse(input.scenarios);

  return {
    enabled: input.enabled,
    strictMode: input.strictMode ?? false,
    headers: {
      testId: input.headers?.testId ?? 'x-test-id',
    },
    endpoints: {
      setScenario: input.endpoints?.setScenario ?? '/__scenario__',
      getScenario: input.endpoints?.getScenario ?? '/__scenario__',
    },
    defaultTestId: input.defaultTestId ?? 'default-test',
  };
};
