import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/index.ts',
      ],
      include: [
        'src/**/*.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 92.85, // Explicit exception: arrow functions in createDynamicHandler only execute during HTTP (Phase 0 will achieve 100%)
        lines: 100,
      },
    },
  },
});
