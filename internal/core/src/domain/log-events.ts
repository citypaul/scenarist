/**
 * Log event constants for consistent and discoverable logging.
 *
 * Using constants ensures:
 * - TypeScript type safety for event names
 * - Discoverability via IDE autocomplete
 * - Consistent naming across the codebase
 * - Easy refactoring of event names
 */

/**
 * Log categories group related events.
 *
 * The values here match the LogCategory type from ports/driven/logger.ts.
 * Using these constants instead of string literals provides:
 * - IDE autocomplete
 * - Refactoring safety
 * - Single source of truth for category names
 */
export const LogCategories = {
  /** Scenario lifecycle events (registration, switching, clearing) */
  SCENARIO: "scenario",
  /** Mock matching and selection events */
  MATCHING: "matching",
  /** State capture and injection events */
  STATE: "state",
  /** Sequence progression events */
  SEQUENCE: "sequence",
  /** Request handling events */
  REQUEST: "request",
} as const;

/**
 * Log event names for structured logging.
 */
export const LogEvents = {
  // Scenario lifecycle
  /** Scenario successfully registered */
  SCENARIO_REGISTERED: "scenario_registered",
  /** Attempted to switch to non-existent scenario */
  SCENARIO_NOT_FOUND: "scenario_not_found",
  /** Scenario switched for a test */
  SCENARIO_SWITCHED: "scenario_switched",
  /** Scenario cleared for a test */
  SCENARIO_CLEARED: "scenario_cleared",

  // Mock matching
  /** Candidate mocks found for evaluation */
  MOCK_CANDIDATES_FOUND: "mock_candidates_found",
  /** Mock evaluated against match criteria */
  MOCK_MATCH_EVALUATED: "mock_match_evaluated",
  /** Mock selected to handle request */
  MOCK_SELECTED: "mock_selected",
  /** No mock matched the request */
  MOCK_NO_MATCH: "mock_no_match",

  // State management
  /** State captured from response */
  STATE_CAPTURED: "state_captured",
  /** State injected into response */
  STATE_INJECTED: "state_injected",
  /** State set via afterResponse.setState */
  STATE_SET: "state_set",
  /** State response resolved (condition matched or default) */
  STATE_RESPONSE_RESOLVED: "state_response_resolved",

  // Sequence progression
  /** Sequence advanced to next response */
  SEQUENCE_ADVANCED: "sequence_advanced",
  /** Sequence exhausted all responses */
  SEQUENCE_EXHAUSTED: "sequence_exhausted",

  // Error events
  /** Unhandled error in request handler */
  HANDLER_ERROR: "handler_error",
  /** Validation error in scenario definition */
  VALIDATION_ERROR: "validation_error",
  /** Request missing test ID header */
  MISSING_TEST_ID: "missing_test_id",
} as const;

export type LogEvent = (typeof LogEvents)[keyof typeof LogEvents];
