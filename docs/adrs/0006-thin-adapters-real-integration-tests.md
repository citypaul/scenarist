# ADR-0006: When Thin Adapters Can Use Real Integration Tests

**Status**: Accepted
**Date**: 2025-11-02
**Authors**: Claude Code

## Context

The Scenarist testing strategy (ADR-0003) prescribes **four testing layers** aligned with hexagonal architecture:

1. **Core Package Tests** - Domain logic (100% coverage, pure TypeScript)
2. **Adapter Package Tests** - Translation layer (mocked dependencies, fast feedback)
3. **Integration Tests** - Full stack (real framework, real HTTP)
4. **Bruno Tests** - API documentation (selective happy paths)

**Layer 2 (Adapter Tests) General Rule:**
> "**Fast** - Mock framework req/res, no full server (milliseconds)"
> "**Focused** - Only translation, not domain logic"
> "**Framework-specific** - Tests Express/Fastify/etc. quirks"

This rule works well for adapters with significant translation logic (`@scenarist/express-adapter`, `@scenarist/nextjs-adapter`). However, the `@scenarist/playwright-helpers` package presented an edge case that challenged this guideline.

### The Playwright Helpers Package

**Characteristics:**
- **~40 lines** of production code
- **Single responsibility** - scenario switching helper
- **Zero complex logic** - just API calls and header manipulation
- **Thin wrapper** around Playwright's `Page.request` and `Page.setExtraHTTPHeaders`
- **Minimal abstraction** - doesn't transform data structures

**Initial Implementation:**
The package was implemented with **13 real integration tests** using:
- ✅ Real Playwright (`@playwright/test` with actual Page objects)
- ✅ MSW Node server for HTTP responses
- ✅ No mocking of Playwright API
- ✅ Fast execution (1.7 seconds)

**The Question:**
Should we have mocked Playwright's `Page` object to follow the Layer 2 guideline, or is using real Playwright acceptable for this thin adapter?

## Problem

**Tension between general rule and specific case:**

The testing strategy prescribes mocking external dependencies in adapter tests, but:

1. **Playwright is stable and well-tested** - Mocking it tests "our mock" not "real behavior"
2. **Real integration is fast** - 1.7 seconds is comparable to typical adapter tests
3. **Adapter is extremely thin** - Very little translation logic to test in isolation
4. **Confidence matters** - Real Playwright integration provides higher confidence than mocks

**Without clear guidance**, future contributors might:
- ❌ Mock stable dependencies unnecessarily (tests become less valuable)
- ❌ Use real dependencies for complex adapters (tests become slow)
- ❌ Debate this decision on every PR (wastes time)

We need **clear criteria** for when the general rule applies vs. when real dependencies are acceptable.

## Decision

### Default Rule: Mock External Dependencies (Applies to 90%+ of Adapters)

**Adapter packages MUST mock external dependencies.** This is the standard approach for testing adapter translation layers.

**Why mocking is the default:**
- ⚡ **Fast feedback** - Millisecond execution, no framework overhead
- 🎯 **Focused tests** - Tests translation logic only, not framework behavior
- 🔒 **Isolation** - Framework bugs don't cause adapter test failures
- 📊 **Exhaustive coverage** - Easy to test all edge cases with mocks
- ✅ **Aligns with Layer 2** - Per ADR-0003 testing strategy

**When to use mocks (DEFAULT for most adapters):**
- ✅ Package has multiple responsibilities (middleware + endpoints + context)
- ✅ Complex translation logic (header parsing, type conversion, validation)
- ✅ External API is unstable or experimental
- ✅ Tests would be slow with real dependencies (>2s)
- ✅ Heavy transformation between framework and domain types
- ✅ Framework requires complex initialization/teardown

**Examples following default rule:**
- `@scenarist/express-adapter` - Complex translation, multiple concerns (middleware, endpoints, context)
- `@scenarist/nextjs-adapter` - Framework-specific routing, multiple adapters (Pages/App Router)
- `@scenarist/fastify-adapter` (future) - Plugin system, hooks, complex lifecycle

---

### Narrow Exception: Real Dependencies in Rare Cases

In rare cases (target ≤10% of adapters), real dependencies MAY be used **IF AND ONLY IF ALL** of the following criteria are true:

**Exception Criteria (ALL 5 must be true):**

1. ✅ **Single responsibility** - Package does ONE thing only
   - **Examples:**
     - ✅ Scenario switching helper (one function, one purpose)
     - ❌ Adapter with middleware + endpoints + context (multiple concerns)
   - **Test**: Can you describe what the package does in one sentence?

2. ✅ **Minimal translation logic** - Direct API wrappers only, no data transformation
   - **What "minimal" means:**
     - ✅ Direct pass-through to external API (no transformation)
     - ✅ Simple error wrapping (catch → Result type)
     - ✅ Parameter forwarding (options.x → api(x))
     - ❌ Header parsing/normalization (= complex)
     - ❌ Type conversions (framework types → domain types)
     - ❌ Validation or sanitization (= complex)
     - ❌ Multiple concerns (middleware + endpoints + context)
   - **Rule of thumb**: If you're transforming data structures, you need mocked tests

3. ✅ **External API is stable** - Playwright, Node.js core libraries (not experimental)

4. ✅ **Real tests provide adequate feedback speed** - Fast enough for rapid development cycles
   - Tests complete quickly enough to run frequently during development
   - No significant friction compared to mocked tests

5. ✅ **Higher confidence needed** - Real integration catches issues mocks can't
   - Mocking the external API would test "our mock" not real behavior
   - External API has subtle behaviors that are hard to replicate in mocks

**If ANY criterion is false → use mocked tests (follow default rule)**

**Current exception status:**
- Total adapters: 4 packages
- Adapters using exception: 1 (`@scenarist/playwright-helpers`)
- **Exception rate: 25%** ⚠️
- **Target rate: ≤10%** (truly rare cases)
- **Action**: Monitor rate as new adapters are added. If rate exceeds 10%, criteria may need tightening

## Rationale

### Why the General Rule Exists

**Mocking external dependencies in adapter tests:**

✅ **Fast feedback** - Millisecond execution, no framework overhead
✅ **Focused tests** - Tests translation logic only, not framework behavior
✅ **Isolation** - Framework bugs don't cause adapter test failures
✅ **Exhaustive coverage** - Easy to test all edge cases with mocks
✅ **CI efficiency** - Fast tests run frequently, slow tests run selectively

**Example - Express Adapter (Follows General Rule):**

```typescript
// packages/express-adapter/tests/request-translation.test.ts
import { describe, it, expect } from 'vitest';
import { extractRequestContext } from '../src/utils/request-translation';
import { mockExpressRequest } from './mocks'; // ← Mock Request object

describe('Express Adapter - Request Translation', () => {
  it('should extract all RequestContext fields from Express request', () => {
    const req = mockExpressRequest({
      method: 'POST',
      url: '/api/items',
      body: { itemId: 'premium' },
    });

    const context = extractRequestContext(req);

    expect(context.method).toBe('POST');
    expect(context.body).toEqual({ itemId: 'premium' });
  });
});
```

**Why mocking works here:**
- Complex translation logic (headers, query params, body parsing)
- Many edge cases (missing fields, malformed data)
- Fast (milliseconds)
- Tests OUR code (translation functions), not Express

### Why the Exception Exists

**Using real dependencies for thin adapters:**

✅ **Higher confidence** - Tests prove integration with real API
✅ **Simplicity** - No mock maintenance when API changes
✅ **Realistic behavior** - Tests catch subtle API quirks
✅ **No mock divergence** - Can't have "our mock works but real API doesn't"
✅ **Still fast** - When adapter is simple, real tests are comparable speed

**Example - Playwright Helpers (Exception Case):**

```typescript
// packages/playwright-helpers/tests/switch-scenario.spec.ts
import { test, expect } from '@playwright/test'; // ← Real Playwright
import { setupServer } from 'msw/node';
import { switchScenario } from '../src/switch-scenario';

test('should throw error when scenario switch fails with 404', async ({ page }) => {
  await expect(
    switchScenario(page, 'error-404', {
      baseURL: 'http://localhost:9876',
    })
  ).rejects.toThrow(/Failed to switch scenario: 404/);
});
```

**Why real Playwright is better here:**
- ✅ Adapter is thin (~40 lines) - mocking would be overkill
- ✅ Playwright API is stable - not changing frequently
- ✅ Tests are fast (1.7s) - comparable to mocked tests
- ✅ Higher confidence - proves real Playwright integration works
- ✅ Minimal logic - just API calls, no complex transformation

**What would mocking test?**
```typescript
// Hypothetical mocked version (NOT what we did)
const mockPage = {
  request: {
    post: vi.fn().mockResolvedValue({ status: () => 200 }),
  },
  setExtraHTTPHeaders: vi.fn(),
};

await switchScenario(mockPage, 'premium', { baseURL });

expect(mockPage.request.post).toHaveBeenCalled();
expect(mockPage.setExtraHTTPHeaders).toHaveBeenCalled();
```

**Problem:** This tests "we called the API" not "the API actually works". We'd be testing our mock's behavior, not Playwright's real behavior.

### Decision Framework

**When adding adapter tests, ask these questions in order:**

#### Question 1: Does the package have a single responsibility?
- **Multiple concerns** (middleware + endpoints + context) → ❌ Follow general rule (mock dependencies)
- **Single responsibility** (one clear purpose) → Continue to Question 2

#### Question 2: How complex is the translation logic?
- **Complex transformations** (header parsing, type conversion, validation) → ❌ Follow general rule
- **Minimal transformation** (direct API wrappers) → Continue to Question 3

#### Question 3: Is the external API stable and well-tested?
- **Experimental or unstable** → ❌ Follow general rule
- **Stable** (Playwright, Node.js core) → Continue to Question 4

#### Question 4: Would tests provide adequate feedback speed with real dependencies?
- **Slow enough to cause friction** → ❌ Follow general rule (mock for faster feedback)
- **Fast enough for rapid iteration** → Continue to Question 5

#### Question 5: Does real integration provide significantly more confidence?
- **Mocks are sufficient** → ❌ Follow general rule
- **Real integration catches important issues** → ✅ **Exception case - use real dependencies**

**If you reach Question 5 with all "yes" answers → Exception case**

**If you answer "no" at any earlier question → Follow general rule**

## Examples

### ✅ Exception Case: Playwright Helpers

**Meets ALL exception criteria:**

| Criterion | Playwright Helpers | Evidence |
|-----------|-------------------|----------|
| **Single responsibility** | ✅ One purpose | "Provides scenario switching helper for Playwright tests" |
| **Minimal logic** | ✅ API calls only | Direct wrapper around `Page.request` and `Page.setExtraHTTPHeaders` |
| **Stable API** | ✅ Playwright | Mature, well-tested framework |
| **Fast tests** | ✅ 1.7 seconds | MSW + Playwright is fast |
| **Higher confidence** | ✅ Real integration | Proves actual Playwright API works, catches API quirks |

**Result:** Use real Playwright in tests ✅

**Test characteristics:**
- 13 tests covering all behaviors
- Real `@playwright/test` with actual Page objects
- MSW Node server for HTTP responses
- 1.7 second execution time
- 100% coverage

### ❌ General Rule: Express Adapter

**Fails multiple exception criteria:**

| Criterion | Express Adapter | Evidence |
|-----------|----------------|----------|
| **Single responsibility** | ❌ Multiple concerns | Middleware + endpoints + context extraction + request translation |
| **Minimal logic** | ❌ Complex translation | Headers normalization, query parsing, body extraction, type conversion |
| **Stable API** | ✅ Express | Well-tested framework |
| **Fast tests** | ⚠️ Could be slow | Full server adds overhead |
| **Higher confidence** | ⚠️ Mocks sufficient | Translation logic is testable in isolation with fast feedback |

**Result:** Mock Express Request/Response objects ✅

**Test characteristics:**
- Mock `Request` and `Response` objects
- Test translation functions in isolation
- Fast (milliseconds)
- Exhaustive edge case coverage
- Integration tests verify real Express separately

### ❌ General Rule: Hypothetical Database Adapter

**Even if single responsibility, fails other criteria:**

| Criterion | Database Adapter | Evidence |
|-----------|-----------------|----------|
| **Single responsibility** | ✅ One purpose | Simple CRUD operations for scenarios |
| **Minimal logic** | ✅ Direct calls | No transformation, just pass-through |
| **Stable API** | ❌ **Database-specific** | PostgreSQL vs MySQL vs Redis differ |
| **Fast tests** | ❌ **Database startup** | Containers slow, state management complex |
| **Higher confidence** | ⚠️ Integration tests better | Real DB tests belong in app layer, not adapter layer |

**Result:** Mock database client ✅

Even though the adapter has single responsibility and minimal logic, database setup is complex and tests would be slow. Mock the database client, test real database integration in app-level tests.

## Consequences

### Positive

✅ **Clear guidance** - Contributors know when to mock vs. use real dependencies

✅ **Maintains general rule** - Most adapters still follow Layer 2 guideline

✅ **Narrow exception** - Only applies to genuinely thin, simple adapters

✅ **Higher confidence where it matters** - Real integration for critical thin wrappers

✅ **Prevents over-mocking** - Don't mock stable APIs when tests are still fast

✅ **Prevents under-mocking** - Complex adapters still get focused tests

✅ **Fast feedback preserved** - Exception only allowed when tests remain fast

### Negative

❌ **Judgment required** - Contributors must evaluate criteria (not always obvious)

*Mitigation:* Decision framework provides clear yes/no questions. When in doubt, follow general rule.

❌ **Potential for misuse** - Future adapters might claim exception incorrectly

*Mitigation:* PR review checklist. Reviewers verify ALL exception criteria met, not just some.

❌ **Inconsistency** - Different adapter packages have different test styles

*Mitigation:* This is intentional! Different adapters have different needs. Consistency would be forcing the wrong approach on some adapters.

### Risks & Mitigation

**Risk 1: Contributors use exception as default**
- *Mitigation:* Documentation emphasizes general rule is default. Exception is narrow and requires ALL criteria.

**Risk 2: "Single responsibility" boundary becomes blurred**
- *Mitigation:* **One-sentence test.** If you can't describe the package's purpose in a single, clear sentence, it has multiple responsibilities. Use mocks. Evaluate package scope carefully during PR review.

**Risk 3: Tests become slow as package grows**
- *Mitigation:* **Monitor feedback speed.** If tests become slow enough to cause friction during development, immediately refactor to use mocks. Evaluate regularly during PR reviews.

## Implementation Guidelines

### For New Adapter Packages

**Step 1:** Default to general rule (mock dependencies)

**Step 2:** Evaluate if exception criteria apply:

**Ask:** Can you describe what this package does in one sentence?
- If no → Multiple responsibilities → Use mocks
- If yes → Continue

**Ask:** Does it transform data or just pass through to external API?
- If transforms → Complex translation → Use mocks
- If pass-through → Continue

**Ask:** Is the external API stable?
- If experimental/unstable → Use mocks
- If stable → Continue

**Ask:** Run tests - do they provide adequate feedback speed?
```bash
time pnpm test
```
- If slow enough to cause friction → Use mocks (faster feedback)
- If fast enough for rapid iteration → Continue

**Ask:** Does real integration provide significantly more confidence than mocks?
- If mocks are sufficient → Use mocks
- If real integration catches important issues → Exception applies

**Step 3:** Evaluate all 5 exception criteria:
- [ ] Single responsibility (one-sentence test passes)
- [ ] Minimal translation logic (direct API wrappers)
- [ ] Stable external API
- [ ] Adequate feedback speed (fast enough for rapid iteration)
- [ ] Real integration provides significantly more confidence

**Step 4:** Document decision in package README

**Example README section:**
```markdown
## Testing Strategy

This package uses **real Playwright integration** in tests (exception to ADR-0003 Layer 2).

**Rationale** (per ADR-0006):
- ✅ Single responsibility (scenario switching helper)
- ✅ Minimal translation logic (API wrappers only)
- ✅ Stable API (Playwright)
- ✅ Fast tests (1.7s execution)
- ✅ Real integration provides higher confidence than mocks

See [ADR-0006](../../docs/adrs/0006-thin-adapters-real-integration-tests.md)
```

### For Existing Adapter Packages

**Express Adapter (General Rule):**
- ✅ Keep mocked tests (complex translation logic)
- ✅ Integration tests in `apps/express-example/tests/`

**Next.js Adapter (General Rule):**
- ✅ Keep mocked tests (multiple adapters, complex routing)
- ✅ Integration tests in `apps/nextjs-*-example/tests/`

**Playwright Helpers (Exception Case):**
- ✅ Keep real Playwright tests (meets all exception criteria)
- ✅ Document decision in README ✅ (already done)

### PR Review Checklist

**STOP: Default to mocking.** Only proceed if adapter claims exception.

**When adapter claims exception (uses real dependencies instead of mocks):**

1. **VERIFY SINGLE RESPONSIBILITY**:
   - [ ] Can describe package purpose in one clear sentence
   - [ ] Package does ONE thing only
   - **If multiple concerns** → ❌ REJECT - Multiple responsibilities require mocked tests

2. **CHECK COMPLEXITY**:
   - [ ] Direct API wrappers only (no transformation)
   - [ ] No header parsing, type conversion, or validation
   - [ ] No data structure manipulation
   - **If any transformation found** → ❌ REJECT - Translation logic requires mocked tests

3. **VERIFY STABILITY**:
   - [ ] External API is stable (Playwright, Node.js core, etc.)
   - [ ] Not experimental or frequently changing
   - **If unstable API** → ❌ REJECT - Unstable APIs should be mocked

4. **MEASURE FEEDBACK SPEED**:
   ```bash
   cd packages/[adapter] && time pnpm test
   ```
   - [ ] Tests fast enough for rapid iteration
   - [ ] No significant friction compared to mocked tests
   - **If slow enough to cause friction** → ❌ REJECT - Slow tests must use mocks

5. **EVALUATE VALUE**:
   - [ ] Real integration catches issues mocks can't
   - [ ] Mocking would test "our mock" not real behavior
   - **If mocks are sufficient** → ❌ REJECT - Use mocks when adequate

6. **VERIFY DOCUMENTATION**:
   - [ ] Package README explains exception rationale
   - [ ] Links to ADR-0006
   - [ ] Acknowledges this is NOT standard approach
   - **If not documented** → ❌ REJECT - Exception must be documented

**IF ANY CRITERION FAILS → REJECT.** Request mocked tests following ADR-0003 Layer 2.

**After approval:**
- Update exception count in ADR-0006 (line 121-122)
- Monitor exception rate (target ≤10%)

## When to Revisit This Decision

This decision should be reconsidered if:

1. **Exception rate exceeds 10%** - If >10% of adapters claim exception, criteria are too loose or developers are misapplying them
   - **Current status: 25% (1/4 adapters)** ⚠️
   - **Action if exceeded**: Review all exception cases, consider removing exception entirely or tightening criteria

2. **Single responsibility boundary becomes blurred** - If packages claiming exception add multiple concerns, refactor to use mocks

3. **Real tests become slow** - If execution time causes friction during development, refactor to use mocks immediately

4. **Unstable APIs become common** - If "stable" APIs change frequently, strengthen stability criterion

5. **Mocking tools improve significantly** - If mock libraries make high-fidelity mocks trivial

6. **Pattern causes confusion** - If contributors struggle to apply decision framework correctly

**Signs decision is still valid:**
- Exception rate stays ≤10% (currently 25%, should decrease as more adapters added)
- Tests using real dependencies remain fast (<2s)
- No regressions from real API changes
- Contributors can apply decision framework without excessive discussion

**Exception rate tracking:**
Update after each new adapter:
- ✅ Express adapter (mocked) - 25%
- ✅ MSW adapter (mocked) - 25%
- ✅ Next.js adapter (mocked) - 25%
- ⚠️ Playwright helpers (real) - 25%
- [ ] Future adapter 5 (?) - Update percentage

## Related Decisions

- [ADR-0003: Testing Strategy](./0003-testing-strategy.md) - Establishes Layer 2 general rule
- `packages/playwright-helpers/README.md` - Documents exception case
- `CLAUDE.md § Testing Principles` - Behavior-driven testing guidelines

## References

- [Testing Library Principles](https://testing-library.com/docs/guiding-principles)
- [Kent C. Dodds - Write Tests](https://kentcdodds.com/blog/write-tests)
- Hexagonal Architecture: Adapters should be thin translation layers
- Test Pyramid: Balance unit/integration/E2E based on value vs. cost

## Update History

- **2025-11-02**: Initial version (accepted) - Playwright Helpers exception case
