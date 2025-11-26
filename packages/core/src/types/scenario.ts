import type { HttpMethod, ScenaristScenario } from '../schemas/index.js';

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
  /**
   * Path parameters extracted from URL pattern matching.
   *
   * MSW compatibility:
   * - Simple params (:id) → string
   * - Repeating params (:path+) → ReadonlyArray<string>
   * - Absent optional params (:id?) → key omitted from object
   */
  readonly params?: Readonly<Record<string, string | ReadonlyArray<string>>>;
};

/**
 * Mock paired with its extracted URL path parameters.
 * Used to pass both the mock definition and its params through the pipeline.
 *
 * When URL matching succeeds, params are extracted from the URL pattern.
 * After ResponseSelector chooses a mock, those params are added to HttpRequestContext
 * so template replacement can use them via {{params.key}} syntax.
 *
 * Example:
 * ```typescript
 * // Mock with pattern: '/users/:id'
 * // Request URL: '/users/123'
 * // Result: { mock: {...}, params: { id: '123' } }
 * ```
 */
export type ScenaristMockWithParams = {
  readonly mock: import('../schemas/index.js').ScenaristMock;
  readonly params?: Readonly<Record<string, string | ReadonlyArray<string>>>;
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
 *
 * NOTE: CaptureState type is now schema-inferred from ScenaristCaptureConfigSchema.
 */

/**
 * Serializable mock definition.
 * Represents an HTTP mock that can be converted to MSW handlers at runtime.
 *
 * A mock must have EITHER `response` (single response) OR `sequence` (ordered responses).
 *
 * NOTE: MockDefinition type is now schema-inferred from ScenaristMockSchema.
 */

/**
 * Serializable scenario definition.
 * This is pure data that can be:
 * - Stored in Redis for distributed testing
 * - Saved to files for version control
 * - Fetched from remote APIs
 * - Stored in databases
 *
 * At runtime, ScenaristMocks are converted to MSW HttpHandlers.
 *
 * NOTE: ScenarioDefinition type is now schema-inferred from ScenaristScenarioSchema.
 */

/**
 * Represents an active scenario for a specific test ID.
 * Stores only references to enable serialization to Redis/storage.
 *
 * To get the full scenario definition, look up scenarioId in the registry.
 */
export type ActiveScenario = {
  readonly scenarioId: string;
};

/**
 * Result type for operations that can fail.
 * Prefer this over throwing exceptions for expected error cases.
 */
export type ScenaristResult<T, E = Error> =
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
 * } as const satisfies ScenaristScenarios;
 * ```
 */
export type ScenaristScenarios = Record<string, ScenaristScenario>;

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
export type ScenarioIds<T extends ScenaristScenarios> = keyof T & string;
