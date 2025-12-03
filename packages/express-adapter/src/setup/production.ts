// Re-export types from setup for public API
export type {
  ExpressAdapterOptions,
  ExpressScenarist,
} from "./setup-scenarist.js";

// Re-export logger types from core
export type {
  Logger,
  LogLevel,
  LogCategory,
  LogContext,
  ConsoleLoggerConfig,
} from "@scenarist/core";

/**
 * Production-only entry point that returns undefined without loading any dependencies.
 *
 * This file provides safe stub implementations for all Scenarist functions to prevent
 * MSW and test code from being included in production bundles. Conditional exports
 * ensure this file is used when NODE_ENV=production, achieving 100% tree-shaking
 * of test infrastructure.
 */
export const createScenarist = (
  _options: import("./setup-scenarist.js").ExpressAdapterOptions,
): import("./setup-scenarist.js").ExpressScenarist | undefined => {
  return undefined;
};

/**
 * Production stub: Returns undefined (logging disabled in production)
 *
 * This allows application code to conditionally create loggers without
 * importing the full logger implementation in production builds.
 */
export const createConsoleLogger = (
  _config: import("@scenarist/core").ConsoleLoggerConfig,
): import("@scenarist/core").Logger | undefined => {
  return undefined;
};
