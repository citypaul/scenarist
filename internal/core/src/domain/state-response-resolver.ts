import type { StatefulMockResponse } from "../schemas/state-aware-mocking.js";
import type { ScenaristResponse } from "../schemas/scenario-definition.js";
import { createStateConditionEvaluator } from "./state-condition-evaluator.js";
import type { StateConditionEvaluator } from "./state-condition-evaluator.js";

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
   */
  resolveResponse(
    stateResponse: StatefulMockResponse,
    currentState: Readonly<Record<string, unknown>>,
  ): ScenaristResponse;
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
      const matchingCondition = evaluator.findMatchingCondition(
        stateResponse.conditions,
        currentState,
      );

      if (matchingCondition) {
        return matchingCondition.then;
      }

      return stateResponse.default;
    },
  };
};
