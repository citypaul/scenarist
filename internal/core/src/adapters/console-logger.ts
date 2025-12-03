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
 * Configuration options for ConsoleLogger.
 */
export type ConsoleLoggerConfig = {
  readonly level: Exclude<LogLevel, "silent">;
  readonly categories?: ReadonlyArray<LogCategory>;
};

/**
 * Console logger implementation for development.
 */
export class ConsoleLogger implements Logger {
  private readonly configuredLevel: Exclude<LogLevel, "silent">;
  private readonly configuredCategories: ReadonlySet<LogCategory> | null;

  constructor(config: ConsoleLoggerConfig) {
    this.configuredLevel = config.level;
    this.configuredCategories = config.categories
      ? new Set(config.categories)
      : null;
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

  error(
    category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("error", category)) {
      console.error("log");
    }
  }

  warn(
    category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("warn", category)) {
      console.warn("log");
    }
  }

  info(
    category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("info", category)) {
      console.info("log");
    }
  }

  debug(
    category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("debug", category)) {
      console.debug("log");
    }
  }

  trace(
    category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("trace", category)) {
      console.debug("log");
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
