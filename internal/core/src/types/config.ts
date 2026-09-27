import type { ScenaristScenarios } from "./scenario.js";

/**
 * How errors should be handled when they occur.
 *
 * - `throw`: Respond 500 with the ScenaristError code and message
 * - `warn`: Log at warn level via the configured logger, then let strictMode decide
 * - `ignore`: Let strictMode decide silently (default)
 */
export type ErrorBehavior = "throw" | "warn" | "ignore";

/**
 * Configuration for how different error types should be handled.
 * Default is 'ignore' for all, so strictMode alone decides unmatched requests.
 */
export type ErrorBehaviors = {
  /** How to handle when no mock matches a request. Default: 'ignore' */
  readonly onNoMockFound: ErrorBehavior;
  /** How to handle when a sequence is exhausted. Default: 'ignore' */
  readonly onSequenceExhausted: ErrorBehavior;
  /**
   * How to handle when no test ID can be resolved for a request. Default: 'ignore'
   *
   * Adapters fall back to `defaultTestId` when the header is absent, so this
   * only applies when `defaultTestId` is set to `''`.
   */
  readonly onMissingTestId: ErrorBehavior;
};

/**
 * Configuration for the scenario management system.
 * All properties are readonly for immutability.
 */
export type ScenaristConfig = {
  /**
   * Whether mocking is enabled.
   * When false, adapters' `createScenarist()` returns `undefined`: no scenario
   * endpoints are mounted and no requests are intercepted.
   * For dynamic enabling (e.g., based on environment), evaluate before creating config:
   * `enabled: process.env.NODE_ENV === 'test'`
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
    /** Endpoint to get current test state for debugging (default: '/__scenarist__/state') */
    readonly getState: string;
  };

  /**
   * The default test ID to use when no x-scenarist-test-id header is present.
   */
  readonly defaultTestId: string;

  /**
   * How different error types should be handled.
   * Default is 'ignore' for all (strictMode decides unmatched requests).
   */
  readonly errorBehaviors: ErrorBehaviors;
};

/**
 * Partial config for user input - missing values will use defaults.
 * All properties must be serializable (no functions).
 */
export type ScenaristConfigInput<
  T extends ScenaristScenarios = ScenaristScenarios,
> = {
  readonly enabled: boolean;
  readonly strictMode?: boolean;
  readonly endpoints?: Partial<ScenaristConfig["endpoints"]>;
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
  /**
   * Optional error behavior overrides. Missing values use 'ignore' as default.
   */
  readonly errorBehaviors?: Partial<ErrorBehaviors>;
};
