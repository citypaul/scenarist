# ADR-0015: Response Sequences Over Referer-Based Routing

**Status**: Accepted
**Date**: 2025-11-14
**Authors**: Claude Code

## Context

During analysis of Acquisition.Web's testing patterns (PR #88), we identified a critical architectural pattern: **48 out of 64 tests navigate multi-page journeys that call the same endpoint multiple times with different expected responses**.

**Example Journey (Acquisition.Web):**

```
User Journey: Apply for Credit Card

Page 1: /apply/quote → GET /applications/:id → { state: 'quoteAccept' }
Page 2: /apply/sign → GET /applications/:id → { state: 'appComplete' }
Page 3: /apply/penny-drop → GET /applications/:id → { state: 'appComplete' }
```

The endpoint `GET /applications/:id` is called **3 times** during a single test, but needs to return **different responses** depending on which page made the request.

### Acquisition.Web's Solution: Referer-Based Routing

Acquisition.Web solves this by inspecting the HTTP referer header:

```typescript
// mocks/scenarios/onlineJourneyLogin.ts (Acquisition.Web)
http.get('/v2/api/applications/:id', async ({ request }) => {
  const referer = request.headers.get('referer') || '';

  // Route based on which page sent the request
  if (referer.includes('/apply-sign') || referer.includes('/penny-drop')) {
    return HttpResponse.json({ state: 'appComplete' }); // Pages 2-3
  }

  return HttpResponse.json({ state: 'quoteAccept' }); // Page 1 (default)
});
```

**This pattern is used in 48 out of 64 tests** (75% of test suite).

### Problems with Referer-Based Routing

**1. Implicit and Brittle:**
- Relies on browser behavior (referer header may not be sent in all contexts)
- Couples mock behavior to URL structure (changing route breaks mocks)
- String matching on referer is fragile (`includes('/apply-sign')`)
- Non-obvious: must read mock code to understand journey progression

**2. Framework-Coupled:**
- Depends on Next.js/Remix routing conventions
- Won't work with SPA navigation (referer doesn't change within app)
- Framework migrations require rewriting all mocks

**3. Hard to Test Independently:**
- Can't test "what happens at step 2" without navigating pages 1 → 2
- Can't reorder pages without breaking mocks
- Journey order baked into referer checks

**4. Maintenance Burden:**
- Adding a new page requires updating all referer checks
- Renaming routes breaks mocks silently
- Duplicated referer logic across multiple mocks

**5. Not Self-Documenting:**
- Journey progression hidden in referer conditionals
- Can't easily see "this is step 1 of 3"
- Requires domain knowledge (which pages exist, what order)

### Scenarist's Solution: Response Sequences (Phase 2)

Scenarist already has a feature designed exactly for this use case: **Response Sequences** (implemented in Phase 2, PR #25).

**Same journey with sequences:**

```typescript
{
  method: 'GET',
  url: '/applications/:id',
  sequence: {
    responses: [
      { status: 200, body: { state: 'quoteAccept' } },   // Page 1
      { status: 200, body: { state: 'appComplete' } },   // Page 2
      { status: 200, body: { state: 'appComplete' } },   // Page 3
    ],
    repeat: 'last' // Stay at 'appComplete' after step 3
  }
}
```

**Advantages over referer routing:**

1. **Explicit Progression** - Sequence reads like specification: "First quoteAccept, then appComplete"
2. **Framework Agnostic** - No dependency on Next.js/Remix routing or referer headers
3. **Self-Documenting** - Array structure shows "this is step 1 of 3"
4. **Testable Independently** - Can test "advance to step 2" without navigation
5. **Maintainable** - Add/remove pages without changing mock logic
6. **No Coupling** - Journey order independent of URL structure

## Problem

**How can we support multi-page journeys with progressive state while:**
1. Avoiding brittle referer-based routing hacks
2. Remaining framework-agnostic (Next.js, Remix, SPA)
3. Making journey progression explicit and self-documenting
4. Enabling independent testing of journey steps
5. Keeping mocks maintainable as routes change

**Requirements:**
- ✅ Same endpoint returns different responses per stage
- ✅ Progression explicit (not inferred from headers)
- ✅ Works across all frameworks (no Next.js/Remix coupling)
- ✅ Journey readable from mock definition
- ✅ Testable independently of navigation order

## Decision

We will **use Scenarist's Response Sequences feature (Phase 2) for multi-page journeys** instead of referer-based routing hacks.

**The Pattern:**

```typescript
// Acquisition.Web pattern (referer routing) ❌
{
  method: 'GET',
  url: '/applications/:id',
  response: async ({ request }) => {
    const referer = request.headers.get('referer') || '';

    if (referer.includes('/apply-sign') || referer.includes('/penny-drop')) {
      return { state: 'appComplete' };
    }

    return { state: 'quoteAccept' };
  }
}

// Scenarist pattern (sequences) ✅
{
  method: 'GET',
  url: '/applications/:id',
  sequence: {
    responses: [
      { status: 200, body: { state: 'quoteAccept' } },   // First call
      { status: 200, body: { state: 'appComplete' } },   // Second call
      { status: 200, body: { state: 'appComplete' } },   // Third+ calls
    ],
    repeat: 'last' // Stay at final state
  }
}
```

### How It Works

**Sequence Advancement:**

1. Test navigates to Page 1 (`/apply/quote`)
2. Page 1 fetches `GET /applications/123`
3. **First call** → Sequence position 0 → Returns `{ state: 'quoteAccept' }`
4. Sequence advances to position 1

5. Test navigates to Page 2 (`/apply/sign`)
6. Page 2 fetches `GET /applications/123`
7. **Second call** → Sequence position 1 → Returns `{ state: 'appComplete' }`
8. Sequence advances to position 2

9. Test navigates to Page 3 (`/apply/penny-drop`)
10. Page 3 fetches `GET /applications/123`
11. **Third call** → Sequence position 2 → Returns `{ state: 'appComplete' }`
12. Sequence stays at position 2 (`repeat: 'last'`)

**Key Properties:**
- ✅ No referer inspection
- ✅ No URL string matching
- ✅ No framework-specific logic
- ✅ Journey progression explicit in array
- ✅ Works regardless of route structure

### Repeat Modes

**last (most common for journeys):**
```typescript
repeat: 'last' // Stay at final state after reaching end
```

Use for: Terminal states (application complete, payment succeeded)

**cycle (polling scenarios):**
```typescript
repeat: 'cycle' // Loop back to start after reaching end
```

Use for: Repeating patterns (weather cycle, status rotation)

**none (rate limiting):**
```typescript
repeat: 'none' // Return error after sequence exhausted
```

Use for: Limited attempts (payment retry limit, API quota)

### Integration with Phase 1 (Request Matching)

Sequences can be combined with match criteria for conditional progression:

```typescript
{
  method: 'GET',
  url: '/applications/:id',
  match: {
    headers: { 'x-user-tier': 'premium' } // Only for premium users
  },
  sequence: {
    responses: [
      { status: 200, body: { state: 'quoteAccept', tier: 'premium' } },
      { status: 200, body: { state: 'appComplete', tier: 'premium' } },
    ],
    repeat: 'last'
  }
}
```

**Behavior:** Non-matching requests (standard tier) skip this mock, don't advance sequence.

## Alternatives Considered

### Alternative 1: Referer-Based Routing (Acquisition.Web Pattern)

**Decision**: Rejected - brittle, framework-coupled, not self-documenting

See "Problems with Referer-Based Routing" section above for detailed analysis.

### Alternative 2: Mid-Test Scenario Switching

**Pattern:**
```typescript
test('multi-page journey', async () => {
  // Page 1
  await switchScenario('quote-accept-scenario');
  await page.goto('/apply/quote');
  await expect(page.getByText('Accept Quote')).toBeVisible();

  // Page 2
  await switchScenario('app-complete-scenario'); // Switch mid-test
  await page.goto('/apply/sign');
  await expect(page.getByText('Complete')).toBeVisible();
});
```

**Pros:**
- ✅ Explicit scenario per stage
- ✅ No referer routing needed

**Cons:**
- ❌ Verbose (switch before every navigation)
- ❌ Tests should set scenario once, not repeatedly
- ❌ Violates "scenario = test context" principle
- ❌ Harder to maintain (many scenario definitions)
- ❌ Doesn't match mental model (journey is single scenario)

**Decision**: Rejected - violates Scenarist's "set scenario once" principle

### Alternative 3: Custom Header for Stage Tracking

**Pattern:**
```typescript
test('multi-page journey', async () => {
  await page.goto('/apply/quote');
  await page.setExtraHTTPHeaders({ 'x-journey-stage': '1' });
  // ... navigate ...

  await page.goto('/apply/sign');
  await page.setExtraHTTPHeaders({ 'x-journey-stage': '2' }); // Update header
  // ... navigate ...
});

// Mock checks header:
{
  method: 'GET',
  url: '/applications/:id',
  response: ({ request }) => {
    const stage = request.headers.get('x-journey-stage');
    if (stage === '2') return { state: 'appComplete' };
    return { state: 'quoteAccept' };
  }
}
```

**Pros:**
- ✅ Explicit stage tracking
- ✅ Framework-agnostic (custom header)

**Cons:**
- ❌ Manual header management in tests (easy to forget)
- ❌ Still uses conditionals in mocks (not self-documenting)
- ❌ Header pollution (another test-specific header)
- ❌ Requires test code changes (sequences are mock-only)

**Decision**: Rejected - manual header management too error-prone

### Alternative 4: Stateful Mocks (Phase 3)

**Pattern:**
```typescript
{
  method: 'POST',
  url: '/applications/:id/advance',
  captureState: {
    stage: 'body.stage' // Capture stage from request
  }
}

{
  method: 'GET',
  url: '/applications/:id',
  response: {
    status: 200,
    body: {
      state: '{{state.stage}}' // Inject captured stage
    }
  }
}
```

**Pros:**
- ✅ Explicit state capture
- ✅ Flexible (any state shape)

**Cons:**
- ❌ Requires POST request to advance state (extra API call)
- ❌ More complex than sequences for linear journeys
- ❌ State capture is overkill for simple progression

**Decision**: Deferred - use stateful mocks for non-linear state (shopping cart), sequences for linear journeys

**Note**: Stateful mocks (Phase 3) are better for non-linear state (shopping cart items, form data). Sequences are better for linear multi-page journeys.

## Consequences

### Positive

✅ **Explicit > Implicit** - Sequence array shows progression:
   ```typescript
   sequence: {
     responses: [
       { body: { state: 'step1' } }, // First call
       { body: { state: 'step2' } }, // Second call
       { body: { state: 'step3' } }, // Third call
     ]
   }
   // Reads like: "Journey has 3 steps: step1 → step2 → step3"
   ```

✅ **Framework Agnostic** - No dependency on Next.js/Remix routing:
   - Works with Next.js (App Router, Pages Router)
   - Works with Remix
   - Works with SPAs (React, Vue, Svelte)
   - Works with any HTTP client

✅ **Self-Documenting** - Journey progression visible in mock:
   ```typescript
   // Before (referer routing):
   if (referer.includes('/apply-sign')) { ... } // What step is this?

   // After (sequences):
   responses: [step1, step2, step3] // Clear: 3 steps total
   ```

✅ **Testable Independently** - Can test specific steps:
   ```typescript
   it('should return step 2 response on second call', () => {
     selector.selectResponse(testId, scenarioId, context, mocks); // Call 1
     const result = selector.selectResponse(testId, scenarioId, context, mocks); // Call 2

     expect(result.data.body.state).toBe('appComplete'); // ✅ Step 2
   });
   ```

✅ **No URL Coupling** - Journey order independent of routes:
   ```typescript
   // Rename /apply-sign to /apply-signature → no mock changes needed
   // Reorder pages → no mock changes needed
   // Change routing library → no mock changes needed
   ```

✅ **Maintainable** - Add/remove steps without conditional logic:
   ```typescript
   // Add a new step: Just insert in array
   responses: [
     { body: { state: 'quoteAccept' } },
     { body: { state: 'detailsCollect' } }, // ← New step
     { body: { state: 'appComplete' } },
   ]
   ```

✅ **Already Implemented** - Phase 2 complete (PR #25):
   - Response sequences with repeat modes
   - Test ID isolation
   - Specificity-based selection
   - Integration with request matching (Phase 1)
   - 100% test coverage

✅ **Proven Architecture** - Validates Phase 2 design decisions:
   - Real-world use case (48/64 Acquisition.Web tests)
   - Clear advantage over existing pattern (referer routing)
   - Architectural principle validated (explicit > implicit)

### Negative

❌ **Must track call order** - Sequences require consistent call order:
   ```typescript
   // If test makes calls in unexpected order:
   await fetch('/applications/123'); // Call 1 → step 1 ✅
   await fetch('/applications/123'); // Call 2 → step 2 ✅
   await fetch('/other-endpoint');   // Unrelated
   await fetch('/applications/123'); // Call 3 → step 3 ✅

   // But if conditional logic changes order:
   if (condition) {
     await fetch('/applications/123'); // Call 1 → step 1 ✅
   }
   await fetch('/applications/123');   // Call 2 OR 1 → depends on condition ❌
   ```

   **Mitigation**: Tests should follow predictable navigation order. For non-linear flows, use stateful mocks (Phase 3) instead.

❌ **Limited to linear progression** - Sequences don't handle:
   - Jumping to arbitrary steps (use stateful mocks)
   - Conditional branching (use match criteria + multiple sequences)
   - User going backward (would need negative advancement)

   **Mitigation**: Sequences are for linear journeys. Non-linear state should use Phase 3 (stateful mocks).

❌ **Repeat mode must be chosen** - Forgot `repeat: 'last'` → unexpected behavior:
   ```typescript
   sequence: {
     responses: [step1, step2, step3]
     // Missing repeat! Defaults to 'none'
   }

   // Result: Call 4+ returns error instead of step3
   ```

   **Mitigation**: Document repeat mode as required field. Add validation/warning if omitted.

### Neutral

⚖️ **Different mental model** - Must think about "call order" not "page context":
   - Referer: "What page sent this request?"
   - Sequence: "How many times has this been called?"
   - Trade-off: Explicit order vs implicit context

⚖️ **Sequence reset on scenario switch** - Fresh sequences per test:
   - Ensures test isolation (Phase 2 feature: ADR-0005)
   - But requires explicit scenario switching between tests
   - Good for parallel tests, requires understanding reset behavior

## Implementation Notes

### Converting Acquisition.Web Tests

**Before (referer routing):**

```typescript
// mocks/scenarios/onlineJourneyLogin.ts (Acquisition.Web)
http.get('/v2/api/applications/:id', async ({ request }) => {
  const referer = request.headers.get('referer') || '';

  if (referer.includes('/apply-sign') || referer.includes('/penny-drop')) {
    return HttpResponse.json({
      state: 'appComplete',
      decision: { status: 'Accepted' },
    });
  }

  return HttpResponse.json({
    state: 'quoteAccept',
    decision: { status: 'Pending' },
  });
});
```

**After (sequences):**

```typescript
// scenarios/online-journey-login.ts (Scenarist)
{
  id: 'online-journey-login',
  name: 'Online Journey - Login',
  mocks: [
    {
      method: 'GET',
      url: '/v2/api/applications/:id',
      sequence: {
        responses: [
          // Page 1: /apply/quote
          {
            status: 200,
            body: {
              state: 'quoteAccept',
              decision: { status: 'Pending' },
            }
          },
          // Pages 2-3: /apply-sign, /penny-drop
          {
            status: 200,
            body: {
              state: 'appComplete',
              decision: { status: 'Accepted' },
            }
          }
        ],
        repeat: 'last' // Stay at 'appComplete' after step 2
      }
    }
  ]
}
```

**Benefits:**
- ✅ No referer string matching
- ✅ Journey progression explicit (2 steps)
- ✅ Works if routes change (no URL coupling)
- ✅ Self-documenting (array shows flow)

### Testing Strategy

**Test sequence advancement:**

```typescript
describe('Application journey sequence', () => {
  it('should progress through journey states', async () => {
    await switchScenario('online-journey-login');

    // Step 1: Quote page
    const step1 = await fetch('/applications/123');
    const data1 = await step1.json();
    expect(data1.state).toBe('quoteAccept');
    expect(data1.decision.status).toBe('Pending');

    // Step 2: Sign page
    const step2 = await fetch('/applications/123');
    const data2 = await step2.json();
    expect(data2.state).toBe('appComplete');
    expect(data2.decision.status).toBe('Accepted');

    // Step 3: Penny drop page (same as step 2)
    const step3 = await fetch('/applications/123');
    const data3 = await step3.json();
    expect(data3.state).toBe('appComplete');
    expect(data3.decision.status).toBe('Accepted');
  });
});
```

### Coverage Analysis (Acquisition.Web)

**Acquisition.Web Tests:**
- Total tests: 64
- Tests with multi-page journeys: 48 (75%)
- Tests using referer routing: 48 (100% of journey tests)

**Conversion Impact:**
- 48 tests can use sequences instead of referer routing
- 16 tests (25%) are single-page (no sequences needed)

**Confidence Level:** HIGH - sequences designed for this exact use case

## Related Decisions

- **Phase 2**: Response Sequences (PR #25) - Already implemented
- **Phase 1**: Request Content Matching (PR #24) - Can be combined with sequences
- **Phase 3**: Stateful Mocks (future) - For non-linear state
- **ADR-0005**: State/Sequence Reset on Scenario Switch (ensures test isolation)
- **PR #88**: Acquisition.Web Analysis (discovered this pattern)

## Validation

**Architecture Validated:**

The fact that 48/64 Acquisition.Web tests use multi-page journeys with referer routing **validates the Phase 2 design decisions**:

1. ✅ **Real-world need** - Not speculative, 75% of tests need this
2. ✅ **Clear improvement** - Sequences > referer routing (explicit, maintainable)
3. ✅ **Architectural principle** - Explicit > Implicit (core Scenarist value)
4. ✅ **Framework agnostic** - Works across all frameworks (not Next.js-specific)

**User Confirmation:**

> "Use sequences! They were literally designed for exactly this use case." - Original Phase 2 implementation

## Future Enhancements

### Potential: Negative Advancement (Backward Navigation)

For scenarios where users can go backward in journey:

```typescript
sequence: {
  responses: [...],
  repeat: 'last',
  allowBackward: true // Enable backward navigation
}

// Test can advance backward:
scenarist.advanceSequence(testId, scenarioId, mockIndex, -1); // Go back 1 step
```

This would enable browser back button testing in multi-page journeys.

### Potential: Named Steps

For better clarity in complex journeys:

```typescript
sequence: {
  steps: {
    quoteAccept: { status: 200, body: { state: 'quoteAccept' } },
    appComplete: { status: 200, body: { state: 'appComplete' } },
  },
  order: ['quoteAccept', 'appComplete', 'appComplete'],
  repeat: 'last'
}
```

This would make long sequences more readable.

## References

- [Phase 2 Implementation (PR #25)](https://github.com/scenarist/scenarist/pull/25)
- [Acquisition.Web Analysis (PR #88)](https://github.com/scenarist/scenarist/pull/88)
- [HTTP Referer Header (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer)
- Internal: `docs/analysis/can-scenarist-replace-acquisition-web.md` (Progressive State section)
- Internal: Acquisition.Web: `mocks/scenarios/onlineJourneyLogin.ts` (referer routing example)
