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
