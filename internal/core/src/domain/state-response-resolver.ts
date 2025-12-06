import type {
  StatefulMockResponse,
  StateCondition,
} from "../schemas/state-aware-mocking.js";
import type { ScenaristResponse } from "../schemas/scenario-definition.js";
import { createStateConditionEvaluator } from "./state-condition-evaluator.js";
import type { StateConditionEvaluator } from "./state-condition-evaluator.js";

/**
 * Result of resolving a stateResponse configuration.
 *
 * Contains both the resolved response and the matched condition (if any).
 * This enables callers to determine which afterResponse to apply.
 */
export type StateResponseResult = {
  readonly response: ScenaristResponse;
  readonly matchedCondition: StateCondition | null;
};

/**
 * StateResponseResolver port for resolving stateResponse configurations.
 *
 * Resolves which response to return based on current test state:
 * - Evaluates conditions using StateConditionEvaluator
 * - Returns matching condition's response or default
 */
export type StateResponseResolver = {
  /**
   * Resolve the response from a stateResponse configuration.
   *
   * @param stateResponse - The stateResponse configuration
   * @param currentState - Current test state
   * @returns The resolved response (matching condition or default)
   * @deprecated Use resolveResponseWithCondition for condition-level afterResponse support
   */
  resolveResponse(
    stateResponse: StatefulMockResponse,
    currentState: Readonly<Record<string, unknown>>,
  ): ScenaristResponse;

  /**
   * Resolve the response from a stateResponse configuration with matched condition.
   *
   * Returns both the response and the matched condition, enabling callers
   * to determine which afterResponse to apply (condition-level or mock-level).
   *
   * @param stateResponse - The stateResponse configuration
   * @param currentState - Current test state
   * @returns Result with response and matched condition (null if default was used)
   */
  resolveResponseWithCondition(
    stateResponse: StatefulMockResponse,
    currentState: Readonly<Record<string, unknown>>,
  ): StateResponseResult;
};

/**
 * Options for creating a StateResponseResolver.
 */
type CreateStateResponseResolverOptions = {
  /**
   * Optional custom evaluator for testing.
   * If not provided, creates a default evaluator.
   */
  evaluator?: StateConditionEvaluator;
};

/**
 * Factory function for creating StateResponseResolver.
 */
export const createStateResponseResolver = (
  options: CreateStateResponseResolverOptions = {},
): StateResponseResolver => {
  const evaluator = options.evaluator ?? createStateConditionEvaluator();

  return {
    resolveResponse(
      stateResponse: StatefulMockResponse,
      currentState: Readonly<Record<string, unknown>>,
    ): ScenaristResponse {
      const result = this.resolveResponseWithCondition(
        stateResponse,
        currentState,
      );
      return result.response;
    },

    resolveResponseWithCondition(
      stateResponse: StatefulMockResponse,
      currentState: Readonly<Record<string, unknown>>,
    ): StateResponseResult {
      const matchingCondition = evaluator.findMatchingCondition(
        stateResponse.conditions,
        currentState,
      );

      if (matchingCondition) {
        return {
          response: matchingCondition.then,
          matchedCondition: matchingCondition,
        };
      }

      return {
        response: stateResponse.default,
        matchedCondition: null,
      };
    },
  };
};
