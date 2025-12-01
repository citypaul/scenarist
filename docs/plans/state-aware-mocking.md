# Scenarist Enhancement Proposal: State-Aware Mocking

## Problem Statement

When testing applications with **stateless backend architectures**, Scenarist's sequence-based mocking becomes fragile because it requires knowing the exact number of API calls in advance.

### The Scenario

A loan application journey where:

1. Frontend makes multiple GET requests to fetch application data
2. User submits a form (POST /eligibility)
3. Backend processes the submission and changes application state
4. Frontend makes GET requests to determine what to show next

```
Timeline:
─────────────────────────────────────────────────────────────────────────────►
│                                    │                                       │
│  GET /applications (×10)           │ POST /eligibility                     │ GET /applications (×2)
│  All return: { state: 'appStarted' }│ Returns: { state: 'quoteDecline' }    │ Should return: { state: 'quoteDecline' }
│                                    │                                       │
│◄────── Before state change ───────►│◄─── State changes here ──────────────►│
```

### Why This Is Hard

The **real API** behaves like this:

- GET /applications returns current state from database
- POST /eligibility mutates state in database
- Subsequent GET /applications returns the NEW state

With **sequence-based mocking**, we have to pre-define responses in order:

```typescript
sequence: {
  responses: [
    { body: { state: "appStarted" } }, // Call 1
    { body: { state: "appStarted" } }, // Call 2
    // ... how many more?
    { body: { state: "quoteDecline" } }, // Call N+1
  ];
}
```

The problem: **we don't know N**. It depends on:

- React re-renders (unpredictable)
- Middleware that fetches state before processing requests
- Race conditions in async operations

### Real-World Example from Plum BFF

The Plum BFF has a "stateless" architecture where every endpoint independently fetches fresh application state:

```typescript
// user-details.ts
router.get("/user-details/:applicationId", async (req, res) => {
  const { data } = await acquisitionsApiClient.getApplication(
    req.params.applicationId,
  );
  // Use application data...
});

// affordability.ts
router.get("/affordability/:applicationId", async (req, res) => {
  const { data } = await acquisitionsApiClient.getApplication(
    req.params.applicationId,
  );
  // Use application data...
});

// loan-offer.ts
router.get("/loan-offer/:applicationId", async (req, res) => {
  const { data } = await acquisitionsApiClient.getApplication(
    req.params.applicationId,
  );
  // Use application data...
});

// Plus middleware that ALSO calls GET /applications:
const whiteListRequestBasedOnStates =
  (allowedStates) => async (req, res, next) => {
    const { data } = await acquisitionsApiClient.getApplication(
      req.params.applicationId,
    );
    if (allowedStates.includes(data.state)) {
      return next();
    }
    throw new ForbiddenError();
  };
```

Each browser action triggers multiple BFF calls, and each BFF call triggers GET /applications to the external API. The exact count varies based on React's rendering behavior.

### Current Workaround

Trial-and-error to find the magic number:

```typescript
// Ineligible scenario - needs exactly 11 appStarted before quoteDecline
sequence: {
  responses: [
    ...Array(11).fill(null).map(() => ({
      body: { state: 'appStarted' }
    })),
    { body: { state: 'quoteDecline' } },
  ],
  repeat: 'last'
}
```

**Problems with this approach:**

1. Fragile - any change to React components can break it
2. Non-obvious - why 11? Not documented anywhere in the app
3. Maintenance burden - must update magic number when app changes
4. Different per scenario - each journey has different call patterns

---

## Proposed Solution: State-Aware Mocking

### Core Concept

Allow mock definitions to **mutate shared state** that other mocks can **read from** to determine their response.

```typescript
// Conceptual model
TestState = {
  // Empty at test start
};

// When POST /eligibility is intercepted:
TestState = {
  applicationState: "quoteDecline", // Mutation happened
};

// When GET /applications is intercepted:
// Check TestState, return appropriate response
```

### Proposed API

#### Option A: Explicit State Mutation

```typescript
const scenario = {
  id: "ineligible",
  mocks: [
    // GET /applications - returns response based on current state
    {
      method: "GET",
      url: "/v2/applications/:applicationId",
      stateResponse: {
        // Default response when no state conditions match
        default: {
          status: 200,
          body: { state: "appStarted", subState: null },
        },
        // Conditional responses based on state
        conditions: [
          {
            when: { applicationState: "quoteDecline" },
            then: {
              status: 200,
              body: { state: "quoteDecline", subState: null },
            },
          },
        ],
      },
    },

    // POST /eligibility - returns response AND mutates state
    {
      method: "POST",
      url: "/v2/applications/:applicationId/eligibility",
      response: {
        status: 200,
        body: { state: "quoteDecline", subState: null },
      },
      // After returning response, update test state
      afterResponse: {
        setState: { applicationState: "quoteDecline" },
      },
    },
  ],
};
```

#### Option B: Declarative State Transitions

```typescript
const scenario = {
  id: "ineligible",

  // Define state machine for this scenario
  initialState: {
    applicationState: "appStarted",
  },

  mocks: [
    // GET /applications - reads from state
    {
      method: "GET",
      url: "/v2/applications/:applicationId",
      responseFromState: (state) => ({
        status: 200,
        body: {
          state: state.applicationState,
          subState: state.applicationSubState ?? null,
        },
      }),
    },

    // POST /eligibility - triggers state transition
    {
      method: "POST",
      url: "/v2/applications/:applicationId/eligibility",
      response: {
        status: 200,
        body: { state: "quoteDecline" },
      },
      transitionsTo: {
        applicationState: "quoteDecline",
      },
    },
  ],
};
```

#### Option C: Event-Based State (Most Flexible)

```typescript
const scenario = {
  id: "ineligible",

  mocks: [
    // GET responds based on whether 'eligibility-checked' event occurred
    {
      method: "GET",
      url: "/v2/applications/:applicationId",
      response: {
        status: 200,
        body: { state: "appStarted" },
      },
      // Override response if event has occurred
      afterEvent: {
        event: "eligibility-checked",
        response: {
          status: 200,
          body: { state: "quoteDecline" },
        },
      },
    },

    // POST emits event when matched
    {
      method: "POST",
      url: "/v2/applications/:applicationId/eligibility",
      response: {
        status: 200,
        body: { state: "quoteDecline" },
      },
      emitsEvent: "eligibility-checked",
    },
  ],
};
```

---

## How It Would Work Internally

### Scenarist's Request Handling Flow (Current)

```
Request comes in
    │
    ▼
Find matching mock by method + URL
    │
    ▼
If sequence: return next response in sequence
If single response: return that response
    │
    ▼
Done
```

### Scenarist's Request Handling Flow (With State)

```
Request comes in
    │
    ▼
Find matching mock by method + URL
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
    ├─► If afterResponse.setState: merge into TestState
    │
    └─► If emitsEvent: add event to TestState.events
    │
    ▼
Done
```

### State Scoping

State must be **scoped per test** (using `x-scenarist-test-id`):

```typescript
// Internal state store
const testStates = new Map<string, Record<string, unknown>>();

// When handling request
const testId = req.headers["x-scenarist-test-id"];
const state = testStates.get(testId) ?? {};

// When mutating state
testStates.set(testId, { ...state, ...newState });

// When test ends (cleanup)
testStates.delete(testId);
```

---

## Comparison with Existing Features

### Sequences (Current)

```typescript
// Good for: Known, fixed number of calls
// Bad for: Variable call counts, state-dependent responses
sequence: {
  responses: [
    { body: { status: 'pending' } },
    { body: { status: 'complete' } }
  ],
  repeat: 'last'
}
```

### State-Aware (Proposed)

```typescript
// Good for: State transitions triggered by mutations
// Bad for: Nothing - strictly more powerful
stateResponse: {
  default: { body: { status: 'pending' } },
  conditions: [
    { when: { processed: true }, then: { body: { status: 'complete' } } }
  ]
}
```

### Can They Coexist?

Yes. Sequences are still useful for:

- Polling scenarios (status goes pending → processing → complete)
- Retry testing (fail twice, succeed on third try)
- Rate limiting simulation

State-aware is better for:

- Form submissions that change application state
- Multi-step wizards where navigation depends on completed steps
- Any scenario where "thing A happens, then thing B returns different data"

---

## Real-World Scenarios This Enables

### 1. Loan Application (Current Problem)

```typescript
{
  id: 'ineligible-journey',
  mocks: [
    {
      method: 'GET',
      url: '/applications/:id',
      stateResponse: {
        default: { body: createApp({ state: 'appStarted' }) },
        conditions: [
          { when: { eligibilityChecked: true },
            then: { body: createApp({ state: 'quoteDecline' }) } }
        ]
      }
    },
    {
      method: 'POST',
      url: '/applications/:id/eligibility',
      response: { body: { state: 'quoteDecline' } },
      afterResponse: { setState: { eligibilityChecked: true } }
    }
  ]
}
```

### 2. Shopping Cart

```typescript
{
  id: 'checkout-flow',
  mocks: [
    {
      method: 'GET',
      url: '/cart',
      stateResponse: {
        default: { body: { items: [], total: 0 } },
        conditions: [
          { when: { cartItems: 'hasItems' },
            then: { body: { items: [{ id: 1, name: 'Widget' }], total: 9.99 } } }
        ]
      }
    },
    {
      method: 'POST',
      url: '/cart/items',
      response: { status: 201 },
      afterResponse: { setState: { cartItems: 'hasItems' } }
    }
  ]
}
```

### 3. Authentication Flow

```typescript
{
  id: 'login-flow',
  mocks: [
    {
      method: 'GET',
      url: '/me',
      stateResponse: {
        default: { status: 401 },
        conditions: [
          { when: { authenticated: true },
            then: { status: 200, body: { user: 'test@example.com' } } }
        ]
      }
    },
    {
      method: 'POST',
      url: '/login',
      response: { body: { token: 'abc123' } },
      afterResponse: { setState: { authenticated: true } }
    }
  ]
}
```

---

## Implementation Considerations

### TypeScript Types

```typescript
type StateCondition = {
  when: Record<string, unknown>; // Partial match against state
  then: MockResponse;
};

type StatefulMockResponse = {
  default: MockResponse;
  conditions: StateCondition[];
};

type StateAfterResponse = {
  setState: Record<string, unknown>; // Merged into test state
};

type MockDefinition = {
  method: HttpMethod;
  url: string | RegExp;

  // Existing options
  response?: MockResponse;
  sequence?: SequenceConfig;

  // New options
  stateResponse?: StatefulMockResponse;
  afterResponse?: StateAfterResponse;
};
```

### Matching Logic

```typescript
const evaluateStateConditions = (
  conditions: StateCondition[],
  state: Record<string, unknown>,
): MockResponse | null => {
  for (const condition of conditions) {
    const matches = Object.entries(condition.when).every(
      ([key, value]) => state[key] === value,
    );
    if (matches) {
      return condition.then;
    }
  }
  return null;
};
```

### Backward Compatibility

This is purely additive:

- Existing `response` and `sequence` continue to work unchanged
- New `stateResponse` and `afterResponse` are optional
- No breaking changes to existing scenarios

---

## Questions for Discussion

1. **Naming**: Is `stateResponse` / `afterResponse` clear? Alternatives:
   - `conditionalResponse` / `mutateState`
   - `respondByState` / `updateState`
   - `dynamicResponse` / `sideEffect`

2. **State shape**: Should state be typed per-scenario, or remain `Record<string, unknown>`?

3. **State inspection**: Should there be a way to inspect current state in Playwright for debugging?

   ```typescript
   const state = await scenarist.getState(page);
   console.log(state); // { eligibilityChecked: true }
   ```

4. **State initialization**: Should scenarios be able to define initial state?

   ```typescript
   {
     id: 'halfway-through',
     initialState: { step1Complete: true, step2Complete: true },
     mocks: [...]
   }
   ```

5. **Complex conditions**: Should conditions support operators beyond equality?
   ```typescript
   { when: { attempts: { $gt: 3 } }, then: { status: 429 } }
   ```

---

## Summary

**The Problem**: Sequence-based mocking requires knowing exact API call counts, which is fragile when:

- Backend is stateless (multiple endpoints fetch same data)
- Frontend has unpredictable re-render patterns
- Middleware makes additional API calls

**The Solution**: State-aware mocking where:

- POST/PUT/DELETE responses can mutate a per-test state object
- GET responses can be conditional based on that state
- Tests become resilient to call count variations

**The Benefit**: Tests express **what should happen** (POST changes state, subsequent GETs reflect that) rather than **how many times it happens** (exactly 11 GETs before the POST).
