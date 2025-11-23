import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('App Router NODE_ENV production guard', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Clear module cache to ensure fresh import
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  it('should return undefined when NODE_ENV=production (defense layer 2)', async () => {
    // Set NODE_ENV to production BEFORE importing
    process.env.NODE_ENV = 'production';

    // Import from setup.ts (not production.ts) to test the NODE_ENV check
    const { createScenarist } = await import('../../src/app/setup.js');

    const result = await createScenarist({
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

    // Should return undefined due to NODE_ENV check
    expect(result).toBeUndefined();
  });

  it('should create instance when NODE_ENV is not production', async () => {
    // Set NODE_ENV to development
    process.env.NODE_ENV = 'development';

    const { createScenarist } = await import('../../src/app/setup.js');

    const result = await createScenarist({
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

    // Should return instance in development
    expect(result).toBeDefined();
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('start');
  });

  it('should create instance when NODE_ENV is test', async () => {
    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';

    const { createScenarist } = await import('../../src/app/setup.js');

    const result = await createScenarist({
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

    // Should return instance in test environment
    expect(result).toBeDefined();
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('start');
  });
});
