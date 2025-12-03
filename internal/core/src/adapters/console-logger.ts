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
};

/**
 * Console logger implementation for development.
 */
export class ConsoleLogger implements Logger {
  private readonly configuredLevel: Exclude<LogLevel, "silent">;

  constructor(config: ConsoleLoggerConfig) {
    this.configuredLevel = config.level;
  }

  private shouldLog(level: Exclude<LogLevel, "silent">): boolean {
    return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[this.configuredLevel];
  }

  error(
    _category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("error")) {
      console.error("log");
    }
  }

  warn(
    _category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("warn")) {
      console.warn("log");
    }
  }

  info(
    _category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("info")) {
      console.info("log");
    }
  }

  debug(
    _category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("debug")) {
      console.debug("log");
    }
  }

  trace(
    _category: LogCategory,
    _message: string,
    _context: LogContext,
    _data?: Record<string, unknown>,
  ): void {
    if (this.shouldLog("trace")) {
      console.debug("log");
    }
  }

  isEnabled(level: Exclude<LogLevel, "silent">): boolean {
    return this.shouldLog(level);
  }
}

/**
 * Factory function for ConsoleLogger.
 */
export const createConsoleLogger = (config: ConsoleLoggerConfig): Logger =>
  new ConsoleLogger(config);
