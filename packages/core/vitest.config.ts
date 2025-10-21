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
        '**/index.ts',              // Re-export files (not executable)
        '**/src/ports/**',          // Interface definitions (not executable)
        '**/src/types/**',          // Type definitions (not executable)
      ],
      include: [
        'src/domain/**/*.ts',       // Domain logic (executable)
        'src/adapters/**/*.ts',     // Adapter implementations (executable)
      ],
    },
  },
});
