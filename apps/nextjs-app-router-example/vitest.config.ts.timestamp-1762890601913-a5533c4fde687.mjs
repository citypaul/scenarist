// vitest.config.ts
import { defineConfig } from "file:///Users/paulhammond/personal/scenarist/node_modules/.pnpm/vitest@2.1.9_@types+node@20.19.23_@vitest+ui@1.6.1_jsdom@25.0.1_msw@2.11.6_@types+node@20.19.23_typescript@5.9.2_/node_modules/vitest/dist/config.js";
import react from "file:///Users/paulhammond/personal/scenarist/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@20.19.23_/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/Users/paulhammond/personal/scenarist/apps/nextjs-app-router-example";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/api/setup.ts"],
    include: ["tests/api/**/*.{test,spec}.{js,ts,jsx,tsx}"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9wYXVsaGFtbW9uZC9wZXJzb25hbC9zY2VuYXJpc3QvYXBwcy9uZXh0anMtYXBwLXJvdXRlci1leGFtcGxlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcGF1bGhhbW1vbmQvcGVyc29uYWwvc2NlbmFyaXN0L2FwcHMvbmV4dGpzLWFwcC1yb3V0ZXItZXhhbXBsZS92aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9wYXVsaGFtbW9uZC9wZXJzb25hbC9zY2VuYXJpc3QvYXBwcy9uZXh0anMtYXBwLXJvdXRlci1leGFtcGxlL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBzZXR1cEZpbGVzOiBbJy4vdGVzdHMvYXBpL3NldHVwLnRzJ10sXG4gICAgaW5jbHVkZTogWyd0ZXN0cy9hcGkvKiovKi57dGVzdCxzcGVjfS57anMsdHMsanN4LHRzeH0nXSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLycpLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1ksU0FBUyxvQkFBb0I7QUFDL1osT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLHNCQUFzQjtBQUFBLElBQ25DLFNBQVMsQ0FBQyw0Q0FBNEM7QUFBQSxFQUN4RDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsSUFBSTtBQUFBLElBQ25DO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
