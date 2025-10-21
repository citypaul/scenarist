import { describe, it, expect } from 'vitest';

describe('MSW Adapter Package', () => {
  it('should be importable', async () => {
    const module = await import('../src/index.js');
    expect(module).toBeDefined();
  });
});
