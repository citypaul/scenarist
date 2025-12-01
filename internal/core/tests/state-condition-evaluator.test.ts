import { describe, it, expect } from "vitest";
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
});
