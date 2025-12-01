// Re-export types from setup for public API
export type {
  ExpressAdapterOptions,
  ExpressScenarist,
} from "./setup-scenarist.js";

/**
 * Production-only entry point that returns undefined without loading any dependencies.
 *
 * This file provides a safe stub implementation for createScenarist to prevent
 * MSW and test code from being included in production bundles. Conditional exports
 * ensure this file is used when NODE_ENV=production, achieving 100% tree-shaking
 * of test infrastructure.
 */
export const createScenarist = (
  _options: import("./setup-scenarist.js").ExpressAdapterOptions,
): import("./setup-scenarist.js").ExpressScenarist | undefined => {
  return undefined;
};
