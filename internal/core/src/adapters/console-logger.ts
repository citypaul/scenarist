import type {
  Logger,
  LogLevel,
  LogCategory,
  LogContext,
} from "../ports/driven/logger.js";

/**
 * Level priority for filtering (lower = less verbose).
 */
const LEVEL_PRIORITY: Record<Exclude<LogLevel, "silent">, number> = {
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

/**
 * Output format for ConsoleLogger.
 */
export type LogFormat = "pretty" | "json";

/**
 * Configuration options for ConsoleLogger.
 */
export type ConsoleLoggerConfig = {
  readonly level: Exclude<LogLevel, "silent">;
  readonly categories?: ReadonlyArray<LogCategory>;
  readonly format?: LogFormat;
};

/**
 * Console logger implementation for development.
 */
export class ConsoleLogger implements Logger {
  private readonly configuredLevel: Exclude<LogLevel, "silent">;
  private readonly configuredCategories: ReadonlySet<LogCategory> | null;
  private readonly format: LogFormat;

  constructor(config: ConsoleLoggerConfig) {
    this.configuredLevel = config.level;
    this.configuredCategories = config.categories
      ? new Set(config.categories)
      : null;
    this.format = config.format ?? "pretty";
  }

  private shouldLog(
    level: Exclude<LogLevel, "silent">,
    category: LogCategory,
  ): boolean {
    const levelAllowed =
      LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[this.configuredLevel];
    const categoryAllowed =
      this.configuredCategories === null ||
      this.configuredCategories.has(category);
    return levelAllowed && categoryAllowed;
  }

  private formatOutput(
    level: Exclude<LogLevel, "silent">,
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): string {
    if (this.format === "json") {
      return JSON.stringify({
        timestamp: Date.now(),
        level,
        category,
        message,
        ...context,
        ...(data ? { data } : {}),
      });
    }
    return "log";
  }

  error(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("error", category)) {
      console.error(
        this.formatOutput("error", category, message, context, data),
      );
    }
  }

  warn(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("warn", category)) {
      console.warn(this.formatOutput("warn", category, message, context, data));
    }
  }

  info(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("info", category)) {
      console.info(this.formatOutput("info", category, message, context, data));
    }
  }

  debug(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("debug", category)) {
      console.debug(
        this.formatOutput("debug", category, message, context, data),
      );
    }
  }

  trace(
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("trace", category)) {
      console.debug(
        this.formatOutput("trace", category, message, context, data),
      );
    }
  }

  isEnabled(level: Exclude<LogLevel, "silent">): boolean {
    return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[this.configuredLevel];
  }
}

/**
 * Factory function for ConsoleLogger.
 */
export const createConsoleLogger = (config: ConsoleLoggerConfig): Logger =>
  new ConsoleLogger(config);
