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
});
