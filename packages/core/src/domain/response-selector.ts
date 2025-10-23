import type {
  MockDefinition,
  MockResponse,
  HttpRequestContext,
  Result,
} from "../types/index.js";

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
 * Response selector domain service interface.
 */
export type ResponseSelector = {
  selectResponse(
    testId: string,
    context: HttpRequestContext,
    mocks: ReadonlyArray<MockDefinition>
  ): Result<MockResponse, ResponseSelectionError>;
};

/**
 * Creates a response selector domain service.
 * This service implements the matching logic for request content matching.
 *
 * Factory pattern with no dependencies for Phase 1 (matching only).
 * In later phases, this will accept SequenceTracker and StateManager as dependencies.
 */
export const createResponseSelector = (): ResponseSelector => {
  return {
    selectResponse(
      _testId: string,
      context: HttpRequestContext,
      mocks: ReadonlyArray<MockDefinition>
    ): Result<MockResponse, ResponseSelectionError> {
      // Iterate through mocks in order (first matching mock wins)
      for (const mock of mocks) {
        // Check if this mock has match criteria
        if (mock.match) {
          // If match criteria exists, check if it matches the request
          if (matchesCriteria(context, mock.match)) {
            return { success: true, data: mock.response };
          }
          // If match criteria exists but doesn't match, skip to next mock
          continue;
        }

        // No match criteria = fallback mock (always matches)
        return { success: true, data: mock.response };
      }

      // No mock matched
      return {
        success: false,
        error: new ResponseSelectionError(
          `No mock matched for ${context.method} ${context.url}`
        ),
      };
    },
  };
};

/**
 * Check if request context matches the specified criteria.
 * All specified criteria must match for the overall match to succeed.
 */
const matchesCriteria = (
  context: HttpRequestContext,
  criteria: NonNullable<MockDefinition["match"]>
): boolean => {
  // Check body match (partial match)
  if (criteria.body) {
    if (!matchesBody(context.body, criteria.body)) {
      return false;
    }
  }

  // Check headers match (exact match on specified headers)
  if (criteria.headers) {
    if (!matchesHeaders(context.headers, criteria.headers)) {
      return false;
    }
  }

  // Check query match (exact match on specified query params)
  if (criteria.query) {
    if (!matchesQuery(context.query, criteria.query)) {
      return false;
    }
  }

  // All criteria matched
  return true;
};

/**
 * Check if request body contains all required fields (partial match).
 * Request can have additional fields beyond what's specified in criteria.
 */
const matchesBody = (
  requestBody: unknown,
  criteriaBody: Record<string, unknown>
): boolean => {
  // If request has no body, can't match
  if (!requestBody || typeof requestBody !== "object") {
    return false;
  }

  const body = requestBody as Record<string, unknown>;

  // Check all required fields exist in request body with matching values
  for (const [key, value] of Object.entries(criteriaBody)) {
    if (body[key] !== value) {
      return false;
    }
  }

  return true;
};

/**
 * Check if request headers contain all specified headers with exact values.
 * Request can have additional headers beyond what's specified in criteria.
 */
const matchesHeaders = (
  requestHeaders: Readonly<Record<string, string>>,
  criteriaHeaders: Record<string, string>
): boolean => {
  // Check all required headers exist with exact matching values
  for (const [key, value] of Object.entries(criteriaHeaders)) {
    if (requestHeaders[key] !== value) {
      return false;
    }
  }

  return true;
};

/**
 * Check if request query params contain all specified params with exact values.
 * Request can have additional query params beyond what's specified in criteria.
 */
const matchesQuery = (
  requestQuery: Readonly<Record<string, string>>,
  criteriaQuery: Record<string, string>
): boolean => {
  // Check all required query params exist with exact matching values
  for (const [key, value] of Object.entries(criteriaQuery)) {
    if (requestQuery[key] !== value) {
      return false;
    }
  }

  return true;
};
