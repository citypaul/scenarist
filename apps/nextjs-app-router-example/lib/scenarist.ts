/**
 * Scenarist Setup - App Router
 *
 * Creates and configures Scenarist instance for scenario-based testing.
 * Server Components fetch data server-side, so MSW runs in Node.js (not browser).
 *
 * CRITICAL: Always use `export const scenarist = createScenarist(...)` pattern.
 * The adapter handles singleton logic internally (MSW, registry, store).
 * Never wrap in a function or default export - module duplication requires this pattern.
 */

import { createScenarist } from "@scenarist/nextjs-adapter/app";
import { scenarios } from "./scenarios";

export const scenarist = createScenarist({
  enabled: true,
  scenarios,
});

// Start MSW in Node.js environment
if (typeof window === "undefined" && scenarist) {
  scenarist.start();
}
