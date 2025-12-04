import { config } from "@scenarist/eslint-config/base";

export default [
  {
    ignores: [".next/**", "node_modules/**", "playwright-report/**", "test-results/**", "next-env.d.ts"],
  },
  ...config,
];
