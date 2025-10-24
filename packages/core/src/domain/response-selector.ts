import type {
  MockDefinition,
  MockResponse,
  HttpRequestContext,
  Result,
} from "../types/index.js";
import type { ResponseSelector, SequenceTracker, StateManager } from "../ports/index.js";
import { ResponseSelectionError } from "../ports/driven/response-selector.js";
import { extractFromPath } from "./path-extraction.js";

/**
 * Options for creating a response selector.
 */
type CreateResponseSelectorOptions = {
  sequenceTracker?: SequenceTracker; // Optional for Phase 2
  stateManager?: StateManager; // Optional for Phase 3
};

/**
 * Creates a response selector domain service.
 *
 * Phase 1: Request content matching (body/headers/query)
 * Phase 2: Response sequences with repeat modes
 * Phase 3: Stateful mocks with capture/injection
 *
 * @param options - Configuration options
 * @param options.sequenceTracker - Optional sequence position tracker (Phase 2)
 * @param options.stateManager - Optional state manager for capture/injection (Phase 3)
 */
export const createResponseSelector = (
  options: CreateResponseSelectorOptions = {}
): ResponseSelector => {
  const { sequenceTracker, stateManager } = options;

  return {
    selectResponse(
      testId: string,
      scenarioId: string,
      context: HttpRequestContext,
      mocks: ReadonlyArray<MockDefinition>
    ): Result<MockResponse, ResponseSelectionError> {
      let bestMatch: {
        mock: MockDefinition;
        mockIndex: number;
        specificity: number;
      } | null = null;

      // Find all matching mocks and score them by specificity
      for (let mockIndex = 0; mockIndex < mocks.length; mockIndex++) {
        // Index is guaranteed in bounds by loop condition (0 <= mockIndex < length)
        const mock = mocks[mockIndex]!;

        // Skip exhausted sequences (repeat: 'none' that have been exhausted)
        if (mock.sequence && sequenceTracker) {
          const { exhausted } = sequenceTracker.getPosition(
            testId,
            scenarioId,
            mockIndex
          );
          if (exhausted) {
            continue; // Skip to next mock, allowing fallback to be selected
          }
        }

        // Check if this mock has match criteria
        if (mock.match) {
          // If match criteria exists, check if it matches the request
          if (matchesCriteria(context, mock.match)) {
            const specificity = calculateSpecificity(mock.match);

            // Keep this mock if it's more specific than current best
            // (or if no best match yet)
            if (!bestMatch || specificity > bestMatch.specificity) {
              bestMatch = { mock, mockIndex, specificity };
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
            bestMatch = { mock, mockIndex, specificity: 0 };
          }
        }
      }

      // Return the best matching mock
      if (bestMatch) {
        // Select response (either single or from sequence)
        const response = selectResponseFromMock(
          testId,
          scenarioId,
          bestMatch.mockIndex,
          bestMatch.mock,
          sequenceTracker
        );

        if (!response) {
          return {
            success: false,
            error: new ResponseSelectionError(
              `Mock has neither response nor sequence field`
            ),
          };
        }

        // Phase 3: Capture state from request if configured
        if (bestMatch.mock.captureState && stateManager) {
          captureState(testId, context, bestMatch.mock.captureState, stateManager);
        }

        return { success: true, data: response };
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
 * Select a response from a mock (either single response or from sequence).
 *
 * @param testId - Test ID for sequence tracking
 * @param scenarioId - Scenario ID for sequence tracking
 * @param mockIndex - Index of the mock in the mocks array
 * @param mock - The mock definition
 * @param sequenceTracker - Optional sequence tracker for Phase 2
 * @returns MockResponse or null if mock has neither response nor sequence
 */
const selectResponseFromMock = (
  testId: string,
  scenarioId: string,
  mockIndex: number,
  mock: MockDefinition,
  sequenceTracker?: SequenceTracker
): MockResponse | null => {
  // Phase 2: If mock has a sequence, use sequence tracker
  if (mock.sequence) {
    if (!sequenceTracker) {
      // Sequence defined but no tracker provided - return first response
      return mock.sequence.responses[0] || null;
    }

    // Get current position from tracker
    const { position } = sequenceTracker.getPosition(
      testId,
      scenarioId,
      mockIndex
    );

    // Get response at current position
    // Note: Exhausted sequences are skipped during matching phase,
    // so position should always be valid here
    const response = mock.sequence.responses[position]!;

    // Advance position for next call
    const repeatMode = mock.sequence.repeat || 'last';
    sequenceTracker.advance(
      testId,
      scenarioId,
      mockIndex,
      mock.sequence.responses.length,
      repeatMode
    );

    return response;
  }

  // Phase 1: Single response
  if (mock.response) {
    return mock.response;
  }

  // Neither response nor sequence defined
  return null;
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

/**
 * Captures state from request based on CaptureState configuration.
 *
 * @param testId - Test ID for state isolation
 * @param context - HTTP request context
 * @param captureConfig - Capture configuration (state key -> path expression)
 * @param stateManager - State manager to store captured values
 */
const captureState = (
  testId: string,
  context: HttpRequestContext,
  captureConfig: Readonly<Record<string, string>>,
  stateManager: StateManager
): void => {
  for (const [stateKey, pathExpression] of Object.entries(captureConfig)) {
    const value = extractFromPath(context, pathExpression);

    // Guard: Only capture if value exists
    if (value === undefined) {
      continue;
    }

    stateManager.set(testId, stateKey, value);
  }
};
