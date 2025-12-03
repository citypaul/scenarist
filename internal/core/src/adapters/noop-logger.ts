import type { Logger } from "../ports/driven/logger.js";

/**
 * No-operation logger that discards all log calls.
 *
 * Used when logging is disabled for zero overhead.
 * All methods are empty - V8 will inline and eliminate them.
 */
export class NoOpLogger implements Logger {
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
  trace(): void {}
  isEnabled(): boolean {
    return false;
  }
}

/**
 * Singleton NoOpLogger instance.
 * Prevents unnecessary allocations.
 */
export const noOpLogger: Logger = new NoOpLogger();

/**
 * Factory function for NoOpLogger.
 * Returns the singleton instance.
 */
export const createNoOpLogger = (): Logger => noOpLogger;
