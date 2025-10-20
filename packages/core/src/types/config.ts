/**
 * Configuration for the scenario management system.
 * All properties are readonly for immutability.
 */
export type ScenaristConfig = {
  /**
   * Whether mocking is enabled. Can be a boolean or function.
   * Function allows for dynamic enabling (e.g., based on environment).
   */
  readonly enabled: boolean | (() => boolean);

  /**
   * HTTP header names for test isolation and control.
   */
  readonly headers: {
    /** Header name for test ID (default: 'x-test-id') */
    readonly testId: string;
    /** Header name to enable/disable mocks (default: 'x-mock-enabled') */
    readonly mockEnabled: string;
  };

  /**
   * HTTP endpoint paths for scenario control.
   */
  readonly endpoints: {
    /** Endpoint to set/switch scenarios (default: '/__scenario__') */
    readonly setScenario: string;
    /** Endpoint to get current scenario (default: '/__scenario__') */
    readonly getScenario: string;
  };

  /**
   * The default scenario ID to use when none is specified.
   */
  readonly defaultScenario: string;

  /**
   * The default test ID to use when no x-test-id header is present.
   */
  readonly defaultTestId: string;
};

/**
 * Partial config for user input - missing values will use defaults.
 */
export type ScenaristConfigInput = {
  readonly enabled: boolean | (() => boolean);
  readonly headers?: Partial<ScenaristConfig['headers']>;
  readonly endpoints?: Partial<ScenaristConfig['endpoints']>;
  readonly defaultScenario?: string;
  readonly defaultTestId?: string;
};
