# State-Aware Mocking: Implementation Reference

This document contains technical details for implementing ADR-0019 (State-Aware Mocking).

## API Design

### 1. Reading State: `stateResponse`

Conditionally return different responses based on current test state:

```typescript
{
  method: 'GET',
  url: '/v2/applications/:applicationId',
  stateResponse: {
    default: {
      status: 200,
      body: { state: 'appStarted', subState: null }
    },
    conditions: [
      {
        when: { workflowStep: 'eligibility-checked' },
        then: {
          status: 200,
          body: { state: 'quoteDecline', subState: null }
        }
      }
    ]
  }
}
```

### 2. Writing State: `afterResponse.setState`

Mutate test state after returning a response:

```typescript
{
  method: 'POST',
  url: '/v2/applications/:applicationId/eligibility',
  response: {
    status: 200,
    body: { state: 'quoteDecline', subState: null }
  },
  afterResponse: {
    setState: { workflowStep: 'eligibility-checked' }
  }
}
```

### 3. Matching on State: `match.state`

Select which mock handles a request based on current state. This enables multiple transitions on the same endpoint:

```typescript
// POST /review when in 'initial' state → transitions to 'reviewed'
{
  method: 'POST',
  url: '/application/review',
  match: { state: { step: 'initial' } },
  response: { body: { state: 'pending_approval' } },
  afterResponse: { setState: { step: 'reviewed' } }
},

// POST /review when in 'reviewed' state → transitions to 'approved'
{
  method: 'POST',
  url: '/application/review',
  match: { state: { step: 'reviewed' } },
  response: { body: { state: 'approved' } },
  afterResponse: { setState: { step: 'approved' } }
},

// POST /review fallback (no state match) → transitions to 'reviewed'
{
  method: 'POST',
  url: '/application/review',
  response: { body: { state: 'pending_approval' } },
  afterResponse: { setState: { step: 'reviewed' } }
}
```

Uses existing specificity-based selection - more specific `match` wins.

### 4. Combined State + Request Matching

`match.state` can combine with existing request matching:

```typescript
// Reviewer can approve OR reject from 'pending_review' state
{
  method: 'POST',
  url: '/application/review',
  match: {
    state: { step: 'pending_review' },
    body: { decision: 'approve' }
  },
  response: { body: { status: 'approved' } },
  afterResponse: { setState: { step: 'approved' } }
},
{
  method: 'POST',
  url: '/application/review',
  match: {
    state: { step: 'pending_review' },
    body: { decision: 'reject' }
  },
  response: { body: { status: 'rejected' } },
  afterResponse: { setState: { step: 'rejected' } }
}
```

## TypeScript Types

```typescript
type StateCondition = {
  readonly when: Record<string, unknown>;
  readonly then: MockResponse;
};

type StatefulMockResponse = {
  readonly default: MockResponse;
  readonly conditions: ReadonlyArray<StateCondition>;
};

type StateAfterResponse = {
  readonly setState: Record<string, unknown>;
};

type MatchCriteria = {
  readonly headers?: Record<string, string | RegExp>;
  readonly body?: Record<string, unknown>;
  readonly query?: Record<string, string>;
  readonly state?: Record<string, unknown>; // NEW
};

type MockDefinition = {
  readonly method: HttpMethod;
  readonly url: string | RegExp;

  // Existing options (unchanged)
  readonly response?: MockResponse;
  readonly sequence?: SequenceConfig;
  readonly match?: MatchCriteria;

  // New options
  readonly stateResponse?: StatefulMockResponse;
  readonly afterResponse?: StateAfterResponse;
};
```

## Condition Matching Logic

Uses **specificity-based selection** (consistent with how `match` criteria work):

```typescript
const evaluateStateConditions = (
  conditions: ReadonlyArray<StateCondition>,
  state: Record<string, unknown>,
): MockResponse | null => {
  // Find all matching conditions
  const matches = conditions.filter((condition) =>
    Object.entries(condition.when).every(
      ([key, value]) => state[key] === value,
    ),
  );

  if (matches.length === 0) return null;

  // Sort by specificity (more keys = more specific)
  // Stable sort preserves original order as tiebreaker
  const sorted = [...matches].sort(
    (a, b) => Object.keys(b.when).length - Object.keys(a.when).length,
  );

  return sorted[0].then;
};
```

### Why Specificity-Based?

Order doesn't matter - most specific condition always wins:

```typescript
// Either order works
conditions: [
  { when: { step: "reviewed" }, then: { body: { status: "basic" } } },
  {
    when: { step: "reviewed", urgent: true },
    then: { body: { status: "urgent" } },
  },
];

// State { step: 'reviewed', urgent: true }
// → Matches both conditions
// → { step: 'reviewed', urgent: true } has 2 keys (more specific)
// → Returns 'urgent' ✓
```

### Tiebreaker

If two conditions have equal specificity, original order wins (first match):

```typescript
conditions: [
  { when: { step: "reviewed" }, then: { body: { variant: "A" } } }, // Wins (same specificity, first)
  { when: { urgent: true }, then: { body: { variant: "B" } } },
];
```

## State Scoping

State is scoped per test using the existing `x-scenarist-test-id` mechanism:

```typescript
// Internal state store
const testStates = new Map<string, Record<string, unknown>>();

// When handling request
const testId = req.headers["x-scenarist-test-id"];
const state = testStates.get(testId) ?? {};

// When mutating state
testStates.set(testId, { ...state, ...newState });

// When test ends (cleanup) or scenario switches
testStates.delete(testId);
```

## Request Handling Flow

```
Request comes in
    │
    ▼
Find matching mocks by method + URL
    │
    ▼
Filter by match criteria (including match.state)
    │
    ▼
Select most specific match (existing specificity rules)
    │
    ▼
Determine response:
    │
    ├─► If stateResponse: evaluate conditions against TestState
    │       Return matching condition's response, or default
    │
    ├─► If sequence: return next response in sequence
    │
    └─► If single response: return that response
    │
    ▼
After response sent:
    │
    └─► If afterResponse.setState: merge into TestState
    │
    ▼
Done
```

## State Reset Behavior

Per ADR-0005, test state should be reset:

- When switching scenarios
- When test ends (cleanup)

This ensures idempotent tests.

---

## Architecture: Where Code Lives

Following hexagonal architecture, **most logic lives in core**. Adapters are thin wrappers.

### Package Responsibilities

```
internal/core/                          ← MOST WORK HERE
├── src/ports/
│   └── test-state-store.ts             # Port interface
├── src/adapters/
│   └── in-memory-test-state-store.ts   # Default implementation
├── src/domain/
│   ├── state-condition-evaluator.ts    # Specificity-based matching
│   └── state-response-resolver.ts      # Resolve stateResponse → MockResponse
├── src/types/
│   └── state-aware-mocking.ts          # StateCondition, StatefulMockResponse, etc.
└── src/schemas/
    └── state-aware-mocking.ts          # Zod schemas for new properties

internal/msw-adapter/                   ← INTEGRATION
├── src/
│   └── handler-factory.ts              # Wire state into MSW handler creation
│   └── state-middleware.ts             # Read/write state during request handling

packages/express-adapter/               ← MINIMAL CHANGES
├── src/
│   └── index.ts                        # Expose state store, wire to core

packages/nextjs-adapter/                ← MINIMAL CHANGES
├── src/
│   └── app/index.ts                    # Expose state store, wire to core
│   └── pages/index.ts

packages/playwright-helpers/            ← STATE INSPECTION (optional)
├── src/
│   └── state-helpers.ts                # getState() for debugging
```

### Core Responsibilities

| Component                 | Responsibility                                                       |
| ------------------------- | -------------------------------------------------------------------- |
| `TestStateStore` port     | Interface for get/set/clear state by test ID                         |
| `InMemoryTestStateStore`  | Default implementation using `Map<string, Record<string, unknown>>`  |
| `evaluateStateConditions` | Specificity-based condition matching (pure function)                 |
| `resolveStateResponse`    | Given mock + state → return appropriate response                     |
| Types & Schemas           | `StateCondition`, `StatefulMockResponse`, `StateAfterResponse`, etc. |

### MSW Adapter Responsibilities

| Component         | Responsibility                                    |
| ----------------- | ------------------------------------------------- |
| Handler factory   | Inject state store, call core's resolver          |
| State middleware  | Extract test ID from headers, read/write state    |
| Reset integration | Clear state when scenario switches (per ADR-0005) |

### Framework Adapter Responsibilities

Minimal - just wire core and MSW adapter together:

| Component  | Responsibility                              |
| ---------- | ------------------------------------------- |
| Setup      | Pass state store to MSW adapter             |
| Expose API | Optional: expose `getState()` for debugging |

---

## Implementation Phases

> **Important Decisions:**
>
> - **No backward compatibility concerns** - no real consumers yet
> - **Extend existing StateManager** - not a new TestStateStore port (simpler, less confusing)
> - **Property-based tests** - use fast-check where invariants can be expressed

### Phase 1: Core Foundation (TDD) ✅ COMPLETE

1. **Types & Schemas** ✅
   - `StateConditionSchema`, `StatefulMockResponseSchema`, `StateAfterResponseSchema`
   - `StateMatchCriteriaSchema` added to `ScenaristMatchSchema`
   - Zod schemas with validation
   - Extracted `ScenaristResponseSchema` to `response.ts` to avoid circular dependencies

2. **StateManager.merge() Method** ✅
   - Extended existing `StateManager` port with `merge(testId, partial)` method
   - `InMemoryStateManager` implementation with prototype pollution protection
   - 8 behavior tests

3. **State Condition Evaluator** ✅
   - `createStateConditionEvaluator()` → `StateConditionEvaluator`
   - Specificity-based selection (most specific condition wins)
   - Deep equality for objects/arrays
   - **Property-based tests** verify invariants:
     - Most specific matching condition always wins
     - Condition matches iff all keys match
     - Result is from conditions array or undefined

4. **State Response Resolver** ✅
   - `createStateResponseResolver()` → `StateResponseResolver`
   - Resolves `stateResponse` → matching condition or default

5. **Mock Schema Updates** ✅
   - Added `stateResponse` and `afterResponse` fields to `ScenaristMockSchema`
   - Mutual exclusion refinement: at most one of response/sequence/stateResponse
   - `afterResponse` can combine with any response type

### Phase 2: Response-Selector Integration ✅ COMPLETE

6. **match.state Integration** ✅
   - Added state matching to `matchesCriteria` function
   - State keys included in specificity calculation
   - Deep equality check for state values (handles primitives, objects, arrays)
   - 13 tests covering state matching scenarios

7. **stateResponse Resolution** ✅
   - Integrated `StateResponseResolver` into `selectResponseFromMock`
   - Handles `stateResponse` alongside `response` and `sequence`
   - Returns default response when no conditions match or no stateManager
   - 8 tests covering stateResponse scenarios

8. **afterResponse.setState Integration** ✅
   - Calls `stateManager.merge()` after response is returned
   - Works with all three response types (response/sequence/stateResponse)
   - Enables state machine patterns with match.state + afterResponse
   - 8 tests including full state machine demo

### Phase 3: Adapter Wiring

9. **MSW Adapter**
   - Wire StateManager into handler creation
   - Ensure test ID flows through request handling

10. **Express Adapter**
    - Wire state store through setup
    - Verify E2E flow works

11. **Next.js Adapters**
    - Wire state store for App Router
    - Wire state store for Pages Router

### Phase 4: Example Apps (Proof)

12. **Express Example App**
    - Add scenario using state-aware mocking
    - Playwright test proving it works

13. **Next.js Example Apps**
    - Add scenarios to both App Router and Pages Router examples
    - Playwright tests proving it works

---

## Test Strategy

**All functionality is tested at ALL levels.** Each level serves a different purpose and catches different issues. Example app tests are particularly important - they prove features work with real frameworks and expose framework-specific idiosyncrasies.

### Level 1: Core Tests (`internal/core/src/**/*.test.ts`)

**Purpose**: Test pure domain logic in isolation
**Why**: Fast, deterministic, no framework dependencies

| Feature                   | Tests                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `evaluateStateConditions` | Default when no match, matching condition, specificity selection, tiebreaker ordering, empty conditions |
| `InMemoryTestStateStore`  | Get/set/merge/clear by test ID, isolation between test IDs, empty state for unknown ID                  |
| `resolveStateResponse`    | stateResponse.default, matching condition, fallback to response, fallback to sequence                   |
| `match.state` filtering   | State-based mock selection, combined with other match criteria, specificity calculation                 |
| Types & Schemas           | Validation of all new types, error messages for invalid input                                           |

```typescript
// state-condition-evaluator.test.ts
describe('evaluateStateConditions', () => {
  it('should return null when no conditions match', () => {...});
  it('should return matching condition response', () => {...});
  it('should select most specific condition (more keys wins)', () => {...});
  it('should use original order as tiebreaker for equal specificity', () => {...});
  it('should return null for empty conditions array', () => {...});
  it('should match partial state (subset matching)', () => {...});
});

// in-memory-test-state-store.test.ts
describe('InMemoryTestStateStore', () => {
  it('should return empty object for unknown test ID', () => {...});
  it('should store and retrieve state by test ID', () => {...});
  it('should merge partial state updates immutably', () => {...});
  it('should isolate state between different test IDs', () => {...});
  it('should clear state for specific test ID', () => {...});
  it('should clear all state', () => {...});
});
```

### Level 2: MSW Adapter Tests (`internal/msw-adapter/src/**/*.test.ts`)

**Purpose**: Test integration with MSW request handling
**Why**: Proves state flows correctly through MSW handlers

| Feature                  | Tests                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `stateResponse`          | Evaluates conditions against current state, returns default, returns matching condition |
| `afterResponse.setState` | Merges state after response, state persists for subsequent requests                     |
| `match.state`            | Filters mocks by state, integrates with existing match criteria                         |
| State lifecycle          | State reset on scenario switch, state cleared on test end                               |
| Test ID extraction       | Reads `x-scenarist-test-id` header, isolates concurrent tests                           |

```typescript
// handler-factory.test.ts
describe('createHandler with state-aware mocking', () => {
  describe('stateResponse', () => {
    it('should return default when state is empty', () => {...});
    it('should return default when no conditions match', () => {...});
    it('should return matching condition based on current state', () => {...});
    it('should select most specific condition', () => {...});
  });

  describe('afterResponse.setState', () => {
    it('should merge state after returning response', () => {...});
    it('should persist state for subsequent requests', () => {...});
    it('should not affect other test IDs', () => {...});
  });

  describe('match.state', () => {
    it('should select mock based on current state', () => {...});
    it('should combine state matching with body matching', () => {...});
    it('should combine state matching with header matching', () => {...});
    it('should fall back to less specific mock when state does not match', () => {...});
  });

  describe('state lifecycle', () => {
    it('should clear state when scenario switches', () => {...});
    it('should isolate state by test ID header', () => {...});
  });
});
```

### Level 3: Framework Adapter Tests (`packages/*/src/**/*.test.ts`)

**Purpose**: Test integration with real Express/Next.js
**Why**: Proves wiring is correct, catches framework-specific issues

| Feature                  | Tests (repeated for Express, Next.js App Router, Next.js Pages Router) |
| ------------------------ | ---------------------------------------------------------------------- |
| `stateResponse`          | Works through full request cycle                                       |
| `afterResponse.setState` | State persists across requests                                         |
| `match.state`            | Mock selection works with framework routing                            |
| Concurrent tests         | Test ID isolation works with framework's request handling              |

```typescript
// packages/express-adapter - state-aware-mocking.test.ts
describe('Express adapter state-aware mocking', () => {
  describe('stateResponse', () => {
    it('should return default when state is empty', () => {...});
    it('should return matching condition based on state', () => {...});
    it('should select most specific condition', () => {...});
  });

  describe('afterResponse.setState', () => {
    it('should update state after POST request', () => {...});
    it('should reflect updated state in subsequent GET requests', () => {...});
  });

  describe('match.state', () => {
    it('should select different mock based on current state', () => {...});
    it('should support multiple transitions on same endpoint', () => {...});
  });

  describe('concurrent test isolation', () => {
    it('should isolate state between different test IDs', () => {...});
  });
});

// packages/nextjs-adapter - app/state-aware-mocking.test.ts (similar)
// packages/nextjs-adapter - pages/state-aware-mocking.test.ts (similar)
```

### Level 4: Example App Tests (`apps/*/e2e/*.spec.ts`)

**Purpose**: Full E2E tests with Playwright proving real-world scenarios work
**Why**: Catches framework idiosyncrasies, proves feature works in realistic conditions

**Critical**: These are NOT just "smoke tests" - they test ALL functionality with real frameworks. Framework-specific quirks are often only discovered at this level.

| Feature                  | Tests (repeated for Express, Next.js App Router, Next.js Pages Router) |
| ------------------------ | ---------------------------------------------------------------------- |
| `stateResponse`          | UI reflects state-dependent responses                                  |
| `afterResponse.setState` | Form submission changes subsequent page content                        |
| `match.state`            | Multi-step workflows with same-endpoint transitions                    |
| Real-world scenario      | Full loan application / checkout / auth flow                           |

```typescript
// apps/express-example/e2e/state-aware-mocking.spec.ts
test.describe("State-Aware Mocking", () => {
  test.describe("stateResponse", () => {
    test("should return default response when state is empty", async ({
      page,
    }) => {
      await setScenario(page, "state-aware-default");
      await page.goto("/application/123");
      await expect(page.getByText("Application Started")).toBeVisible();
    });

    test("should return condition response when state matches", async ({
      page,
    }) => {
      await setScenario(page, "state-aware-with-initial-state");
      await page.goto("/application/123");
      await expect(page.getByText("Quote Declined")).toBeVisible();
    });
  });

  test.describe("afterResponse.setState", () => {
    test("should update state after form submission", async ({ page }) => {
      await setScenario(page, "ineligible-journey");

      // Initial state
      await page.goto("/application/123");
      await expect(page.getByText("Application Started")).toBeVisible();

      // Submit triggers state change
      await page.click('button[type="submit"]');

      // Subsequent requests reflect new state
      await page.goto("/application/123");
      await expect(page.getByText("Quote Declined")).toBeVisible();
    });
  });

  test.describe("match.state", () => {
    test("should support multiple transitions on same endpoint", async ({
      page,
    }) => {
      await setScenario(page, "approval-workflow");

      // Initial → Reviewed
      await page.goto("/application/123");
      await page.click('[data-action="review"]');
      await expect(page.getByText("Pending Approval")).toBeVisible();

      // Reviewed → Approved (same endpoint, different transition)
      await page.click('[data-action="review"]');
      await expect(page.getByText("Approved")).toBeVisible();
    });
  });

  test.describe("concurrent test isolation", () => {
    test("should isolate state between parallel tests", async ({
      page,
      context,
    }) => {
      // Test that different test IDs don't interfere
      // This is critical for parallel test execution
    });
  });

  test.describe("real-world scenarios", () => {
    test("loan application with variable GET call counts", async ({ page }) => {
      // This is THE scenario that motivated this feature
      // Proves we don't need magic numbers for call counts
    });
  });
});

// apps/nextjs-app-router-example/e2e/state-aware-mocking.spec.ts (similar)
// apps/nextjs-pages-router-example/e2e/state-aware-mocking.spec.ts (similar)
```

### Test Coverage Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      ALL LEVELS TEST ALL FEATURES               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Example Apps (Playwright)                                 │  │
│  │ - Real frameworks (Express, Next.js App/Pages)           │  │
│  │ - Catches framework idiosyncrasies                       │  │
│  │ - Full user journeys                                     │  │
│  │ - Tests: stateResponse, afterResponse, match.state, etc. │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Framework Adapters (Express, Next.js)                    │  │
│  │ - Real Express/Next.js request handling                  │  │
│  │ - Proves wiring is correct                               │  │
│  │ - Tests: stateResponse, afterResponse, match.state, etc. │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ MSW Adapter                                              │  │
│  │ - Real MSW handlers                                      │  │
│  │ - Tests state flow through request cycle                 │  │
│  │ - Tests: stateResponse, afterResponse, match.state, etc. │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Core                                                     │  │
│  │ - Pure functions, no dependencies                        │  │
│  │ - Fast, deterministic                                    │  │
│  │ - Tests: stateResponse, afterResponse, match.state, etc. │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why test everything at every level?**

1. **Core**: Fast feedback, easy to debug, tests pure logic
2. **MSW Adapter**: Catches MSW-specific issues
3. **Framework Adapters**: Catches Express/Next.js-specific issues
4. **Example Apps**: Catches real-world issues, framework quirks, proves it actually works

---

## Complete Examples

### Example 1: Loan Application Journey

```typescript
const ineligibleScenario = {
  id: "ineligible-journey",
  mocks: [
    {
      method: "GET",
      url: "/applications/:id",
      stateResponse: {
        default: {
          status: 200,
          body: createApplication({ state: "appStarted" }),
        },
        conditions: [
          {
            when: { workflowStep: "eligibility-checked" },
            then: {
              status: 200,
              body: createApplication({ state: "quoteDecline" }),
            },
          },
        ],
      },
    },
    {
      method: "POST",
      url: "/applications/:id/eligibility",
      response: {
        status: 200,
        body: { state: "quoteDecline" },
      },
      afterResponse: {
        setState: { workflowStep: "eligibility-checked" },
      },
    },
  ],
};
```

### Example 2: Multi-Step Approval Workflow

```typescript
const approvalWorkflow = {
  id: "approval-workflow",
  mocks: [
    // GET - responds based on current state
    {
      method: "GET",
      url: "/application",
      stateResponse: {
        default: { body: { status: "pending_review" } },
        conditions: [
          {
            when: { step: "reviewed" },
            then: { body: { status: "pending_approval" } },
          },
          {
            when: { step: "approved" },
            then: { body: { status: "complete" } },
          },
          {
            when: { step: "rejected" },
            then: { body: { status: "declined" } },
          },
        ],
      },
    },

    // POST /review from initial → reviewed
    {
      method: "POST",
      url: "/review",
      match: { state: { step: "initial" } },
      response: { body: { ok: true, newStatus: "pending_approval" } },
      afterResponse: { setState: { step: "reviewed" } },
    },

    // POST /review from reviewed → approved
    {
      method: "POST",
      url: "/review",
      match: { state: { step: "reviewed" } },
      response: { body: { ok: true, newStatus: "complete" } },
      afterResponse: { setState: { step: "approved" } },
    },

    // POST /review fallback (no state) → reviewed
    {
      method: "POST",
      url: "/review",
      response: { body: { ok: true, newStatus: "pending_approval" } },
      afterResponse: { setState: { step: "reviewed" } },
    },
  ],
};
```

### Example 3: Shopping Cart

```typescript
const checkoutFlow = {
  id: "checkout-flow",
  mocks: [
    {
      method: "GET",
      url: "/cart",
      stateResponse: {
        default: { body: { items: [], total: 0 } },
        conditions: [
          {
            when: { cartItems: "hasItems" },
            then: { body: { items: [{ id: 1, name: "Widget" }], total: 9.99 } },
          },
        ],
      },
    },
    {
      method: "POST",
      url: "/cart/items",
      response: { status: 201 },
      afterResponse: { setState: { cartItems: "hasItems" } },
    },
  ],
};
```

### Example 4: Authentication Flow

```typescript
const loginFlow = {
  id: "login-flow",
  mocks: [
    {
      method: "GET",
      url: "/me",
      stateResponse: {
        default: { status: 401 },
        conditions: [
          {
            when: { authenticated: true },
            then: { status: 200, body: { user: "test@example.com" } },
          },
        ],
      },
    },
    {
      method: "POST",
      url: "/login",
      response: { body: { token: "abc123" } },
      afterResponse: { setState: { authenticated: true } },
    },
  ],
};
```

## Future Enhancements

### Schema-Based State Typing (Issue #305)

```typescript
import { z } from 'zod';

const stateSchema = z.object({
  step: z.enum(['initial', 'reviewed', 'approved', 'rejected']),
  eligibilityChecked: z.boolean(),
});

const scenario = defineStatefulScenario({
  id: 'workflow',
  stateSchema,
  initialState: { step: 'initial', eligibilityChecked: false },
  mocks: [...]
});
```

### Event-Based State (Issue #304)

```typescript
{
  method: 'POST',
  url: '/eligibility',
  response: { body: { state: 'quoteDecline' } },
  emitsEvent: 'eligibility-checked'
},
{
  method: 'GET',
  url: '/applications/:id',
  response: { body: { state: 'appStarted' } },
  afterEvent: {
    event: 'eligibility-checked',
    response: { body: { state: 'quoteDecline' } }
  }
}
```

### Initial State per Scenario

```typescript
{
  id: 'halfway-through',
  initialState: { step: 'reviewed', eligibilityChecked: true },
  mocks: [...]
}
```

### State Inspection API

```typescript
// For debugging in Playwright tests
const state = await scenarist.getState(page);
console.log(state); // { workflowStep: 'eligibility-checked' }
```

## Declarative Philosophy

State conditions must be declarative data, not functions (per ADR-0013):

```typescript
// ✅ CORRECT - Declarative pattern matching
conditions: [
  {
    when: { workflowStep: "checked" },
    then: { body: { state: "quoteDecline" } },
  },
];

// ❌ WRONG - Imperative function (violates ADR-0013)
responseFromState: (state) => {
  if (state.workflowStep === "checked")
    return { body: { state: "quoteDecline" } };
  return { body: { state: "appStarted" } };
};
```

The `when` clause is a partial match object:

- Can be serialized (JSON.stringify works)
- Can be inspected (test tooling can analyze conditions)
- Can be composed (multiple conditions evaluated in order)
- No closures, no hidden logic
