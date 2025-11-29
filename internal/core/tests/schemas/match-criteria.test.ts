import { describe, it, expect } from "vitest";
import { SerializedRegexSchema } from "../../src/schemas/match-criteria.js";
import { MatchValueSchema } from "../../src/schemas/scenario-definition.js";

/**
 * MINIMAL SCHEMA DOCUMENTATION TESTS
 *
 * These tests document the schema's validation rules but do NOT comprehensively
 * test validation behavior. For comprehensive validation testing, see:
 * - tests/scenario-manager.test.ts (behavior tests through ScenarioManager)
 *
 * Why minimal? Per CLAUDE.md testing guidelines:
 * - Test behavior, not implementation details
 * - Zod schema validation is an implementation detail
 * - Keep 2-3 tests as documentation only
 */
describe("SerializedRegexSchema (documentation only)", () => {
  it("should accept safe regex patterns", () => {
    const safeData = {
      source: "/apply-sign|/penny-drop",
      flags: "i",
    };

    const result = SerializedRegexSchema.safeParse(safeData);

    expect(result.success).toBe(true);
  });

  it("should reject unsafe ReDoS patterns", () => {
    const unsafeData = {
      source: "(a+)+b", // Classic ReDoS pattern
    };

    const result = SerializedRegexSchema.safeParse(unsafeData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("unsafe");
    }
  });

  it("should reject invalid flag characters", () => {
    const invalidFlagsData = {
      source: "test",
      flags: "x", // Invalid flag
    };

    const result = SerializedRegexSchema.safeParse(invalidFlagsData);

    expect(result.success).toBe(false);
  });
});

describe("MatchValueSchema (documentation only)", () => {
  it("should accept plain string values", () => {
    const result = MatchValueSchema.safeParse("exact-value");
    expect(result.success).toBe(true);
  });

  it("should accept strategy objects with exactly one strategy", () => {
    const containsResult = MatchValueSchema.safeParse({
      contains: "substring",
    });
    expect(containsResult.success).toBe(true);

    const startsWithResult = MatchValueSchema.safeParse({
      startsWith: "prefix",
    });
    expect(startsWithResult.success).toBe(true);

    const endsWithResult = MatchValueSchema.safeParse({ endsWith: "suffix" });
    expect(endsWithResult.success).toBe(true);

    const equalsResult = MatchValueSchema.safeParse({ equals: "exact" });
    expect(equalsResult.success).toBe(true);
  });

  it("should reject empty strategy objects (no strategy defined)", () => {
    const emptyObject = {};

    const result = MatchValueSchema.safeParse(emptyObject);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        "Exactly one matching strategy must be defined",
      );
    }
  });

  it("should reject strategy objects with multiple strategies", () => {
    const multipleStrategies = {
      contains: "substring",
      startsWith: "prefix", // Second strategy - should fail
    };

    const result = MatchValueSchema.safeParse(multipleStrategies);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        "Exactly one matching strategy must be defined",
      );
    }
  });
});
