import type {
  MockDefinition,
  MockResponse,
  HttpRequestContext,
  Result,
} from "../../types/index.js";

/**
 * Error type for response selection failures.
 */
export class ResponseSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResponseSelectionError";
  }
}

/**
 * Secondary port for response selection.
 * Determines which mock response to return based on request content.
 *
 * Phase 1 (Current): Stateless matching on body/headers/query
 * Phase 2 (Future): Sequence tracking (first call, second call, etc.)
 * Phase 3 (Future): Stateful responses (increment counters, etc.)
 *
 * The interface is defined as a port to allow:
 * - Default implementation: Stateless content matching (createResponseSelector)
 * - Sequence-aware implementation: Track call counts per mock
 * - State-aware implementation: Maintain state across requests
 * - Test doubles: Mock response selection for adapter tests
 */
export interface ResponseSelector {
  /**
   * Select a response from candidate mocks based on request content.
   *
   * @param testId - Test ID for sequence/state tracking (unused in Phase 1)
   * @param context - Request context (method, url, body, headers, query)
   * @param mocks - Candidate mocks from active scenario (already filtered by URL/method)
   * @returns Result with selected MockResponse or error if no match found
   */
  selectResponse(
    testId: string,
    context: HttpRequestContext,
    mocks: ReadonlyArray<MockDefinition>
  ): Result<MockResponse, ResponseSelectionError>;
}
