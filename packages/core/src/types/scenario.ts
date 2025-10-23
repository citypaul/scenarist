/**
 * HTTP methods supported by mock definitions.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

/**
 * Serializable mock response definition.
 * Can be stored in Redis, files, databases, or transmitted over HTTP.
 */
export type MockResponse = {
  readonly status: number;
  readonly body?: unknown; // Must be JSON-serializable
  readonly headers?: Readonly<Record<string, string>>;
  readonly delay?: number; // Milliseconds
};

/**
 * Match criteria for request content matching.
 * All criteria are optional - if specified, they must ALL match for the mock to apply.
 */
export type MatchCriteria = {
  readonly body?: Record<string, unknown>;      // Partial match on request body
  readonly headers?: Record<string, string>;    // Exact match on specified headers
  readonly query?: Record<string, string>;      // Exact match on specified query params
};

/**
 * HTTP request data for response selection.
 * Framework adapters extract this from their specific request objects.
 * Used by ResponseSelector to match requests against MockDefinition criteria.
 */
export type HttpRequestContext = {
  readonly method: HttpMethod;
  readonly url: string;
  readonly body?: unknown; // Request body (JSON-parsed)
  readonly headers: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
};

/**
 * Serializable mock definition.
 * Represents an HTTP mock that can be converted to MSW handlers at runtime.
 */
export type MockDefinition = {
  readonly method: HttpMethod;
  readonly url: string; // URL pattern string
  readonly match?: MatchCriteria; // Optional: Request content matching criteria
  readonly response: MockResponse;
};

/**
 * Serializable variant definition.
 * Variants allow parameterization of scenarios with different data.
 */
export type VariantDefinition = {
  readonly name: string;
  readonly description: string;
  readonly data: unknown; // Must be JSON-serializable, not a function
};

/**
 * Serializable scenario definition.
 * This is pure data that can be:
 * - Stored in Redis for distributed testing
 * - Saved to files for version control
 * - Fetched from remote APIs
 * - Stored in databases
 *
 * At runtime, MockDefinitions are converted to MSW HttpHandlers.
 */
export type ScenarioDefinition = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly mocks: ReadonlyArray<MockDefinition>;
  readonly variants?: ReadonlyArray<VariantDefinition>;
};

/**
 * Represents an active scenario for a specific test ID.
 * Stores only references to enable serialization to Redis/storage.
 *
 * To get the full scenario definition, look up scenarioId in the registry.
 */
export type ActiveScenario = {
  readonly scenarioId: string;
  readonly variantName?: string;
};

/**
 * Result type for operations that can fail.
 * Prefer this over throwing exceptions for expected error cases.
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
