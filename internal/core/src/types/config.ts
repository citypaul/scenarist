import type { ScenaristScenarios } from "./scenario.js";

/**
 * How errors should be handled when they occur.
 *
 * - `throw`: Throw ScenaristError (strict - test fails with clear message)
 * - `warn`: Log at warn level, return undefined (let strictMode decide next step)
 * - `ignore`: Return undefined silently (let strictMode decide next step)
 */
export type ErrorBehavior = "throw" | "warn" | "ignore";

/**
 * Configuration for how different error types should be handled.
 * Default is 'throw' for all (strict by default).
 */
export type ErrorBehaviors = {
  /** How to handle when no mock matches a request. Default: 'throw' */
  readonly onNoMockFound: ErrorBehavior;
  /** How to handle when a sequence is exhausted. Default: 'throw' */
  readonly onSequenceExhausted: ErrorBehavior;
  /** How to handle when x-scenarist-test-id header is missing. Default: 'throw' */
  readonly onMissingTestId: ErrorBehavior;
};

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
    /** Endpoint to get current test state for debugging (default: '/__scenarist__/state') */
    readonly getState: string;
  };

  /**
   * The default test ID to use when no x-scenarist-test-id header is present.
   */
  readonly defaultTestId: string;

  /**
   * How different error types should be handled.
   * Default is 'throw' for all (strict by default).
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
   * Optional error behavior overrides. Missing values use 'throw' as default.
   */
  readonly errorBehaviors?: Partial<ErrorBehaviors>;
};
