import type {
  MockDefinition,
  MockResponse,
  HttpRequestContext,
  Result,
} from "../types/index.js";
import type { ResponseSelector } from "../ports/index.js";
import { ResponseSelectionError } from "../ports/driven/response-selector.js";

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
      let bestMatch: { mock: MockDefinition; specificity: number } | null = null;

      // Find all matching mocks and score them by specificity
      for (const mock of mocks) {
        // Check if this mock has match criteria
        if (mock.match) {
          // If match criteria exists, check if it matches the request
          if (matchesCriteria(context, mock.match)) {
            const specificity = calculateSpecificity(mock.match);

            // Keep this mock if it's more specific than current best
            // (or if no best match yet)
            if (!bestMatch || specificity > bestMatch.specificity) {
              bestMatch = { mock, specificity };
            }
          }
          // If match criteria exists but doesn't match, skip to next mock
          continue;
        }

        // No match criteria = fallback mock (always matches)
        // Fallback has specificity of 0
        if (!bestMatch || bestMatch.specificity === 0) {
          // Only use fallback if no better match exists, or if we only have
          // other fallbacks (first fallback wins as tiebreaker)
          if (!bestMatch) {
            bestMatch = { mock, specificity: 0 };
          }
        }
      }

      // Return the best matching mock
      if (bestMatch) {
        return { success: true, data: bestMatch.mock.response };
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
 * Calculate specificity score for match criteria.
 * Higher score = more specific match.
 *
 * Scoring:
 * - Each body field = +1 point
 * - Each header = +1 point
 * - Each query param = +1 point
 *
 * Example:
 * { body: { itemType: 'premium' } } = 1 point
 * { body: { itemType: 'premium', quantity: 5 }, headers: { 'x-tier': 'gold' } } = 3 points
 */
const calculateSpecificity = (
  criteria: NonNullable<MockDefinition["match"]>
): number => {
  let score = 0;

  if (criteria.body) {
    score += Object.keys(criteria.body).length;
  }

  if (criteria.headers) {
    score += Object.keys(criteria.headers).length;
  }

  if (criteria.query) {
    score += Object.keys(criteria.query).length;
  }

  return score;
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
