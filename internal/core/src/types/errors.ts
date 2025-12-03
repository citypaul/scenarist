/**
 * Standard error codes for Scenarist errors.
 * Use these constants when creating ScenaristError instances.
 */
export const ErrorCodes = {
  SCENARIO_NOT_FOUND: "SCENARIO_NOT_FOUND",
  DUPLICATE_SCENARIO: "DUPLICATE_SCENARIO",
  NO_MOCK_FOUND: "NO_MOCK_FOUND",
  SEQUENCE_EXHAUSTED: "SEQUENCE_EXHAUSTED",
  NO_STATE_MATCH: "NO_STATE_MATCH",
  MISSING_TEST_ID: "MISSING_TEST_ID",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

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
