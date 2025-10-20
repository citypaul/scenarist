import type { HttpHandler } from 'msw';

/**
 * A scenario represents a complete mock state for testing.
 * Scenarios are immutable data structures.
 */
export type Scenario<TVariant extends string = string, TValue = unknown> = {
  readonly name: string;
  readonly description: string;
  readonly mocks: ReadonlyArray<HttpHandler>;
  readonly devToolEnabled: boolean;
  readonly variants?: Readonly<Record<TVariant, ScenarioVariant<TValue>>>;
};

/**
 * A variant allows parameterization of scenarios.
 * Use variants when you need the same scenario with different data.
 */
export type ScenarioVariant<T = unknown> = {
  readonly name: string;
  readonly description: string;
  readonly value: () => T;
};

/**
 * Represents an active scenario for a specific test ID.
 */
export type ActiveScenario = {
  readonly scenarioId: string;
  readonly scenario: Scenario;
  readonly variant?: {
    readonly name: string;
    readonly meta?: unknown;
  };
};

/**
 * Result type for operations that can fail.
 * Prefer this over throwing exceptions for expected error cases.
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
