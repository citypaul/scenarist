// vitest.config.ts
import { defineConfig } from "file:///Users/paulhammond/personal/scenarist/node_modules/.pnpm/vitest@1.6.1_@types+node@20.19.23_@vitest+ui@1.6.1_jsdom@25.0.1/node_modules/vitest/dist/config.js";
var vitest_config_default = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.test.ts",
        "**/index.ts"
      ],
      include: [
        "src/**/*.ts"
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 93.18,
        // Explicit exception: arrow functions in createDynamicHandler only execute during HTTP (Phase 0 will achieve 100%)
        lines: 100
      }
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9wYXVsaGFtbW9uZC9wZXJzb25hbC9zY2VuYXJpc3QvcGFja2FnZXMvbmV4dGpzLWFkYXB0ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9wYXVsaGFtbW9uZC9wZXJzb25hbC9zY2VuYXJpc3QvcGFja2FnZXMvbmV4dGpzLWFkYXB0ZXIvdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcGF1bGhhbW1vbmQvcGVyc29uYWwvc2NlbmFyaXN0L3BhY2thZ2VzL25leHRqcy1hZGFwdGVyL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnXSxcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgJyoqL25vZGVfbW9kdWxlcy8qKicsXG4gICAgICAgICcqKi9kaXN0LyoqJyxcbiAgICAgICAgJyoqLyoudGVzdC50cycsXG4gICAgICAgICcqKi9pbmRleC50cycsXG4gICAgICBdLFxuICAgICAgaW5jbHVkZTogW1xuICAgICAgICAnc3JjLyoqLyoudHMnLFxuICAgICAgXSxcbiAgICAgIHRocmVzaG9sZHM6IHtcbiAgICAgICAgc3RhdGVtZW50czogMTAwLFxuICAgICAgICBicmFuY2hlczogMTAwLFxuICAgICAgICBmdW5jdGlvbnM6IDkzLjE4LCAvLyBFeHBsaWNpdCBleGNlcHRpb246IGFycm93IGZ1bmN0aW9ucyBpbiBjcmVhdGVEeW5hbWljSGFuZGxlciBvbmx5IGV4ZWN1dGUgZHVyaW5nIEhUVFAgKFBoYXNlIDAgd2lsbCBhY2hpZXZlIDEwMCUpXG4gICAgICAgIGxpbmVzOiAxMDAsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlcsU0FBUyxvQkFBb0I7QUFFMVksSUFBTyx3QkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDakMsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFlBQVk7QUFBQSxRQUNaLFVBQVU7QUFBQSxRQUNWLFdBQVc7QUFBQTtBQUFBLFFBQ1gsT0FBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
