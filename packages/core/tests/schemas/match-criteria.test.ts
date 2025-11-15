import { describe, it, expect } from 'vitest';
import { SerializedRegexSchema, type SerializedRegex } from '../../src/schemas/match-criteria.js';

describe('SerializedRegexSchema', () => {
  describe('Valid patterns', () => {
    it('should accept regex with source only', () => {
      const data = {
        source: '/api/products',
      };

      const result = SerializedRegexSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('/api/products');
        expect(result.data.flags).toBeUndefined();
      }
    });

    it('should accept regex with source and flags', () => {
      const data = {
        source: '/api/products',
        flags: 'i',
      };

      const result = SerializedRegexSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('/api/products');
        expect(result.data.flags).toBe('i');
      }
    });

    it('should accept all valid flag combinations', () => {
      const validFlags = ['g', 'i', 'm', 's', 'u', 'v', 'y', 'gi', 'gim', 'gimsuvy'];

      validFlags.forEach((flags) => {
        const data = { source: 'test', flags };
        const result = SerializedRegexSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should accept safe regex patterns', () => {
      const safePatterns = [
        '^/api/products$',
        '/apply-sign|/penny-drop',
        '\\d{3,4}',
        '[A-Z]{1,2}\\d[A-Z\\d]?',
      ];

      safePatterns.forEach((source) => {
        const data = { source };
        const result = SerializedRegexSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Invalid patterns', () => {
    it('should reject empty source string', () => {
      const data = {
        source: '',
      };

      const result = SerializedRegexSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject unsafe ReDoS pattern', () => {
      const data = {
        source: '(a+)+b', // Classic ReDoS pattern
      };

      const result = SerializedRegexSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('unsafe');
      }
    });

    it('should reject another ReDoS pattern', () => {
      const data = {
        source: '(x+x+)+y', // Exponential backtracking
      };

      const result = SerializedRegexSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject invalid flag characters', () => {
      const data = {
        source: 'test',
        flags: 'x', // Invalid flag
      };

      const result = SerializedRegexSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject flags with invalid characters mixed in', () => {
      const data = {
        source: 'test',
        flags: 'gix', // 'x' is invalid
      };

      const result = SerializedRegexSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('Type inference', () => {
    it('should infer correct TypeScript type', () => {
      const regex: SerializedRegex = {
        source: '/api/test',
        flags: 'gi',
      };

      expect(regex.source).toBe('/api/test');
      expect(regex.flags).toBe('gi');
    });
  });
});
