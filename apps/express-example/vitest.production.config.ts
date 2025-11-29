import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: ["./tests/production/globalSetup.ts"],
    testTimeout: 30000, // 30 seconds for tests that make real HTTP calls
  },
});
