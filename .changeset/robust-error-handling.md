---
"@scenarist/core": minor
"@scenarist/msw-adapter": minor
---

Add robust error handling with graceful degradation

**New Features:**

- `ScenaristError` base class with error codes, context, and actionable hints
- `ErrorCodes` constants for programmatic error handling
- `ErrorBehaviors` configuration (`throw` | `warn` | `ignore`) for:
  - `onNoMockFound` - when no mock matches a request
  - `onSequenceExhausted` - when sequence runs out of responses
  - `onNoStateMatch` - when stateResponse has no matching condition
  - `onMissingTestId` - when request lacks test ID header
- MSW handler error boundary with logging and 500 responses
- `LogCategories` and `LogEvents` typed constants for structured logging
- Comprehensive scenario validation at registration time

**Error Codes:**

- `SCENARIO_NOT_FOUND` - scenario doesn't exist
- `DUPLICATE_SCENARIO` - scenario ID already registered
- `NO_MOCK_FOUND` - no mock matched request
- `SEQUENCE_EXHAUSTED` - sequence has no more responses
- `NO_STATE_MATCH` - no state condition matched
- `MISSING_TEST_ID` - request missing test ID header
- `VALIDATION_ERROR` - invalid scenario definition
