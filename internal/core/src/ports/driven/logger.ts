/**
 * Log levels ordered by verbosity (ascending).
 * Each level includes all less verbose levels.
 *
 * - silent: No output (production default)
 * - error: Critical failures preventing operation
 * - warn: Potential issues that may cause problems
 * - info: Operation flow and key events
 * - debug: Detailed decision logic
 * - trace: Request/response bodies, verbose details
 */
export type LogLevel = "silent" | "error" | "warn" | "info" | "debug" | "trace";

/**
 * Log categories for filtering specific areas of concern.
 * Users can enable/disable categories independently.
 */
export type LogCategory =
  | "lifecycle" // Startup, shutdown, initialization
  | "scenario" // Scenario switching, registration
  | "matching" // Mock selection, URL/method matching, specificity
  | "sequence" // Sequence position, advancement, exhaustion
  | "state" // State capture, injection, mutation
  | "template" // Template replacement
  | "request"; // Request/response lifecycle

/**
 * Base context included in all log events.
 * Enables filtering and correlation by test ID.
 */
export type LogContext = {
  readonly testId?: string;
  readonly scenarioId?: string;
  readonly requestUrl?: string;
  readonly requestMethod?: string;
};

/**
 * Structured log entry for capture and serialization.
 */
export type LogEntry = {
  readonly level: Exclude<LogLevel, "silent">;
  readonly category: LogCategory;
  readonly message: string;
  readonly context: LogContext;
  readonly data?: Record<string, unknown>;
  readonly timestamp: number;
};

/**
 * Logger port for structured logging.
 *
 * This is a driven (secondary) port - domain logic calls out to it,
 * implementations are injected via dependency injection.
 *
 * Implementations must handle:
 * - Level filtering (only emit logs at or above configured level)
 * - Category filtering (optionally filter by category)
 * - Output formatting (console, JSON, custom)
 *
 * This port enables:
 * - NoOpLogger: Zero overhead when disabled (production, silent mode)
 * - ConsoleLogger: Human-readable or JSON output (development)
 * - TestLogger: Capture logs for assertion in tests
 * - Custom loggers: User-provided implementations (Winston, Pino, etc.)
 *
 * All methods return void - logging is fire-and-forget.
 * Implementations should never throw.
 */
export interface Logger {
  /**
   * Log at error level - critical failures preventing operation.
   *
   * @param category - Area of concern for filtering
   * @param message - Human-readable event description
   * @param context - Request context for correlation (testId, scenarioId, etc.)
   * @param data - Optional structured data for the event
   */
  error(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  /**
   * Log at warn level - potential issues that may cause problems.
   *
   * @param category - Area of concern for filtering
   * @param message - Human-readable event description
   * @param context - Request context for correlation
   * @param data - Optional structured data for the event
   */
  warn(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  /**
   * Log at info level - operation flow and key events.
   *
   * @param category - Area of concern for filtering
   * @param message - Human-readable event description
   * @param context - Request context for correlation
   * @param data - Optional structured data for the event
   */
  info(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  /**
   * Log at debug level - detailed decision logic.
   *
   * @param category - Area of concern for filtering
   * @param message - Human-readable event description
   * @param context - Request context for correlation
   * @param data - Optional structured data for the event
   */
  debug(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  /**
   * Log at trace level - request/response bodies, verbose details.
   *
   * @param category - Area of concern for filtering
   * @param message - Human-readable event description
   * @param context - Request context for correlation
   * @param data - Optional structured data for the event
   */
  trace(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void;

  /**
   * Check if a specific level would be logged.
   * Enables conditional expensive operations before logging.
   *
   * @example
   * if (logger.isEnabled('trace')) {
   *   logger.trace('request', 'body', ctx, { body: JSON.stringify(large) });
   * }
   *
   * @param level - The log level to check
   * @returns true if logging at this level is enabled
   */
  isEnabled(level: Exclude<LogLevel, "silent">): boolean;
}
