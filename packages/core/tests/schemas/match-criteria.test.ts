import { describe, it, expect } from 'vitest';
import { SerializedRegexSchema } from '../../src/schemas/match-criteria.js';

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
describe('SerializedRegexSchema (documentation only)', () => {
  it('should accept safe regex patterns', () => {
    const safeData = {
      source: '/apply-sign|/penny-drop',
      flags: 'i',
    };

    const result = SerializedRegexSchema.safeParse(safeData);

    expect(result.success).toBe(true);
  });

  it('should reject unsafe ReDoS patterns', () => {
    const unsafeData = {
      source: '(a+)+b', // Classic ReDoS pattern
    };

    const result = SerializedRegexSchema.safeParse(unsafeData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('unsafe');
    }
  });

  it('should reject invalid flag characters', () => {
    const invalidFlagsData = {
      source: 'test',
      flags: 'x', // Invalid flag
    };

    const result = SerializedRegexSchema.safeParse(invalidFlagsData);

    expect(result.success).toBe(false);
  });
});
