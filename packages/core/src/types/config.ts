import type { ScenaristScenarios } from './scenario.js';

/**
 * Configuration for the scenario management system.
 * All properties are readonly for immutability.
 */
export type ScenaristConfig = {
  /**
   * Whether mocking is enabled.
   * For dynamic enabling (e.g., based on environment), evaluate before creating config:
   * `enabled: process.env.NODE_ENV !== 'production'`
   */
  readonly enabled: boolean;

  /**
   * Whether to enforce strict mode for unmocked requests.
   *
   * - `true`: Unmocked requests return error responses (501 Not Implemented)
   * - `false`: Unmocked requests passthrough to real APIs
   *
   * Default: false
   *
   * Strict mode is useful in tests to ensure all external API calls are explicitly mocked,
   * preventing accidental calls to real services.
   */
  readonly strictMode: boolean;

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
   * The default test ID to use when no x-scenarist-test-id header is present.
   */
  readonly defaultTestId: string;
};

/**
 * Partial config for user input - missing values will use defaults.
 * All properties must be serializable (no functions).
 */
export type ScenaristConfigInput<T extends ScenaristScenarios = ScenaristScenarios> = {
  readonly enabled: boolean;
  readonly strictMode?: boolean;
  readonly endpoints?: Partial<ScenaristConfig['endpoints']>;
  /**
   * All scenarios defined as a named object.
   * Keys become scenario IDs that enable type-safe autocomplete.
   *
   * **REQUIRED:** Must include a 'default' key to serve as the baseline scenario.
   *
   * @example
   * ```typescript
   * const scenarios = {
   *   default: { id: 'default', ... },      // Required!
   *   cartWithState: { id: 'cartWithState', ... },
   *   premiumUser: { id: 'premiumUser', ... },
   * } as const satisfies ScenaristScenarios;
   *
   * createScenarist({
   *   enabled: true,
   *   scenarios,
   * });
   * ```
   */
  readonly scenarios: T;
  readonly defaultTestId?: string;
};
