import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.test.ts",
        "**/index.ts",
        "**/setup.ts", // Barrel files that re-export from impl.ts (no executable logic)
      ],
      include: ["src/**/*.ts"],
      thresholds: {
        statements: 100,
        // registry/store ?? fallback branches in create-scenarist-base.ts are exercised
        // via singleton pattern (globals), but v8 coverage can't trace that path
        branches: 98,
        functions: 100,
        lines: 100,
      },
    },
  },
});
