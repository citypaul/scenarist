import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { deepEquals } from "../src/domain/deep-equals.js";

/**
 * Deep Equals Utility Tests
 *
 * Tests the shared deep equality comparison function used for
 * state matching in both StateConditionEvaluator and ResponseSelector.
 */
describe("deepEquals", () => {
  describe("primitive values", () => {
    it("should return true for identical primitives", () => {
      expect(deepEquals(1, 1)).toBe(true);
      expect(deepEquals("test", "test")).toBe(true);
      expect(deepEquals(true, true)).toBe(true);
      expect(deepEquals(false, false)).toBe(true);
    });

    it("should return false for different primitives of same type", () => {
      expect(deepEquals(1, 2)).toBe(false);
      expect(deepEquals("a", "b")).toBe(false);
      expect(deepEquals(true, false)).toBe(false);
    });

    it("should return false for different types", () => {
      expect(deepEquals(1, "1")).toBe(false);
      expect(deepEquals(true, 1)).toBe(false);
      expect(deepEquals("true", true)).toBe(false);
    });
  });

  describe("null and undefined", () => {
    it("should return true for null === null", () => {
      expect(deepEquals(null, null)).toBe(true);
    });

    it("should return false for null vs non-null", () => {
      expect(deepEquals(null, {})).toBe(false);
      expect(deepEquals({}, null)).toBe(false);
      expect(deepEquals(null, [])).toBe(false);
      expect(deepEquals(null, "null")).toBe(false);
    });

    it("should return false for undefined vs defined", () => {
      expect(deepEquals(undefined, null)).toBe(false);
      expect(deepEquals(undefined, {})).toBe(false);
    });
  });

  describe("arrays", () => {
    it("should return true for identical arrays", () => {
      expect(deepEquals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEquals(["a", "b"], ["a", "b"])).toBe(true);
      expect(deepEquals([], [])).toBe(true);
    });

    it("should return false for arrays with different lengths", () => {
      expect(deepEquals([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEquals([1, 2, 3], [1, 2])).toBe(false);
      expect(deepEquals([], [1])).toBe(false);
    });

    it("should return false for arrays with same length but different elements", () => {
      expect(deepEquals([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEquals(["a", "b"], ["a", "c"])).toBe(false);
      expect(deepEquals([true], [false])).toBe(false);
    });

    it("should compare nested arrays deeply", () => {
      expect(
        deepEquals(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 4],
          ],
        ),
      ).toBe(true);
      expect(
        deepEquals(
          [
            [1, 2],
            [3, 4],
          ],
          [
            [1, 2],
            [3, 5],
          ],
        ),
      ).toBe(false);
    });

    it("should return false when comparing array to non-array", () => {
      expect(deepEquals([1, 2], { 0: 1, 1: 2 })).toBe(false);
      expect(deepEquals({ 0: 1, 1: 2 }, [1, 2])).toBe(false);
    });
  });

  describe("objects", () => {
    it("should return true for identical objects", () => {
      expect(deepEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(deepEquals({}, {})).toBe(true);
    });

    it("should return false for objects with different key counts", () => {
      expect(deepEquals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEquals({ a: 1, b: 2 }, { a: 1 })).toBe(false);
      expect(deepEquals({}, { a: 1 })).toBe(false);
    });

    it("should return false for objects with missing keys", () => {
      expect(deepEquals({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
      expect(deepEquals({ x: 1 }, { y: 1 })).toBe(false);
    });

    it("should return false for objects with same keys but different values", () => {
      expect(deepEquals({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEquals({ a: "x" }, { a: "y" })).toBe(false);
    });

    it("should compare nested objects deeply", () => {
      expect(
        deepEquals(
          { user: { name: "Alice", role: "admin" } },
          { user: { name: "Alice", role: "admin" } },
        ),
      ).toBe(true);
      expect(
        deepEquals(
          { user: { name: "Alice", role: "admin" } },
          { user: { name: "Alice", role: "user" } },
        ),
      ).toBe(false);
    });

    it("should handle objects with array values", () => {
      expect(deepEquals({ items: [1, 2, 3] }, { items: [1, 2, 3] })).toBe(true);
      expect(deepEquals({ items: [1, 2, 3] }, { items: [1, 2] })).toBe(false);
    });
  });

  describe("mixed nested structures", () => {
    it("should compare complex nested structures", () => {
      const a = {
        users: [
          { name: "Alice", roles: ["admin", "user"] },
          { name: "Bob", roles: ["user"] },
        ],
        metadata: { version: 1, active: true },
      };

      const b = {
        users: [
          { name: "Alice", roles: ["admin", "user"] },
          { name: "Bob", roles: ["user"] },
        ],
        metadata: { version: 1, active: true },
      };

      expect(deepEquals(a, b)).toBe(true);
    });

    it("should detect differences in deeply nested structures", () => {
      const a = {
        users: [{ roles: ["admin", "user"] }],
      };

      const b = {
        users: [{ roles: ["admin"] }], // Missing "user" role
      };

      expect(deepEquals(a, b)).toBe(false);
    });
  });

  /**
   * Property-Based Tests
   *
   * Property-based testing verifies that mathematical invariants hold for ALL
   * possible inputs, not just hand-picked examples. The test framework (fast-check)
   * generates hundreds of random inputs and checks that the property holds for each.
   *
   * This is particularly valuable for deepEquals because equality comparison
   * has well-defined mathematical properties that must hold universally:
   *
   * 1. Reflexivity: Every value equals itself
   * 2. Symmetry: If a equals b, then b equals a
   * 3. JSON consistency: Structurally identical JSON values are equal
   *
   * Property-based tests can discover edge cases that example-based tests miss,
   * such as unusual Unicode strings, deeply nested structures, or boundary values.
   */
  describe("property-based tests", () => {
    /**
     * Arbitrary for generating JSON-like values (primitives, arrays, objects).
     * Limits depth to avoid stack overflow and keep tests fast.
     */
    const jsonValueArb: fc.Arbitrary<unknown> = fc.letrec((tie) => ({
      value: fc.oneof(
        { depthIdentifier: "json" },
        fc.constant(null),
        fc.boolean(),
        fc.integer(),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        fc.string(),
        fc.array(tie("value") as fc.Arbitrary<unknown>, { maxLength: 5 }),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          tie("value") as fc.Arbitrary<unknown>,
          { maxKeys: 5 },
        ),
      ),
    })).value;

    it("PROPERTY: Reflexivity - every value equals itself", () => {
      fc.assert(
        fc.property(jsonValueArb, (value) => {
          expect(deepEquals(value, value)).toBe(true);
        }),
        { numRuns: 500 },
      );
    });

    it("PROPERTY: Symmetry - equality is symmetric", () => {
      fc.assert(
        fc.property(jsonValueArb, jsonValueArb, (a, b) => {
          const aEqualsB = deepEquals(a, b);
          const bEqualsA = deepEquals(b, a);
          expect(aEqualsB).toBe(bEqualsA);
        }),
        { numRuns: 500 },
      );
    });

    it("PROPERTY: JSON-equivalent values are equal", () => {
      fc.assert(
        fc.property(jsonValueArb, (value) => {
          // Round-trip through JSON creates a structurally identical copy
          const serialized = JSON.stringify(value);
          const deserialized = JSON.parse(serialized) as unknown;

          expect(deepEquals(value, deserialized)).toBe(true);
        }),
        { numRuns: 500 },
      );
    });

    it("PROPERTY: Different JSON strings imply unequal values", () => {
      fc.assert(
        fc.property(jsonValueArb, jsonValueArb, (a, b) => {
          const jsonA = JSON.stringify(a);
          const jsonB = JSON.stringify(b);

          // If JSON representations differ, values must be unequal
          if (jsonA !== jsonB) {
            expect(deepEquals(a, b)).toBe(false);
          }
        }),
        { numRuns: 500 },
      );
    });

    it("PROPERTY: Cloned objects are equal", () => {
      fc.assert(
        fc.property(jsonValueArb, (value) => {
          // Deep clone via JSON round-trip
          const clone = JSON.parse(JSON.stringify(value)) as unknown;
          expect(deepEquals(value, clone)).toBe(true);
        }),
        { numRuns: 300 },
      );
    });
  });
});
