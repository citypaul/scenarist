# Automatic Default Scenario Fallback

**Started:** 2025-11-11
**Completed:** 2025-11-11
**Status:** ✅ Complete (Merged)
**Related ADR:** [ADR-0011: Domain Constants Location](../adrs/0011-domain-constants-location.md)

## Goal

Implement automatic fallback to default scenario mocks when active scenario match criteria fail. This prevents MSW passthrough and 500 errors when requests don't match active scenario criteria.

**Problem Being Solved:**
- Playwright tests flaky because `premiumUser` scenario only has match criteria for premium requests
- When page loads with default React state (`userTier='standard'`), request doesn't match → MSW passthrough → json-server 500
- Currently requires explicit fallback mock in EVERY scenario (duplication)

**Why We're Doing This:**
- **Familiar pattern:** Default + override (like CSS, environment variables)
- **Reduces duplication:** Don't repeat fallback in every scenario
- **Fail-safe:** Always have a response (prevent passthrough)
- **Better mental model:** "Default = safety net, Scenario = variations"

## Overall Plan

### Phase 1: Core Implementation (MSW Adapter)
1. ✅ **Planning** - Create this WIP document
2. ⏳ **Test: Change getMocksFromScenarios logic (RED)** - Update tests to expect default-first behavior
3. ⏳ **Implement: Collect default mocks first (GREEN)** - Always collect from default, then active
4. ⏳ **Test: Verify specificity-based override** - Default mocks overridden by more specific active mocks
5. ⏳ **Test: Verify test ID isolation** - Different test IDs get independent mock selections

### Phase 2: Example Updates (Express)
6. ⏳ **Populate express-example default scenario** - Add happy path mocks for all APIs
7. ⏳ **Remove explicit fallbacks from express scenarios** - Clean up duplication
8. ⏳ **Verify express integration tests** - All tests should still pass

### Phase 3: Example Updates (Next.js)
9. ⏳ **Populate nextjs default scenario** - Add happy path mocks for all APIs
10. ⏳ **Remove temporary fallback from premiumUser** - Clean up the TEMPORARY comment
11. ⏳ **Verify Playwright tests** - Should pass without explicit fallback

### Phase 4: Documentation
12. ⏳ **Create ADR** - Document decision rationale and alternatives considered
13. ⏳ **Update core-functionality.md** - Explain default + override pattern
14. ⏳ **Update adapter READMEs** - Document expected default scenario usage

## Current Focus

**Step 1: Planning**

**Status:** Complete ✅

**What Was Done:**
- Created WIP plan document
- Defined incremental steps
- Established success criteria

**Next Step:** Move to Step 2 (Update tests for RED phase)

## Agent Checkpoints

- [ ] **tdd-guardian:** Verify TDD compliance before each commit (RED → GREEN → REFACTOR)
- [ ] **ts-enforcer:** Check TypeScript strict mode adherence (no `any` types)
- [ ] **refactor-scan:** Assess refactoring after GREEN phase (if valuable)
- [ ] **adr:** Create ADR documenting decision rationale
- [ ] **learn:** Update CLAUDE.md with learnings from implementation
- [ ] **docs-guardian:** Update permanent docs when feature completes

## Next Steps

1. **Read existing tests** for `getMocksFromScenarios` logic
2. **Write failing test** expecting default mocks collected first
3. **Run tests** - confirm RED phase
4. **Commit RED phase** with message: "test(msw-adapter): expect default-first mock collection (RED)"

## Blockers

None currently

## Technical Notes

### Current Behavior (Lines 68-106 of dynamic-handler.ts)

```typescript
const getMocksFromScenarios = (
  activeScenario: ActiveScenario | undefined,
  getScenarioDefinition: (scenarioId: string) => ScenaristScenario | undefined,
  method: string,
  url: string
): ReadonlyArray<ScenaristMock> => {
  const mocks: Array<ScenaristMock> = [];

  // Step 1: Collect from active scenario
  if (activeScenario) {
    const scenarioDefinition = getScenarioDefinition(activeScenario.scenarioId);
    if (scenarioDefinition) {
      scenarioDefinition.mocks.forEach((mock) => {
        const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
        const urlMatch = matchesUrl(mock.url, url);
        if (methodMatches && urlMatch.matches) {
          mocks.push(mock);
        }
      });
    }
  }

  // Step 2: ONLY if mocks.length === 0, collect from default
  if (mocks.length === 0) {
    const defaultScenario = getScenarioDefinition('default');
    if (defaultScenario) {
      defaultScenario.mocks.forEach((mock) => {
        const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
        const urlMatch = matchesUrl(mock.url, url);
        if (methodMatches && urlMatch.matches) {
          mocks.push(mock);
        }
      });
    }
  }

  return mocks;
};
```

**Problem:** Default only used when active scenario has ZERO matching mocks.

### Desired Behavior

```typescript
const getMocksFromScenarios = (
  activeScenario: ActiveScenario | undefined,
  getScenarioDefinition: (scenarioId: string) => ScenaristScenario | undefined,
  method: string,
  url: string
): ReadonlyArray<ScenaristMock> => {
  const mocks: Array<ScenaristMock> = [];

  // Step 1: ALWAYS collect from default first
  const defaultScenario = getScenarioDefinition('default');
  if (defaultScenario) {
    defaultScenario.mocks.forEach((mock) => {
      const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
      const urlMatch = matchesUrl(mock.url, url);
      if (methodMatches && urlMatch.matches) {
        mocks.push(mock);
      }
    });
  }

  // Step 2: Collect from active scenario (adds to/overrides defaults)
  if (activeScenario) {
    const scenarioDefinition = getScenarioDefinition(activeScenario.scenarioId);
    if (scenarioDefinition) {
      scenarioDefinition.mocks.forEach((mock) => {
        const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
        const urlMatch = matchesUrl(mock.url, url);
        if (methodMatches && urlMatch.matches) {
          mocks.push(mock);
        }
      });
    }
  }

  return mocks;
};
```

**Key Change:** Default mocks collected FIRST, then active scenario mocks added.

### How Override Works (Specificity-Based Selection)

**ResponseSelector** already has specificity-based selection (from Phase 1):
- Calculates specificity score for each mock (body fields + headers + query params)
- Higher specificity = more specific match = wins
- Default mocks (no match criteria) have specificity 0
- Active scenario mocks (with match criteria) have specificity > 0
- **Result:** Active scenario mocks automatically override default due to higher specificity

**Example:**

```typescript
// Default scenario
{
  method: 'GET',
  url: 'http://localhost:3001/products',
  response: { status: 200, body: { products: buildProducts('standard') } }
}

// Active scenario (premiumUser)
{
  method: 'GET',
  url: 'http://localhost:3001/products',
  match: { headers: { 'x-user-tier': 'premium' } },  // Specificity = 1
  response: { status: 200, body: { products: buildProducts('premium') } }
}
```

**Request with `x-user-tier: premium` header:**
- Both mocks match URL and method
- Default mock: specificity = 0
- Active mock: specificity = 1 (1 header)
- **Active mock wins** (higher specificity)

**Request WITHOUT `x-user-tier` header:**
- Both mocks match URL and method
- Default mock: specificity = 0, match criteria passes (no criteria)
- Active mock: specificity = 1, match criteria FAILS (missing header)
- **Default mock wins** (only mock with passing criteria)

**This is exactly what we want: automatic fallback via existing specificity algorithm.**

### Impact on Existing Tests

**Tests that may need updating:**
1. MSW adapter tests for `getMocksFromScenarios`
2. MSW adapter integration tests (if they assume current behavior)
3. Express adapter integration tests (may see different mock selection)

**Tests that should NOT break:**
- Any test that doesn't rely on "only fallback when zero mocks" behavior
- Tests using specificity-based selection (still works the same)
- Tests with proper default scenario mocks

### Express Example Scenario Updates Needed

**Current express-example default scenario (lines 7-57):**
- ✅ GitHub API (`GET /users/:username`)
- ✅ Weather API (`GET /weather/:city`)
- ✅ Stripe API (`POST /charges`)

**Other scenarios using these APIs:**
- `successScenario`: Full coverage (GitHub, Weather, Stripe) ✅
- `githubNotFoundScenario`: Only GitHub ⚠️ (needs Weather + Stripe in default)
- `weatherErrorScenario`: Only Weather ⚠️ (needs GitHub + Stripe in default)
- `stripeFailureScenario`: Only Stripe ⚠️ (needs GitHub + Weather in default)
- `slowNetworkScenario`: Full coverage ✅
- `mixedResultsScenario`: Full coverage ✅

**Action Required:**
- `githubNotFoundScenario`: Remove explicit fallbacks (rely on default)
- `weatherErrorScenario`: Remove explicit fallbacks (rely on default)
- `stripeFailureScenario`: Remove explicit fallbacks (rely on default)

### Next.js Example Scenario Updates Needed

**Current nextjs default scenario (line 14-19):**
```typescript
export const defaultScenario: ScenaristScenario = {
  id: "default",
  name: "Default Scenario",
  description: "Default baseline behavior",
  mocks: [],  // ❌ EMPTY!
};
```

**Action Required:**
1. Add GET /products mock with standard pricing
2. Add GET /github/jobs/:id mock (for polling scenario)
3. Add GET /weather/:city mock (for weather cycle)
4. Add POST /payments mock (for payment limited)
5. Add POST /cart/add mock (for cart scenario)
6. Add GET /cart mock (for cart scenario)

**Then Remove:**
- Lines 47-58 in `premiumUserScenario` (temporary fallback mock)

## Test Strategy

### Phase 1: TDD for Core Implementation

**Step 2: RED Phase**
- Update existing test: `"should collect mocks from active scenario only"`
- Expect: Default mocks collected even when active scenario has matching mocks
- Verify: Test FAILS with current implementation

**Step 3: GREEN Phase**
- Implement: Change `getMocksFromScenarios` to collect default first
- Verify: Test PASSES with new implementation

**Step 4: Additional Tests**
- Test: Specificity-based override (active mock wins over default)
- Test: Fallback when match criteria fail (default mock wins)
- Test: Test ID isolation (different test IDs, independent selections)

**Step 5: REFACTOR Phase**
- Assess: Can logic be clearer/simpler?
- Consider: Extract mock collection to separate function?
- Only refactor if adds value

### Phase 2 & 3: Integration Testing

**Express Example:**
- Run full test suite after populating default
- Verify: All integration tests still pass
- Verify: Bruno tests still pass (if applicable)

**Next.js Example:**
- Run Playwright tests after populating default
- Verify: Products tests pass without explicit fallback
- Verify: All other scenario tests still pass

### Coverage Verification

**Before merging:**
- Run coverage: `cd packages/msw-adapter && pnpm exec vitest run --coverage`
- Verify: 100% coverage maintained (lines, statements, branches, functions)
- No exceptions allowed

## Example Updates

### Express Example: Default Scenario

**Already complete** (lines 7-57 have full coverage)

### Next.js Example: Default Scenario

**BEFORE (current - line 14-19):**
```typescript
export const defaultScenario: ScenaristScenario = {
  id: "default",
  name: "Default Scenario",
  description: "Default baseline behavior",
  mocks: [],
};
```

**AFTER (needs implementation):**
```typescript
export const defaultScenario: ScenaristScenario = {
  id: "default",
  name: "Default Scenario",
  description: "Default happy path for all APIs",
  mocks: [
    // GET /products - Standard pricing
    {
      method: "GET",
      url: "http://localhost:3001/products",
      response: {
        status: 200,
        body: {
          products: buildProducts("standard"),
        },
      },
    },
    // GET /github/jobs/:id - Completed job
    {
      method: "GET",
      url: "http://localhost:3001/github/jobs/:id",
      response: {
        status: 200,
        body: { jobId: "default", status: "complete", progress: 100 },
      },
    },
    // GET /weather/:city - Clear weather
    {
      method: "GET",
      url: "http://localhost:3001/weather/:city",
      response: {
        status: 200,
        body: { city: "London", conditions: "Clear", temp: 18 },
      },
    },
    // POST /payments - Success
    {
      method: "POST",
      url: "http://localhost:3001/payments",
      response: {
        status: 200,
        body: { id: "pay_default", status: "succeeded" },
      },
    },
    // POST /cart/add - Success
    {
      method: "POST",
      url: "http://localhost:3001/cart/add",
      response: {
        status: 200,
        body: { success: true, message: "Item added" },
      },
    },
    // GET /cart - Empty cart
    {
      method: "GET",
      url: "http://localhost:3001/cart",
      response: {
        status: 200,
        body: { items: [] },
      },
    },
  ],
};
```

### Next.js Example: Remove Temporary Fallback

**BEFORE (current - lines 47-58):**
```typescript
// TEMPORARY: Fallback mock to test theory about missing fallback causing 500 errors
// TODO: Remove once we implement automatic fallback behavior
{
  method: "GET",
  url: "http://localhost:3001/products",
  response: {
    status: 200,
    body: {
      products: buildProducts("premium"),
    },
  },
},
```

**AFTER:**
- Delete lines 47-58 entirely
- Rely on default scenario fallback

## Success Criteria

### Code
- ✅ `getMocksFromScenarios` collects default mocks first
- ✅ Active scenario mocks override defaults via specificity
- ✅ All MSW adapter tests passing (100% coverage)
- ✅ All Express example tests passing
- ✅ All Next.js Playwright tests passing (without explicit fallbacks)

### Tests
- ✅ TDD evidence in git history (RED → GREEN commits)
- ✅ Test for default-first collection
- ✅ Test for specificity-based override
- ✅ Test for match criteria fallback
- ✅ Test for test ID isolation

### Documentation
- ✅ ADR created explaining decision rationale
- ✅ `core-functionality.md` updated with default + override pattern
- ✅ Adapter READMEs updated with expected usage
- ✅ CLAUDE.md updated with implementation learnings

### Examples
- ✅ Express default scenario populated (already done)
- ✅ Next.js default scenario populated
- ✅ Temporary fallback removed from premiumUser scenario
- ✅ All example tests passing without explicit fallbacks

## Session Log

### 2025-11-11 - Session 1
**Duration:** 30 minutes (planning)

**Completed:**
- Created WIP plan document
- Analyzed current implementation (dynamic-handler.ts lines 68-106)
- Analyzed express-example scenarios (fully populated default)
- Analyzed nextjs-example scenarios (empty default, temporary fallback)
- Defined incremental implementation steps
- Documented technical approach (specificity-based override)

**Learned:**
- Express example already has good default scenario pattern
- Next.js example has empty default (anti-pattern discovered during flaky test investigation)
- Specificity-based selection (Phase 1) enables automatic override without new logic
- This is architectural leverage - new feature emerges from existing design

**Next Session:**
- Start Phase 1, Step 2 (RED phase)
- Read existing MSW adapter tests
- Write failing test for default-first collection
- Commit RED phase

**Agent Actions Taken:**
- ✅ wip-guardian: Created WIP plan document
- ⏳ tdd-guardian: Pending (will invoke during implementation)
- ⏳ refactor-scan: Pending (will invoke after GREEN phase)
- ⏳ adr: Pending (will invoke at end)
- ⏳ learn: Pending (will update CLAUDE.md at end)
