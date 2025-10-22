import type { ScenarioDefinition } from '@scenarist/core';
import type { Test } from 'supertest';

/**
 * Configuration for the Scenarist test client
 */
export type ScenaristTestClientConfig = {
  /**
   * The endpoint for scenario operations (default: '/__scenario__')
   */
  readonly scenarioEndpoint?: string;

  /**
   * The header name for test ID (default: 'x-test-id')
   */
  readonly testIdHeader?: string;
};

/**
 * Type-safe test client for Scenarist scenario management
 *
 * Provides autocomplete and type checking for scenario IDs based on
 * the scenarios registered with the client.
 *
 * @example
 * ```typescript
 * const scenarios = {
 *   success: successScenario,
 *   error: errorScenario,
 * } as const;
 *
 * const client = createScenaristTestClient(request(app), scenarios);
 *
 * // Type-safe with autocomplete!
 * await client.switchTo('success');
 * await client.switchTo('error', 'test-123');
 *
 * // TypeScript error:
 * await client.switchTo('typo'); // ❌
 * ```
 */
export type ScenaristTestClient<T extends Record<string, ScenarioDefinition>> = {
  /**
   * Switch to a specific scenario
   *
   * @param key - The scenario key (fully typed based on registered scenarios)
   * @param testId - Optional test ID for test isolation
   * @returns Supertest Test instance for chaining assertions
   *
   * @example
   * ```typescript
   * await client.switchTo('success');
   * await client.switchTo('error', 'test-123');
   * ```
   */
  readonly switchTo: (key: keyof T, testId?: string) => Test;

  /**
   * Get the currently active scenario
   *
   * @param testId - Optional test ID for test isolation
   * @returns Supertest Test instance for chaining assertions
   *
   * @example
   * ```typescript
   * const response = await client.getCurrent();
   * expect(response.body.scenarioId).toBe('success');
   * ```
   */
  readonly getCurrent: (testId?: string) => Test;

  /**
   * Access to the scenarios registry for getting IDs or definitions
   *
   * @example
   * ```typescript
   * const successId = client.scenarios.success.id;
   * ```
   */
  readonly scenarios: T;
};

/**
 * Creates a type-safe test client for Scenarist scenario management
 *
 * The client provides autocomplete and type checking for scenario IDs,
 * making it impossible to reference non-existent scenarios.
 *
 * @param requestBuilder - A function that returns a supertest request instance
 * @param scenarios - An object mapping keys to ScenarioDefinition objects
 * @param config - Optional configuration
 * @returns A type-safe test client
 *
 * @example
 * ```typescript
 * import request from 'supertest';
 * import { createScenaristTestClient } from '@scenarist/testing-helpers';
 *
 * const scenarios = {
 *   success: successScenario,
 *   githubNotFound: githubNotFoundScenario,
 *   weatherError: weatherErrorScenario,
 * } as const;
 *
 * const client = createScenaristTestClient(
 *   () => request(app),
 *   scenarios
 * );
 *
 * // Fully typed - autocomplete works!
 * await client.switchTo('success');
 * await client.switchTo('githubNotFound', 'test-123');
 *
 * // Get current scenario
 * const response = await client.getCurrent('test-123');
 * expect(response.body.scenarioId).toBe('githubNotFound');
 * ```
 */
export const createScenaristTestClient = <
  T extends Record<string, ScenarioDefinition>,
>(
  requestBuilder: () => {
    post: (url: string) => Test;
    get: (url: string) => Test;
  },
  scenarios: T,
  config?: ScenaristTestClientConfig
): ScenaristTestClient<T> => {
  const scenarioEndpoint = config?.scenarioEndpoint ?? '/__scenario__';
  const testIdHeader = config?.testIdHeader ?? 'x-test-id';

  return {
    switchTo: (key: keyof T, testId?: string) => {
      const scenario = scenarios[key];
      if (!scenario) {
        throw new Error(`Scenario '${String(key)}' not found in registry`);
      }

      const request = requestBuilder()
        .post(scenarioEndpoint)
        .send({ scenario: scenario.id });

      if (testId) {
        request.set(testIdHeader, testId);
      }

      return request;
    },

    getCurrent: (testId?: string) => {
      const request = requestBuilder().get(scenarioEndpoint);

      if (testId) {
        request.set(testIdHeader, testId);
      }

      return request;
    },

    scenarios,
  };
};
