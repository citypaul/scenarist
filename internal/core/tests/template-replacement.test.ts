import { describe, it, expect } from 'vitest';
import { applyTemplates } from '../src/domain/template-replacement.js';

describe('Template Replacement', () => {
  it('should replace simple state template in string', () => {
    const value = 'User ID: {{state.userId}}';
    const state = { userId: 'user-123' };

    const result = applyTemplates(value, state);

    expect(result).toBe('User ID: user-123');
  });

  it('should replace multiple templates in one string', () => {
    const value = 'User {{state.userId}} has {{state.itemCount}} items';
    const state = { userId: 'user-123', itemCount: 5 };

    const result = applyTemplates(value, state);

    expect(result).toBe('User user-123 has 5 items');
  });

  it('should leave template unchanged when state key is missing', () => {
    const value = 'User ID: {{state.userId}}';
    const state = {};

    const result = applyTemplates(value, state);

    expect(result).toBe('User ID: {{state.userId}}');
  });

  it('should return non-string values unchanged', () => {
    const value = 12345;
    const state = { userId: 'user-123' };

    const result = applyTemplates(value, state);

    expect(result).toBe(12345);
  });

  it('should replace templates in object values', () => {
    const value = {
      message: 'Hello {{state.userName}}',
      id: '{{state.userId}}',
    };
    const state = { userName: 'Alice', userId: 'user-123' };

    const result = applyTemplates(value, state);

    expect(result).toEqual({
      message: 'Hello Alice',
      id: 'user-123',
    });
  });

  it('should replace templates in array values', () => {
    const value = ['User: {{state.userId}}', 'Count: {{state.count}}'];
    const state = { userId: 'user-123', count: 5 };

    const result = applyTemplates(value, state);

    expect(result).toEqual(['User: user-123', 'Count: 5']);
  });

  it('should support nested path templates', () => {
    const value = 'User: {{state.user.profile.name}}';
    const state = {
      user: {
        profile: {
          name: 'Alice',
        },
      },
    };

    const result = applyTemplates(value, state);

    expect(result).toBe('User: Alice');
  });

  it('should support array length templates', () => {
    const value = 'You have {{state.items.length}} items';
    const state = {
      items: ['apple', 'banana', 'orange'],
    };

    const result = applyTemplates(value, state);

    expect(result).toBe('You have 3 items');
  });

  it('should leave template unchanged for missing nested paths', () => {
    const value = 'User: {{state.user.profile.name}}';
    const state = {
      user: {},
    };

    const result = applyTemplates(value, state);

    expect(result).toBe('User: {{state.user.profile.name}}');
  });

  it('should return undefined when trying to traverse through non-object', () => {
    const value = 'Name: {{state.user.profile.name}}';
    const state = {
      user: 'Alice', // String, not an object
    };

    const result = applyTemplates(value, state);

    expect(result).toBe('Name: {{state.user.profile.name}}');
  });

  it('should return undefined when trying to traverse through null', () => {
    const value = 'Value: {{state.data.field}}';
    const state = {
      data: null,
    };

    const result = applyTemplates(value, state);

    expect(result).toBe('Value: {{state.data.field}}');
  });

  describe('Pure Template Injection (preserves types)', () => {
    it('should inject raw array when entire value is template', () => {
      const value = '{{state.items}}';
      const state = { items: ['Apple', 'Banana', 'Cherry'] };

      const result = applyTemplates(value, state);

      expect(result).toEqual(['Apple', 'Banana', 'Cherry']);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should inject raw number when entire value is template', () => {
      const value = '{{state.count}}';
      const state = { count: 42 };

      const result = applyTemplates(value, state);

      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });

    it('should inject raw number from array length template', () => {
      const value = '{{state.items.length}}';
      const state = { items: ['a', 'b', 'c'] };

      const result = applyTemplates(value, state);

      expect(result).toBe(3);
      expect(typeof result).toBe('number');
    });

    it('should inject raw object when entire value is template', () => {
      const value = '{{state.user}}';
      const state = { user: { name: 'Alice', age: 30 } };

      const result = applyTemplates(value, state);

      expect(result).toEqual({ name: 'Alice', age: 30 });
      expect(typeof result).toBe('object');
    });

    it('should inject raw boolean when entire value is template', () => {
      const value = '{{state.isActive}}';
      const state = { isActive: true };

      const result = applyTemplates(value, state);

      expect(result).toBe(true);
      expect(typeof result).toBe('boolean');
    });

    it('should return null when pure template state key is missing', () => {
      const value = '{{state.nonexistent}}';
      const state = {};

      const result = applyTemplates(value, state);

      // Returns null (not undefined) to ensure JSON serialization preserves the field
      expect(result).toBeNull();
    });

    it('should convert to string when template is embedded (not pure)', () => {
      const value = 'Items: {{state.items}}';
      const state = { items: ['Apple', 'Banana'] };

      const result = applyTemplates(value, state);

      expect(result).toBe('Items: Apple,Banana');
      expect(typeof result).toBe('string');
    });

    it('should work with pure templates in nested objects', () => {
      const value = {
        items: '{{state.cartItems}}',
        count: '{{state.cartItems.length}}',
        total: '{{state.total}}',
      };
      const state = {
        cartItems: ['Apple', 'Banana', 'Cherry'],
        total: 15.99,
      };

      const result = applyTemplates(value, state);

      expect(result).toEqual({
        items: ['Apple', 'Banana', 'Cherry'],
        count: 3,
        total: 15.99,
      });
    });

    it('should leave templates unchanged when referencing unsupported prefix', () => {
      // Templates only support 'state' and 'params' prefixes
      // Other prefixes like 'config' are left as-is
      const value = {
        apiKey: '{{config.apiKey}}', // Unsupported prefix
        userId: '{{state.userId}}', // Supported prefix
      };
      const templateData = {
        state: { userId: 'user-123' },
        params: { id: '456' },
      };

      const result = applyTemplates(value, templateData);

      // Unsupported prefixes are left as literals
      expect(result).toEqual({
        apiKey: '{{config.apiKey}}',
        userId: 'user-123',
      });
    });

    it('should return null for pure template when prefix is null', () => {
      const value = {
        userId: '{{state.userId}}', // Pure template
      };
      const templateData = {
        state: null as any, // Prefix exists but is null
        params: {},
      };

      const result = applyTemplates(value, templateData);

      // Pure template with null prefix returns null (field preserved for JSON serialization)
      expect(result).toEqual({ userId: null });
    });

    it('should return null for pure template when prefix is not an object', () => {
      const value = {
        userId: '{{state.userId}}', // Pure template
      };
      const templateData = {
        state: "not-an-object" as any, // Prefix exists but is not an object
        params: {},
      };

      const result = applyTemplates(value, templateData);

      // Pure template with non-object prefix returns null (field preserved for JSON serialization)
      expect(result).toEqual({ userId: null });
    });

    it('should preserve field with null when template value is missing (JSON serialization safe)', () => {
      // This test demonstrates the JSON serialization problem with undefined
      const value = {
        items: '{{state.cartItems}}',
        count: '{{state.count}}',
      };
      const state = {}; // No state exists

      const result = applyTemplates(value, state);

      // CRITICAL: Result should have fields with null, not undefined
      // undefined gets omitted by JSON.stringify, breaking API contracts
      expect(result).toEqual({
        items: null,  // Should be null, not undefined
        count: null,  // Should be null, not undefined
      });

      // Verify JSON serialization preserves the fields
      const serialized = JSON.stringify(result);
      const parsed = JSON.parse(serialized);
      expect(parsed).toEqual({
        items: null,
        count: null,
      });
    });
  });

  /**
   * Security Tests - ReDoS Prevention
   *
   * @see https://github.com/citypaul/scenarist/security/code-scanning/92
   *
   * These tests verify that the template regex is protected against
   * Regular Expression Denial of Service (ReDoS) attacks where malicious
   * input could cause exponential backtracking.
   */
  describe('Security: ReDoS Prevention', () => {
    it('should handle very long template paths without performance degradation', () => {
      // Create a path with 256 characters (at the limit)
      const longPath = 'a'.repeat(256);
      const value = `{{state.${longPath}}}`;
      const state = { [longPath]: 'found' };

      const startTime = performance.now();
      const result = applyTemplates(value, state);
      const endTime = performance.now();

      // Should complete in under 100ms (generous limit for CI)
      expect(endTime - startTime).toBeLessThan(100);
      expect(result).toBe('found');
    });

    it('should not match template paths exceeding 256 characters', () => {
      // Create a path with 257 characters (exceeds limit)
      const tooLongPath = 'a'.repeat(257);
      const value = `{{state.${tooLongPath}}}`;
      const state = { [tooLongPath]: 'found' };

      const result = applyTemplates(value, state);

      // Template should not match (path too long), so string is returned as-is
      expect(result).toBe(value);
    });

    it('should handle malicious input pattern without exponential backtracking', () => {
      // Pattern that could cause ReDoS without length limit:
      // Multiple nested braces designed to trigger backtracking
      const maliciousInput = '{{{{state.' + '|'.repeat(100) + '}}}}';
      const state = {};

      const startTime = performance.now();
      const result = applyTemplates(maliciousInput, state);
      const endTime = performance.now();

      // Should complete quickly without excessive backtracking
      expect(endTime - startTime).toBeLessThan(100);
      // Malformed template should be returned as-is
      expect(result).toBe(maliciousInput);
    });

    it('should handle repeated template patterns efficiently', () => {
      // Many templates in one string
      const templateCount = 100;
      const templates = Array.from(
        { length: templateCount },
        (_, i) => `{{state.key${i}}}`
      ).join(' ');
      const state = Object.fromEntries(
        Array.from({ length: templateCount }, (_, i) => [`key${i}`, `value${i}`])
      );

      const startTime = performance.now();
      const result = applyTemplates(templates, state);
      const endTime = performance.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(200);
      expect(result).toContain('value0');
      expect(result).toContain('value99');
    });

    it('should handle deeply nested objects in state without performance issues', () => {
      // Create deeply nested path
      const depth = 50;
      const path = Array.from({ length: depth }, (_, i) => `level${i}`).join('.');
      const value = `{{state.${path}}}`;

      // Create deeply nested state object
      let state: Record<string, unknown> = { finalValue: 'found' };
      for (let i = depth - 1; i >= 0; i--) {
        state = { [`level${i}`]: state };
      }

      const startTime = performance.now();
      // Result intentionally unused - test verifies timing, not output
      applyTemplates(value, { ...state, state });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
