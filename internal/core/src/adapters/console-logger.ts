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
 * Category icons for pretty format.
 */
const CATEGORY_ICONS: Record<LogCategory, string> = {
  lifecycle: "🔄",
  scenario: "🎬",
  matching: "🎯",
  sequence: "📊",
  state: "💾",
  template: "📝",
  request: "🌐",
};

/**
 * Level labels for pretty format.
 */
const LEVEL_LABELS: Record<Exclude<LogLevel, "silent">, string> = {
  error: "ERR",
  warn: "WRN",
  info: "INF",
  debug: "DBG",
  trace: "TRC",
};

/**
 * ANSI color codes.
 */
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

/**
 * Level colors for pretty format.
 */
const LEVEL_COLORS: Record<Exclude<LogLevel, "silent">, string> = {
  error: COLORS.red,
  warn: COLORS.yellow,
  info: COLORS.cyan,
  debug: COLORS.gray,
  trace: COLORS.dim,
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

  private formatTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const ms = now.getMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  private formatData(data: Record<string, unknown>): string {
    return Object.entries(data)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(" ");
  }

  private formatPretty(
    level: Exclude<LogLevel, "silent">,
    category: LogCategory,
    message: string,
    context: LogContext,
    data?: Record<string, unknown>,
  ): string {
    const timestamp = this.formatTimestamp();
    const levelColor = LEVEL_COLORS[level];
    const levelLabel = LEVEL_LABELS[level];
    const icon = CATEGORY_ICONS[category];
    const testId = context.testId ?? "unknown";

    const parts = [
      `${COLORS.dim}${timestamp}${COLORS.reset}`,
      `${levelColor}${levelLabel}${COLORS.reset}`,
      `[${testId}]`,
      `${icon}`,
      category.padEnd(10),
      message,
    ];

    if (data && Object.keys(data).length > 0) {
      parts.push(`${COLORS.dim}${this.formatData(data)}${COLORS.reset}`);
    }

    return parts.join(" ");
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
    return this.formatPretty(level, category, message, context, data);
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
