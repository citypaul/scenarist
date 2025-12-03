import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    // IMPORTANT: Required to see Scenarist logging output!
    // By default, Vitest captures console output and only shows it for failed tests.
    // This setting disables that behavior so all console.log/error calls are visible.
    // Enable SCENARIST_LOG=1 to see scenario registration and switching logs.
    disableConsoleIntercept: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/production/**"],
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
