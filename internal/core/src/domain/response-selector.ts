import type {
  ScenaristMock,
  ScenaristMockWithParams,
  ScenaristResponse,
  HttpRequestContext,
  ScenaristResult,
} from "../types/index.js";
import type {
  ResponseSelector,
  SequenceTracker,
  StateManager,
  Logger,
} from "../ports/index.js";
import { ScenaristError, ErrorCodes } from "../types/errors.js";
import { extractFromPath } from "./path-extraction.js";
import { applyTemplates } from "./template-replacement.js";
import { matchesRegex } from "./regex-matching.js";
import { createStateResponseResolver } from "./state-response-resolver.js";
import { deepEquals } from "./deep-equals.js";
import type { MatchValue } from "../schemas/scenario-definition.js";
import { noOpLogger } from "../adapters/index.js";
import { LogCategories, LogEvents } from "./log-events.js";

/**
 * Type guard to check if a value is a plain object (Record).
 * Used to properly narrow types after typeof checks.
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const SPECIFICITY_RANGES = {
  MATCH_CRITERIA_BASE: 100,
  SEQUENCE_FALLBACK: 1,
  SIMPLE_FALLBACK: 0,
} as const;

/**
 * Options for creating a response selector.
 */
type CreateResponseSelectorOptions = {
  sequenceTracker?: SequenceTracker; // Optional for Phase 2
  stateManager?: StateManager; // Optional for Phase 3
  logger?: Logger; // Optional for logging
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
  options: CreateResponseSelectorOptions = {},
): ResponseSelector => {
  const { sequenceTracker, stateManager, logger = noOpLogger } = options;

  return {
    selectResponse(
      testId: string,
      scenarioId: string,
      context: HttpRequestContext,
      mocks: ReadonlyArray<ScenaristMockWithParams>,
    ): ScenaristResult<ScenaristResponse, ScenaristError> {
      const logContext = { testId, scenarioId };

      // Log the number of candidate mocks
      logger.debug(
        LogCategories.MATCHING,
        LogEvents.MOCK_CANDIDATES_FOUND,
        logContext,
        {
          count: mocks.length,
        },
      );

      let bestMatch: {
        mockWithParams: ScenaristMockWithParams;
        mockIndex: number;
        specificity: number;
      } | null = null;

      // Track if we skipped any exhausted sequences (for better error messages)
      let skippedExhaustedSequences = false;

      // Find all matching mocks and score them by specificity
      for (let mockIndex = 0; mockIndex < mocks.length; mockIndex++) {
        // eslint-disable-next-line security/detect-object-injection -- Index bounded by loop (0 <= i < length)
        const mockWithParams = mocks[mockIndex]!;
        const mock = mockWithParams.mock;

        // Skip exhausted sequences (repeat: 'none' that have been exhausted)
        if (mock.sequence && sequenceTracker) {
          const { exhausted } = sequenceTracker.getPosition(
            testId,
            scenarioId,
            mockIndex,
          );
          if (exhausted) {
            skippedExhaustedSequences = true;
            continue; // Skip to next mock, allowing fallback to be selected
          }
        }

        // Check if this mock has match criteria
        if (mock.match) {
          // If match criteria exists, check if it matches the request
          const matched = matchesCriteria(
            context,
            mock.match,
            testId,
            stateManager,
          );

          // Log the evaluation result
          logger.debug(
            LogCategories.MATCHING,
            LogEvents.MOCK_MATCH_EVALUATED,
            logContext,
            {
              mockIndex,
              matched,
              hasCriteria: true,
            },
          );

          if (matched) {
            // Match criteria always have higher priority than fallbacks
            // Base specificity ensures even 1 field beats any fallback
            const specificity =
              SPECIFICITY_RANGES.MATCH_CRITERIA_BASE +
              calculateSpecificity(mock.match);

            // Keep this mock if it's more specific than current best
            // (or if no best match yet)
            if (!bestMatch || specificity > bestMatch.specificity) {
              bestMatch = { mockWithParams, mockIndex, specificity };
            }
          }
          // If match criteria exists but doesn't match, skip to next mock
          continue;
        }

        // No match criteria = fallback mock (always matches)
        // Log fallback evaluation with response type info for debugging Issue #328
        logger.debug(
          LogCategories.MATCHING,
          LogEvents.MOCK_MATCH_EVALUATED,
          logContext,
          {
            mockIndex,
            matched: true,
            hasCriteria: false,
            hasSequence: !!mock.sequence,
            hasStateResponse: !!mock.stateResponse,
            hasResponse: !!mock.response,
          },
        );

        // Dynamic response types (sequence, stateResponse) get higher priority than simple responses
        // This ensures they are selected over simple fallback responses
        // Both sequence and stateResponse get the same specificity (Issue #316 fix)
        const fallbackSpecificity =
          mock.sequence || mock.stateResponse
            ? SPECIFICITY_RANGES.SEQUENCE_FALLBACK
            : SPECIFICITY_RANGES.SIMPLE_FALLBACK;

        if (!bestMatch || fallbackSpecificity >= bestMatch.specificity) {
          // For equal specificity fallbacks, last wins
          // This allows active scenario mocks to override default mocks
          // Applies to both simple fallbacks (0) and sequence fallbacks (1)
          bestMatch = {
            mockWithParams,
            mockIndex,
            specificity: fallbackSpecificity,
          };
        }
      }

      // Return the best matching mock
      if (bestMatch) {
        const { mockWithParams, mockIndex, specificity } = bestMatch;
        const mock = mockWithParams.mock;

        // Log successful selection
        logger.info(
          LogCategories.MATCHING,
          LogEvents.MOCK_SELECTED,
          logContext,
          {
            mockIndex,
            specificity,
          },
        );

        // Select response (single, sequence, or stateResponse)
        const response = selectResponseFromMock(
          testId,
          scenarioId,
          mockIndex,
          mock,
          sequenceTracker,
          stateManager,
          logger,
        );

        if (!response) {
          return {
            success: false,
            error: new ScenaristError(
              `Mock has neither response nor sequence field`,
              {
                code: ErrorCodes.VALIDATION_ERROR,
                context: {
                  testId,
                  scenarioId,
                  mockInfo: {
                    index: mockIndex,
                  },
                  hint: "Each mock must have a 'response', 'sequence', or 'stateResponse' field.",
                },
              },
            ),
          };
        }

        // Phase 3: Capture state from request if configured
        if (mock.captureState && stateManager) {
          captureState(testId, context, mock.captureState, stateManager);
        }

        // Apply templates to response (both state AND params)
        let finalResponse = response;
        if (stateManager || mockWithParams.params) {
          const currentState = stateManager ? stateManager.getAll(testId) : {};
          // Merge state and params for template replacement
          // params take precedence over state for the same key
          const templateData = {
            state: currentState,
            params: mockWithParams.params || {},
          };
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- applyTemplates preserves structure; input ScenaristResponse → output ScenaristResponse
          finalResponse = applyTemplates(
            response,
            templateData,
          ) as ScenaristResponse;
        }

        // Apply afterResponse.setState to mutate state for subsequent requests
        if (mock.afterResponse?.setState && stateManager) {
          stateManager.merge(testId, mock.afterResponse.setState);
          logger.debug(LogCategories.STATE, LogEvents.STATE_SET, logContext, {
            setState: mock.afterResponse.setState,
          });
        }

        return { success: true, data: finalResponse };
      }

      // No mock matched - determine specific error type
      if (skippedExhaustedSequences) {
        // All matching mocks were exhausted sequences
        logger.warn(
          LogCategories.SEQUENCE,
          LogEvents.SEQUENCE_EXHAUSTED,
          logContext,
          {
            url: context.url,
            method: context.method,
          },
        );

        return {
          success: false,
          error: new ScenaristError(
            `Sequence exhausted for ${context.method} ${context.url}. All responses have been consumed and repeat mode is 'none'.`,
            {
              code: ErrorCodes.SEQUENCE_EXHAUSTED,
              context: {
                testId,
                scenarioId,
                requestInfo: {
                  method: context.method,
                  url: context.url,
                },
                hint: "Add a fallback mock to handle requests after sequence exhaustion, or use repeat: 'last' or 'cycle' instead of 'none'.",
              },
            },
          ),
        };
      }

      logger.warn(LogCategories.MATCHING, LogEvents.MOCK_NO_MATCH, logContext, {
        url: context.url,
        method: context.method,
        candidateCount: 0,
      });

      return {
        success: false,
        error: new ScenaristError(
          `No mock matched for ${context.method} ${context.url}`,
          {
            code: ErrorCodes.NO_MOCK_FOUND,
            context: {
              testId,
              scenarioId,
              requestInfo: {
                method: context.method,
                url: context.url,
              },
              hint: "Add a fallback mock (without match criteria) to handle unmatched requests, or add a mock with matching criteria.",
            },
          },
        ),
      };
    },
  };
};

/**
 * Select a response from a mock (single response, sequence, or stateResponse).
 *
 * @param testId - Test ID for sequence/state tracking
 * @param scenarioId - Scenario ID for sequence tracking
 * @param mockIndex - Index of the mock in the mocks array
 * @param mock - The mock definition
 * @param sequenceTracker - Optional sequence tracker for Phase 2
 * @param stateManager - Optional state manager for stateResponse
 * @param logger - Logger for debugging
 * @returns ScenaristResponse or null if mock has no response type
 */
const selectResponseFromMock = (
  testId: string,
  scenarioId: string,
  mockIndex: number,
  mock: ScenaristMock,
  sequenceTracker: SequenceTracker | undefined,
  stateManager: StateManager | undefined,
  logger: Logger,
): ScenaristResponse | null => {
  const logContext = { testId, scenarioId };

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
      mockIndex,
    );

    // Get response at current position
    // Note: Exhausted sequences are skipped during matching phase,
    // so position should always be valid here
    // eslint-disable-next-line security/detect-object-injection -- Position bounded by sequence tracker
    const response = mock.sequence.responses[position]!;

    // Advance position for next call
    const repeatMode = mock.sequence.repeat || "last";
    sequenceTracker.advance(
      testId,
      scenarioId,
      mockIndex,
      mock.sequence.responses.length,
      repeatMode,
    );

    return response;
  }

  // State-aware response: evaluate conditions against current state
  if (mock.stateResponse) {
    return resolveStateResponse(
      testId,
      mock.stateResponse,
      stateManager,
      logger,
      logContext,
    );
  }

  // Phase 1: Single response
  if (mock.response) {
    return mock.response;
  }

  // No response type defined
  return null;
};

/**
 * Resolve a stateResponse configuration to a single response.
 *
 * Uses the StateResponseResolver to evaluate conditions against
 * current test state and return the appropriate response.
 *
 * @param testId - Test ID for state isolation
 * @param stateResponse - The stateResponse configuration
 * @param stateManager - Optional state manager for state lookup
 * @param logger - Logger for debugging
 * @param logContext - Context for log messages
 * @returns The resolved response (matching condition or default)
 */
const resolveStateResponse = (
  testId: string,
  stateResponse: NonNullable<ScenaristMock["stateResponse"]>,
  stateManager: StateManager | undefined,
  logger: Logger,
  logContext: { testId: string; scenarioId: string },
): ScenaristResponse => {
  // Without stateManager, always return default
  if (!stateManager) {
    logger.debug(
      LogCategories.STATE,
      LogEvents.STATE_RESPONSE_RESOLVED,
      logContext,
      {
        result: "default",
        reason: "no_state_manager",
      },
    );
    return stateResponse.default;
  }

  // Get current state for this test
  const currentState = stateManager.getAll(testId);

  // Create resolver and evaluate conditions
  const resolver = createStateResponseResolver();
  const response = resolver.resolveResponse(stateResponse, currentState);

  // Log which response was selected and why
  const isDefault = response === stateResponse.default;
  const matchedCondition = isDefault
    ? null
    : stateResponse.conditions.find(
        (c) =>
          resolver.resolveResponse(
            { default: stateResponse.default, conditions: [c] },
            currentState,
          ) !== stateResponse.default,
      );

  logger.debug(
    LogCategories.STATE,
    LogEvents.STATE_RESPONSE_RESOLVED,
    logContext,
    {
      result: isDefault ? "default" : "condition",
      currentState,
      conditionsCount: stateResponse.conditions.length,
      matchedWhen: matchedCondition?.when ?? null,
    },
  );

  return response;
};

/**
 * Calculate specificity score for match criteria.
 * Higher score = more specific match.
 *
 * Scoring:
 * - URL match = +1 point
 * - Each body field = +1 point
 * - Each header = +1 point
 * - Each query param = +1 point
 * - Each state key = +1 point
 *
 * Example:
 * { body: { itemType: 'premium' } } = 1 point
 * { body: { itemType: 'premium', quantity: 5 }, headers: { 'x-tier': 'gold' } } = 3 points
 * { url: '/api/products', body: { itemType: 'premium' } } = 2 points
 * { state: { step: 'reviewed', approved: true } } = 2 points
 */
const calculateSpecificity = (
  criteria: NonNullable<ScenaristMock["match"]>,
): number => {
  let score = 0;

  if (criteria.url) {
    score += 1;
  }

  if (criteria.body) {
    score += Object.keys(criteria.body).length;
  }

  if (criteria.headers) {
    score += Object.keys(criteria.headers).length;
  }

  if (criteria.query) {
    score += Object.keys(criteria.query).length;
  }

  if (criteria.state) {
    score += Object.keys(criteria.state).length;
  }

  return score;
};

/**
 * Check if request context matches the specified criteria.
 * All specified criteria must match for the overall match to succeed.
 *
 * @param context - HTTP request context
 * @param criteria - Match criteria from mock definition
 * @param testId - Test ID for state isolation
 * @param stateManager - Optional state manager for state-based matching
 */
const matchesCriteria = (
  context: HttpRequestContext,
  criteria: NonNullable<ScenaristMock["match"]>,
  testId: string,
  stateManager?: StateManager,
): boolean => {
  // Check URL match (exact match or pattern)
  if (criteria.url) {
    if (!matchesValue(context.url, criteria.url)) {
      return false;
    }
  }

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

  // Check state match (partial match on current test state)
  if (criteria.state) {
    if (!matchesState(criteria.state, testId, stateManager)) {
      return false;
    }
  }

  // All criteria matched
  return true;
};

/**
 * Check if current test state matches the specified state criteria.
 * All keys in criteria must exist in state with equal values (partial match).
 *
 * @param stateCriteria - Required state key-value pairs
 * @param testId - Test ID for state isolation
 * @param stateManager - State manager to retrieve current state
 * @returns true if all criteria keys match, false otherwise
 */
const matchesState = (
  stateCriteria: Readonly<Record<string, unknown>>,
  testId: string,
  stateManager?: StateManager,
): boolean => {
  // Without stateManager, state matching always fails
  if (!stateManager) {
    return false;
  }

  const currentState = stateManager.getAll(testId);

  // All keys in criteria must exist in state with equal values
  for (const [key, expectedValue] of Object.entries(stateCriteria)) {
    if (!(key in currentState)) {
      return false;
    }

    // Deep equality check for values (handles primitives, null, objects)
    // eslint-disable-next-line security/detect-object-injection -- Key from Object.entries iteration
    if (!deepEquals(currentState[key], expectedValue)) {
      return false;
    }
  }

  return true;
};

/**
 * Check if request body contains all required fields (partial match).
 * Request can have additional fields beyond what's specified in criteria.
 * Supports all matching strategies via MatchValue type.
 * Non-string values are converted to strings before matching.
 */
const matchesBody = (
  requestBody: unknown,
  criteriaBody: Record<string, MatchValue>,
): boolean => {
  // If request has no body, can't match - use type guard for proper narrowing
  if (!isRecord(requestBody)) {
    return false;
  }

  // Check all required fields exist in request body with matching values
  for (const [key, criteriaValue] of Object.entries(criteriaBody)) {
    // eslint-disable-next-line security/detect-object-injection -- Key from Object.entries iteration
    const requestValue = requestBody[key];

    // Convert to string for matching (type coercion like headers/query)
    const stringValue = requestValue == null ? "" : String(requestValue);

    if (!matchesValue(stringValue, criteriaValue)) {
      return false;
    }
  }

  return true;
};

// Header matching follows RFC 2616 (case-insensitive names, case-sensitive values)
const normalizeHeaderName = (name: string): string => name.toLowerCase();

const createNormalizedHeaderMap = (
  headers: Readonly<Record<string, string>>,
): Record<string, string> => {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[normalizeHeaderName(key)] = value;
  }
  return normalized;
};

/**
 * Match a request value against a match criteria value.
 *
 * Supports 7 matching modes:
 * 1. Plain string: exact match (backward compatible)
 * 2. Native RegExp: pattern match (e.g., /\/users\/\d+/)
 * 3. { equals: 'value' }: explicit exact match
 * 4. { contains: 'substring' }: substring match
 * 5. { startsWith: 'prefix' }: prefix match
 * 6. { endsWith: 'suffix' }: suffix match
 * 7. { regex: {...} }: pattern match (serialized form)
 *
 * Type Coercion Behavior:
 * - Non-string criterion values (number, boolean) are converted to strings before matching
 * - null/undefined criterion values are converted to empty string ''
 * - Request value is always expected to be a string
 * - Strategy values within objects are converted to strings (e.g., contains: 123 → '123')
 *
 * This allows backward compatibility with scenarios using non-string values
 * in body matching (e.g., { quantity: 5 } matches body.quantity = 5 or "5")
 *
 * @param requestValue - The actual value from the request (string)
 * @param criteriaValue - The expected value (string, RegExp, number, boolean, null, or strategy object)
 * @returns true if values match, false otherwise
 */
const matchesValue = (
  requestValue: string,
  criteriaValue: MatchValue | unknown,
): boolean => {
  if (typeof criteriaValue === "string") {
    return requestValue === criteriaValue;
  }

  // Native RegExp support (ADR-0016)
  if (criteriaValue instanceof RegExp) {
    return matchesRegex(requestValue, {
      source: criteriaValue.source,
      flags: criteriaValue.flags,
    });
  }

  if (typeof criteriaValue === "number" || typeof criteriaValue === "boolean") {
    return requestValue === String(criteriaValue);
  }

  if (criteriaValue == null) {
    return requestValue === "";
  }

  // After ruling out string, RegExp, number, boolean, null - remaining must be object strategy
  if (!isRecord(criteriaValue)) {
    return false;
  }

  if (criteriaValue.equals !== undefined) {
    return requestValue === String(criteriaValue.equals);
  }

  if (criteriaValue.contains !== undefined) {
    return requestValue.includes(String(criteriaValue.contains));
  }

  if (criteriaValue.startsWith !== undefined) {
    return requestValue.startsWith(String(criteriaValue.startsWith));
  }

  if (criteriaValue.endsWith !== undefined) {
    return requestValue.endsWith(String(criteriaValue.endsWith));
  }

  if (criteriaValue.regex !== undefined && isRecord(criteriaValue.regex)) {
    const regex = criteriaValue.regex;
    if (typeof regex.source === "string") {
      return matchesRegex(requestValue, {
        source: regex.source,
        flags: typeof regex.flags === "string" ? regex.flags : undefined,
      });
    }
  }

  return false;
};

const matchesHeaders = (
  requestHeaders: Readonly<Record<string, string>>,
  criteriaHeaders: Record<string, MatchValue>,
): boolean => {
  const normalizedRequest = createNormalizedHeaderMap(requestHeaders);

  for (const [key, value] of Object.entries(criteriaHeaders)) {
    const normalizedKey = normalizeHeaderName(key);
    // eslint-disable-next-line security/detect-object-injection -- Key normalized from Object.entries iteration
    const requestValue = normalizedRequest[normalizedKey];

    if (!requestValue || !matchesValue(requestValue, value)) {
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
  criteriaQuery: Record<string, MatchValue>,
): boolean => {
  // Check all required query params exist with exact matching values
  for (const [key, value] of Object.entries(criteriaQuery)) {
    // eslint-disable-next-line security/detect-object-injection -- Key from Object.entries iteration
    const requestValue = requestQuery[key];

    if (!requestValue || !matchesValue(requestValue, value)) {
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
  stateManager: StateManager,
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
