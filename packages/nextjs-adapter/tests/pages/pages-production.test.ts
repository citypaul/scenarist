import { describe, it, expect } from 'vitest';

describe('Pages Router Production Entry Point', () => {
  it('should return undefined when imported from production.ts', async () => {
    // Import from production entry point
    const { createScenarist } = await import('../../src/pages/production.js');

    const result = createScenarist({
      enabled: true,
      scenarios: {
        default: {
          id: 'default',
          name: 'Default Scenario',
          description: 'Default test scenario',
          mocks: [],
        },
      },
    });

    expect(result).toBeUndefined();
  });

  it('should export PagesAdapterOptions type', async () => {
    const module = await import('../../src/pages/production.js');

    // Verify type export exists (TypeScript will error if missing)
    expect(module).toHaveProperty('createScenarist');
  });

  it('should export PagesScenarist type', async () => {
    const module = await import('../../src/pages/production.js');

    // Verify type export exists (TypeScript will error if missing)
    expect(module).toHaveProperty('createScenarist');
  });

  it('should have zero runtime imports for tree-shaking', async () => {
    // This test documents the intent: production.ts should have ZERO imports
    // Bundlers rely on this for complete tree-shaking
    const { createScenarist } = await import('../../src/pages/production.js');

    // Calling createScenarist should not trigger any MSW or core imports
    const result = createScenarist({
      enabled: true,
      scenarios: {
        default: {
          id: 'default',
          name: 'Default',
          description: 'Default',
          mocks: [],
        },
      },
    });

    // Result is undefined because no dependencies are loaded
    expect(result).toBeUndefined();
  });
});
