import type { ScenaristConfig, ScenaristConfigInput } from '../types/index.js';

/**
 * Build a complete config from partial user input.
 * Applies sensible defaults for missing values.
 */
export const buildConfig = (input: ScenaristConfigInput): ScenaristConfig => {
  return {
    enabled: input.enabled,
    headers: {
      testId: input.headers?.testId ?? 'x-test-id',
      mockEnabled: input.headers?.mockEnabled ?? 'x-mock-enabled',
    },
    endpoints: {
      setScenario: input.endpoints?.setScenario ?? '/__scenario__',
      getScenario: input.endpoints?.getScenario ?? '/__scenario__',
    },
    defaultScenario: input.defaultScenario ?? 'default',
    defaultTestId: input.defaultTestId ?? 'default-test',
  };
};
