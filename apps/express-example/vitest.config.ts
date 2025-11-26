import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/production/**'],
  },
});

/**
 * Why fileParallelism: false?
 *
 * MSW (Mock Service Worker) intercepts HTTP requests at the process/thread level.
 * When multiple test files run in parallel, each creates its own MSW server instance.
 * These instances can interfere with each other, causing flaky tests.
 *
 * The fix:
 * - Sequential file execution ensures only one MSW server is active at a time
 * - Tests within each file still run efficiently
 * - Scenarist's Test ID isolation works correctly within a single MSW instance
 *
 * This is NOT a Scenarist limitation - Scenarist is designed for concurrent tests
 * via Test ID isolation. The issue is MSW's process-level interception mechanism.
 *
 * In production E2E testing (e.g., Playwright), there's ONE app server with
 * Scenarist, and multiple test workers each use unique Test IDs. That works
 * perfectly because there's only one MSW server.
 */
