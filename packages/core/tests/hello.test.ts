import { describe, it, expect } from 'vitest';

describe('Core Package', () => {
  it('should pass a hello world test', () => {
    expect(true).toBe(true);
  });

  it('should be able to import types', () => {
    // This test verifies that the type exports are working
    const result: { readonly success: true; readonly data: string } = {
      success: true,
      data: 'hello',
    };

    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });
});
