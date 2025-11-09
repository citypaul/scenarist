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

    it('should return undefined when pure template state key is missing', () => {
      const value = '{{state.nonexistent}}';
      const state = {};

      const result = applyTemplates(value, state);

      expect(result).toBeUndefined();
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
  });
});
