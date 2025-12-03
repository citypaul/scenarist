// Re-export types from setup for public API
export type { AppAdapterOptions, AppScenarist } from "./setup.js";

// Re-export logger types from core
export type {
  Logger,
  LogLevel,
  LogCategory,
  LogContext,
  ConsoleLoggerConfig,
} from "@scenarist/core";

/**
 * Production-only entry point that returns undefined without loading test dependencies.
 *
 * This file provides safe stub implementations for all Scenarist functions to prevent
 * MSW and test code from being included in production bundles. Conditional exports
 * ensure this file is used when NODE_ENV=production, achieving 100% tree-shaking
 * of test infrastructure.
 *
 * All helper functions return safe defaults (empty objects, fallback strings) so that
 * application code can import and use them without production guards.
 */
export const createScenarist = (
  _options: import("./setup.js").AppAdapterOptions,
): import("./setup.js").AppScenarist | undefined => {
  return undefined;
};

/**
 * Production stub: Returns undefined (logging disabled in production)
 */
export const createConsoleLogger = (
  _config: import("@scenarist/core").ConsoleLoggerConfig,
): import("@scenarist/core").Logger | undefined => {
  return undefined;
};

/**
 * Production stub: Returns empty object (no test headers needed in production)
 */
export function getScenaristHeaders(_req: Request): Record<string, string> {
  return {};
}

/**
 * Production stub: Returns empty object (no test headers needed in production)
 */
export function getScenaristHeadersFromReadonlyHeaders(_headers: {
  get(name: string): string | null;
}): Record<string, string> {
  return {};
}

/**
 * Production stub: Returns fallback test ID
 */
export function getScenaristTestId(_req: Request): string {
  return "default-test";
}

/**
 * Production stub: Returns fallback test ID
 */
export function getScenaristTestIdFromReadonlyHeaders(_headers: {
  get(name: string): string | null;
}): string {
  return "default-test";
}
