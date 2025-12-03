/**
 * Context information for Scenarist errors.
 * Provides structured data to help diagnose and fix issues.
 */
export type ErrorContext = {
  readonly testId?: string;
  readonly scenarioId?: string;
  readonly requestInfo?: {
    readonly method: string;
    readonly url: string;
    readonly headers?: Record<string, string>;
  };
  readonly mockInfo?: {
    readonly index: number;
    readonly matchCriteria?: object;
  };
  readonly hint?: string;
};

/**
 * Options for creating a ScenaristError.
 */
export type ScenaristErrorOptions = {
  readonly code: string;
  readonly context: ErrorContext;
  readonly cause?: Error;
};

/**
 * Base error class for all Scenarist errors.
 * Includes error code and structured context for debugging.
 */
export class ScenaristError extends Error {
  readonly code: string;
  readonly context: ErrorContext;

  constructor(message: string, options: ScenaristErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "ScenaristError";
    this.code = options.code;
    this.context = options.context;
  }
}
