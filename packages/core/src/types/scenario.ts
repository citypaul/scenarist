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
 * Repeat mode for response sequences.
 */
export type RepeatMode = 'last' | 'cycle' | 'none';

/**
 * Response sequence definition for polling scenarios.
 */
export type ResponseSequence = {
  readonly responses: ReadonlyArray<MockResponse>;
  readonly repeat?: RepeatMode; // Defaults to 'last'
};

/**
 * State capture configuration for stateful mocks (Phase 3).
 * Maps state keys to path expressions for extracting values from requests.
 *
 * Path syntax:
 * - 'body.field' - Extract from request body
 * - 'headers.field' - Extract from request headers
 * - 'query.field' - Extract from query parameters
 *
 * Array syntax:
 * - 'stateKey[]' - Append to array (creates array if doesn't exist)
 * - 'stateKey' - Overwrite value
 *
 * Example:
 * ```typescript
 * captureState: {
 *   'cartItems[]': 'body.item',  // Append item to cartItems array
 *   'userId': 'headers.x-user-id' // Store user ID from header
 * }
 * ```
 */
export type CaptureState = {
  readonly [stateKey: string]: string; // Path expression
};

/**
 * Serializable mock definition.
 * Represents an HTTP mock that can be converted to MSW handlers at runtime.
 *
 * A mock must have EITHER `response` (single response) OR `sequence` (ordered responses).
 */
export type MockDefinition = {
  readonly method: HttpMethod;
  readonly url: string; // URL pattern string
  readonly match?: MatchCriteria; // Optional: Request content matching criteria
  readonly response?: MockResponse; // Single response (Phase 1)
  readonly sequence?: ResponseSequence; // OR sequence of responses (Phase 2)
  readonly captureState?: CaptureState; // Optional: State capture configuration (Phase 3)
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

/**
 * Scenarios object type enforced across all adapters.
 * Ensures scenarios are defined as a named object for type inference.
 *
 * This enables TypeScript to extract scenario IDs from object keys,
 * providing autocomplete and type safety in adapter APIs.
 *
 * @example
 * ```typescript
 * const scenarios = {
 *   cartWithState: { id: 'cartWithState', name: 'Cart with State', ... },
 *   premiumUser: { id: 'premiumUser', name: 'Premium User', ... },
 * } as const satisfies ScenariosObject;
 * ```
 */
export type ScenariosObject = Record<string, ScenarioDefinition>;

/**
 * Extract scenario IDs from scenarios object for type safety.
 * Enables TypeScript autocomplete for scenario names in tests and adapters.
 *
 * The `& string` ensures the result is always a string type (not `string | number | symbol`).
 *
 * @template T - Scenarios object type
 *
 * @example
 * ```typescript
 * const scenarios = {
 *   cartWithState: { ... },
 *   premiumUser: { ... },
 * } as const;
 *
 * type MyScenarioIds = ScenarioIds<typeof scenarios>;
 * // Result: 'cartWithState' | 'premiumUser'
 * ```
 */
export type ScenarioIds<T extends ScenariosObject> = keyof T & string;
