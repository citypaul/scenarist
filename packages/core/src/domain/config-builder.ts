import type { ScenaristConfig, ScenaristConfigInput, ScenariosObject } from '../types/index.js';

/**
 * Build a complete config from partial user input.
 * Applies sensible defaults for missing values.
 */
export const buildConfig = <T extends ScenariosObject>(
  input: ScenaristConfigInput<T>
): ScenaristConfig => {
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
    defaultScenarioId: input.defaultScenarioId,
    defaultTestId: input.defaultTestId ?? 'default-test',
  };
};
