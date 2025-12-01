import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { createStateConditionEvaluator } from "../src/domain/state-condition-evaluator.js";
import type { StateCondition } from "../src/schemas/state-aware-mocking.js";

describe("StateConditionEvaluator", () => {
  /**
   * Core behavior: Evaluate conditions against current state
   * and return the matching condition (or undefined if none match).
   */
  describe("condition matching", () => {
    it("should return undefined when no conditions match the state", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { checked: true },
          then: { status: 200, body: { state: "reviewed" } },
        },
      ];
      const currentState = { checked: false };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeUndefined();
    });

    it("should return the matching condition when state matches", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { checked: true },
          then: { status: 200, body: { state: "reviewed" } },
        },
      ];
      const currentState = { checked: true };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toEqual({
        when: { checked: true },
        then: { status: 200, body: { state: "reviewed" } },
      });
    });

    it("should match when state has additional keys beyond what condition requires", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { checked: true },
          then: { status: 200, body: { state: "reviewed" } },
        },
      ];
      const currentState = { checked: true, userId: "user-123", extra: "data" };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result?.when).toEqual({ checked: true });
    });

    it("should not match when required key is missing from state", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { checked: true, approved: true },
          then: { status: 200, body: { state: "approved" } },
        },
      ];
      const currentState = { checked: true }; // missing 'approved'

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeUndefined();
    });

    it("should match with multiple keys in condition", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { checked: true, approved: true },
          then: { status: 200, body: { state: "approved" } },
        },
      ];
      const currentState = { checked: true, approved: true };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result?.when).toEqual({ checked: true, approved: true });
    });
  });

  /**
   * Specificity-based selection: Most specific matching condition wins.
   * Specificity = number of keys in 'when' clause.
   */
  describe("specificity-based selection", () => {
    it("should select more specific condition over less specific one", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { checked: true },
          then: { status: 200, body: { state: "reviewed" } },
        },
        {
          when: { checked: true, approved: true },
          then: { status: 200, body: { state: "approved" } },
        },
      ];
      const currentState = { checked: true, approved: true };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      // Should select { checked: true, approved: true } (2 keys) over { checked: true } (1 key)
      expect(result?.then.body).toEqual({ state: "approved" });
    });

    it("should select more specific condition regardless of order in array", () => {
      const evaluator = createStateConditionEvaluator();
      // Put more specific condition FIRST this time
      const conditions: StateCondition[] = [
        {
          when: { checked: true, approved: true },
          then: { status: 200, body: { state: "approved" } },
        },
        {
          when: { checked: true },
          then: { status: 200, body: { state: "reviewed" } },
        },
      ];
      const currentState = { checked: true, approved: true };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result?.then.body).toEqual({ state: "approved" });
    });

    it("should select first matching condition when equal specificity", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { foo: true },
          then: { status: 200, body: { winner: "first" } },
        },
        {
          when: { bar: true },
          then: { status: 200, body: { winner: "second" } },
        },
      ];
      const currentState = { foo: true, bar: true };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      // Both match with specificity 1, first one wins
      expect(result?.then.body).toEqual({ winner: "first" });
    });

    it("should return less specific match when more specific does not match", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { checked: true },
          then: { status: 200, body: { state: "reviewed" } },
        },
        {
          when: { checked: true, approved: true },
          then: { status: 200, body: { state: "approved" } },
        },
      ];
      const currentState = { checked: true }; // approved is not true

      const result = evaluator.findMatchingCondition(conditions, currentState);

      // Only { checked: true } matches
      expect(result?.then.body).toEqual({ state: "reviewed" });
    });
  });

  /**
   * Edge cases and value matching
   */
  describe("value matching", () => {
    it("should match string values exactly", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { step: "reviewed" },
          then: { status: 200, body: { state: "reviewed" } },
        },
      ];
      const currentState = { step: "reviewed" };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeDefined();
    });

    it("should not match when string values differ", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { step: "reviewed" },
          then: { status: 200, body: { state: "reviewed" } },
        },
      ];
      const currentState = { step: "pending" };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeUndefined();
    });

    it("should match numeric values exactly", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        { when: { count: 5 }, then: { status: 200, body: { count: 5 } } },
      ];
      const currentState = { count: 5 };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeDefined();
    });

    it("should not match when numeric values differ", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        { when: { count: 5 }, then: { status: 200, body: { count: 5 } } },
      ];
      const currentState = { count: 10 };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeUndefined();
    });

    it("should match null values", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { user: null },
          then: { status: 401, body: { error: "unauthorized" } },
        },
      ];
      const currentState = { user: null };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeDefined();
    });

    it("should match object values with deep equality", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { user: { name: "Alice", role: "admin" } },
          then: { status: 200, body: { admin: true } },
        },
      ];
      const currentState = { user: { name: "Alice", role: "admin" } };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeDefined();
    });

    it("should not match when object values differ", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { user: { name: "Alice", role: "admin" } },
          then: { status: 200, body: { admin: true } },
        },
      ];
      const currentState = { user: { name: "Alice", role: "user" } };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeUndefined();
    });

    it("should match array values with deep equality", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { roles: ["admin", "user"] },
          then: { status: 200, body: { hasRoles: true } },
        },
      ];
      const currentState = { roles: ["admin", "user"] };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeDefined();
    });
  });

  /**
   * Empty state and conditions
   */
  describe("empty cases", () => {
    it("should return undefined when conditions array is empty", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [];
      const currentState = { checked: true };

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeUndefined();
    });

    it("should return undefined when state is empty and no condition has empty when", () => {
      const evaluator = createStateConditionEvaluator();
      const conditions: StateCondition[] = [
        {
          when: { checked: true },
          then: { status: 200, body: { state: "reviewed" } },
        },
      ];
      const currentState = {};

      const result = evaluator.findMatchingCondition(conditions, currentState);

      expect(result).toBeUndefined();
    });
  });

  /**
   * Property-Based Tests
   *
   * These tests verify that invariant properties hold for all possible inputs,
   * not just example cases. Key properties:
   *
   * 1. Specificity invariant: Most specific matching condition always wins
   * 2. Matching correctness: Condition matches iff all keys match
   * 3. Order independence: Specificity takes precedence over array order
   */
  describe("property-based tests", () => {
    /**
     * Generates a random state object with primitive values.
     * Uses keys a-e to keep state manageable for testing.
     */
    const stateArb = fc.record({
      a: fc.oneof(fc.boolean(), fc.integer(), fc.string()),
      b: fc.oneof(fc.boolean(), fc.integer(), fc.string()),
      c: fc.oneof(fc.boolean(), fc.integer(), fc.string()),
      d: fc.oneof(fc.boolean(), fc.integer(), fc.string()),
      e: fc.oneof(fc.boolean(), fc.integer(), fc.string()),
    });

    /**
     * Generates a condition that will match a subset of the given state.
     * Returns the condition and the keys it uses for specificity calculation.
     */
    const conditionFromState = (
      state: Record<string, unknown>,
      keyCount: number,
    ) => {
      const keys = Object.keys(state).slice(0, keyCount);
      const when: Record<string, unknown> = {};
      for (const key of keys) {
        when[key] = state[key];
      }
      return {
        when,
        then: { status: 200, body: { keys: keyCount } },
      };
    };

    it("PROPERTY: Most specific matching condition always wins", () => {
      fc.assert(
        fc.property(stateArb, (state) => {
          const evaluator = createStateConditionEvaluator();

          // Create conditions with varying specificity (1, 2, 3, 4, 5 keys)
          // Shuffle to ensure order doesn't matter
          const conditions: StateCondition[] = fc.sample(
            fc.shuffledSubarray([
              conditionFromState(state, 1),
              conditionFromState(state, 2),
              conditionFromState(state, 3),
              conditionFromState(state, 4),
              conditionFromState(state, 5),
            ]),
            1,
          )[0] as StateCondition[];

          const result = evaluator.findMatchingCondition(conditions, state);

          if (result) {
            // The selected condition should be the most specific one
            const resultSpecificity = Object.keys(result.when).length;
            for (const cond of conditions) {
              const condSpecificity = Object.keys(cond.when).length;
              // No other matching condition should have higher specificity
              if (stateMatchesWhen(state, cond.when)) {
                expect(resultSpecificity).toBeGreaterThanOrEqual(
                  condSpecificity,
                );
              }
            }
          }

          return true;
        }),
        { numRuns: 500 },
      );
    });

    it("PROPERTY: Condition matches iff all keys in 'when' exist in state with equal values", () => {
      fc.assert(
        fc.property(
          stateArb,
          fc.integer({ min: 1, max: 5 }),
          (state, keyCount) => {
            const evaluator = createStateConditionEvaluator();
            const condition = conditionFromState(state, keyCount);
            const conditions: StateCondition[] = [condition];

            // With the exact state, condition should match
            const result1 = evaluator.findMatchingCondition(conditions, state);
            expect(result1).toBeDefined();

            // With a modified value, condition should NOT match
            const modifiedState = {
              ...state,
              a: "MODIFIED_VALUE_THAT_WONT_MATCH",
            };
            if (Object.keys(condition.when).includes("a")) {
              const result2 = evaluator.findMatchingCondition(
                conditions,
                modifiedState,
              );
              expect(result2).toBeUndefined();
            }

            return true;
          },
        ),
        { numRuns: 500 },
      );
    });

    it("PROPERTY: Empty conditions array always returns undefined", () => {
      fc.assert(
        fc.property(stateArb, (state) => {
          const evaluator = createStateConditionEvaluator();
          const result = evaluator.findMatchingCondition([], state);
          expect(result).toBeUndefined();
          return true;
        }),
        { numRuns: 100 },
      );
    });

    it("PROPERTY: Non-matching conditions always return undefined", () => {
      const nonMatchingCondition: StateCondition = {
        when: { nonExistentKey: "valueWontMatch" },
        then: { status: 404 },
      };

      fc.assert(
        fc.property(stateArb, (state) => {
          const evaluator = createStateConditionEvaluator();
          const result = evaluator.findMatchingCondition(
            [nonMatchingCondition],
            state,
          );
          expect(result).toBeUndefined();
          return true;
        }),
        { numRuns: 200 },
      );
    });

    it("PROPERTY: Result is always from the conditions array or undefined", () => {
      fc.assert(
        fc.property(
          stateArb,
          fc.array(fc.integer({ min: 1, max: 5 }), {
            minLength: 1,
            maxLength: 5,
          }),
          (state, keyCounts) => {
            const evaluator = createStateConditionEvaluator();
            const conditions = keyCounts.map((kc) =>
              conditionFromState(state, kc),
            );

            const result = evaluator.findMatchingCondition(conditions, state);

            // Result must either be undefined or one of the conditions
            if (result !== undefined) {
              const isFromConditions = conditions.some(
                (c) => JSON.stringify(c) === JSON.stringify(result),
              );
              expect(isFromConditions).toBe(true);
            }

            return true;
          },
        ),
        { numRuns: 300 },
      );
    });
  });
});

/**
 * Helper to check if a state matches a 'when' clause.
 */
const stateMatchesWhen = (
  state: Record<string, unknown>,
  when: Record<string, unknown>,
): boolean => {
  for (const [key, value] of Object.entries(when)) {
    if (!(key in state) || state[key] !== value) {
      return false;
    }
  }
  return true;
};
