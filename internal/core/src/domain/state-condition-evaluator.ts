import type { StateCondition } from "../schemas/state-aware-mocking.js";
import { deepEquals } from "./deep-equals.js";

/**
 * StateConditionEvaluator port for evaluating stateResponse conditions.
 *
 * Evaluates conditions against current test state using:
 * - Partial matching: condition keys must exist in state with matching values
 * - Specificity-based selection: most specific matching condition wins
 * - Deep equality: objects/arrays compared structurally
 */
export type StateConditionEvaluator = {
  /**
   * Find the matching condition based on current state.
   *
   * Applies specificity-based selection:
   * - More specific conditions (more keys) take precedence
   * - On equal specificity, first matching condition wins
   *
   * @param conditions - Array of conditions to evaluate
   * @param currentState - Current test state to match against
   * @returns Matching condition or undefined if no match
   */
  findMatchingCondition(
    conditions: ReadonlyArray<StateCondition>,
    currentState: Readonly<Record<string, unknown>>,
  ): StateCondition | undefined;
};

/**
 * Factory function for creating StateConditionEvaluator.
 */
export const createStateConditionEvaluator = (): StateConditionEvaluator => {
  return {
    findMatchingCondition(
      conditions: ReadonlyArray<StateCondition>,
      currentState: Readonly<Record<string, unknown>>,
    ): StateCondition | undefined {
      let bestMatch: StateCondition | undefined;
      let bestSpecificity = -1;

      for (const condition of conditions) {
        const matches = stateMatchesCondition(currentState, condition.when);

        if (!matches) {
          continue;
        }

        const specificity = Object.keys(condition.when).length;

        // Keep if more specific than current best
        if (specificity > bestSpecificity) {
          bestMatch = condition;
          bestSpecificity = specificity;
        }
      }

      return bestMatch;
    },
  };
};

/**
 * Check if current state matches a condition's 'when' clause.
 * All keys in the condition must exist in state with matching values.
 */
const stateMatchesCondition = (
  state: Readonly<Record<string, unknown>>,
  when: Readonly<Record<string, unknown>>,
): boolean => {
  for (const [key, expectedValue] of Object.entries(when)) {
    if (!(key in state)) {
      return false;
    }

    const actualValue = state[key];

    if (!deepEquals(actualValue, expectedValue)) {
      return false;
    }
  }

  return true;
};
