# WIP: Regex Support for Match Criteria

**Started**: 2025-11-15
**Status**: Core Implementation - Domain Logic Next
**Current Step**: 3 of 15 (EXPANDED SCOPE - Server-Side Matching)

## Goal

Add comprehensive pattern matching support for **URLs, headers, and query parameters**. This enables server-side MSW scenarios where backend code uses query params, different endpoints, and headers to control responses.

**CRITICAL ARCHITECTURAL REALIZATION**: The initial plan focused on referer header matching (browser-side). This was WRONG for server-side MSW testing. Real server-side scenarios need:
1. **URL pattern matching** - Most common (different endpoints like `/products/premium` vs `/products/standard`)
2. **Query parameter matching** - Very common (filters, categories, search terms)
3. **Header matching** - Common (x-campaign, x-feature-flag, x-user-tier)

**Expanded Scope**: Implement BOTH simple string helpers AND full regex for ALL three locations (URLs, headers, query params).

## Scope Change Summary

**BEFORE (Initial Plan):**
- Vertical Slice 1: Regex matching for headers only
- Focus: Referer header matching (browser navigation)
- Use case: Acquisition.Web pattern `referer.includes('/apply-sign')`
- 10 total steps

**AFTER (Revised Plan):**
- Phase 1-5: Complete matching system for URLs, headers, AND query params
- Both string helpers (contains/startsWith/endsWith) AND full regex
- Focus: Server-side MSW interception (what backend code controls)
- Use cases:
  - URL patterns (different endpoints)
  - Query params (filters, categories, search)
  - Custom headers (x-campaign, x-feature-flag, x-user-tier)
- 15 total steps (more comprehensive, architecturally sound)

**Why the Change:**
- Referer is browser-side (set during navigation)
- We're testing server-side MSW (RSC, getServerSideProps)
- Backend code controls URLs, query params, custom headers
- This is what server-side scenarios actually need

## Overall Plan (REVISED - Expanded Scope)

**Phase 1: Core Infrastructure (Schema + String Helpers + Regex Function)**
1. ✅ SerializedRegexSchema with ReDoS protection (DONE)
2. ⏳ MatchStrategy type definition (string | MatchStrategyObject)
3. ⏳ String matching functions (contains, startsWith, endsWith) - CORE: DOMAIN
4. ⏳ Regex matching function with timeout protection - CORE: DOMAIN

**Phase 2: Header Matching (Vertical Slice 1)**
5. ⏳ Extend MatchCriteria.headers to support MatchStrategy
6. ⏳ Integrate into matchesCriteria() for header matching
7. ⏳ E2E tests with x-campaign header scenarios

**Phase 3: Query Parameter Matching (Vertical Slice 2)**
8. ⏳ Extend MatchCriteria.query to support MatchStrategy
9. ⏳ Integrate into matchesCriteria() for query param matching
10. ⏳ E2E tests with category query param scenarios

**Phase 4: URL Matching (Vertical Slice 3)**
11. ⏳ Extend Mock.url to support string | MatchStrategy
12. ⏳ Integrate into URL matching logic
13. ⏳ E2E tests with URL pattern scenarios

**Phase 5: Integration & Documentation**
14. ⏳ Combined tests (URL + headers + query all together)
15. ⏳ Documentation updates with realistic server-side examples
16. ⏳ Migration guide for existing scenarios

## Hexagonal Architecture Layers

**Understanding Where Code Lives:**

**CORE PACKAGE (packages/core):**
- **Schemas** (`src/schemas/`) - Zod validation at trust boundaries
  - `match-criteria.ts` - NEW: SerializedRegexSchema validation
  - Responsibility: Validate regex patterns are safe (ReDoS protection)
  
- **Types** (`src/types/`) - Immutable data structures
  - `match-criteria.ts` - MODIFY: Add regex to MatchValue type
  - Responsibility: Define what a MatchValue can be (string | MatchValueObject)
  
- **Domain** (`src/domain/`) - Business logic (pure functions)
  - `regex-matching.ts` - NEW: Regex matching functions with timeout
  - `response-selector.ts` - MODIFY: Integrate regex into matching logic
  - Responsibility: Implement matching algorithm, timeout protection
  
- **Ports** (`src/ports/`) - Behavior contracts (NOT modified in this slice)
  - No changes needed - existing RequestContext port sufficient

**ADAPTER PACKAGES:**
- **MSW Adapter** (`packages/msw-adapter/`) - MSW integration
  - No changes needed - works through core's ResponseSelector
  
- **Next.js Adapter** (`packages/nextjs-adapter/`) - Next.js integration
  - No changes needed - scenarios pass through unchanged

**EXAMPLE APPS (for testing):**
- **Next.js App Router** (`apps/nextjs-app-router-example/`)
  - `lib/scenarios-regex.ts` - NEW: Test scenario definitions
  - `tests/playwright/regex-matching.spec.ts` - NEW: E2E tests
  - Responsibility: Prove regex matching works in real app context

## Current Focus

**Phase 1 - Step 3**: Implement string matching + regex matching functions

**Layer**: Core (Domain)

**Status**: Ready to Start - ATDD tests corrected and in RED phase

**Tests Passing**: 0/5 Playwright tests (RED phase - schema validation error is CORRECT)

**Last Session**: Session 4 - Corrected ATDD tests to use realistic server-side patterns

**ATDD Tests Status**: ✅ CORRECTED
- Changed from artificial browser header injection to realistic campaign tracking
- All 5 tests use query params → API route extracts → server-side fetch with x-campaign header
- Tests failing with correct schema error (expected string, received object)
- Ready for core implementation to make tests GREEN

**Current Tasks:**
- [ ] Define MatchStrategy type (string | MatchStrategyObject union)
- [ ] Create `packages/core/src/domain/string-matching.ts` with contains/startsWith/endsWith
- [ ] Create `packages/core/src/domain/regex-matching.ts` with matchesRegex function
- [ ] Add timeout protection (100ms limit) to regex matching
- [ ] Write unit tests for all matching functions
- [ ] Update MatchCriteria types to support MatchStrategy
- [ ] Update MatchCriteria schema to accept regex objects

**Completed Tasks:**
- [x] **Step 1 - ATDD (Adapter Layer)** ✅ COMPLETE (Sessions 1-2)
  - [x] Create refererRegexScenario definition in scenarios.ts
  - [x] Create Playwright test file (regex-matching.spec.ts) with 5 test cases
  - [x] Add scenario to scenarios object
  - [x] Run tests to confirm RED phase (Zod validation error)
  - [x] Extended scenarist.getHeaders() to forward referer header (TDD complete)
  - [x] Updated API route comment to document referer forwarding

- [x] **Step 2 - Schema Validation (Core: Schemas)** ✅ COMPLETE (Session 2)
  - [x] Added `redos-detector` dependency to core package
  - [x] Created `SerializedRegexSchema` with ReDoS protection
  - [x] Created schema unit tests (10 tests passing)
  - [x] Exported schema from core/src/schemas/index.ts
  - [x] Verified schema catches unsafe patterns
  - [x] Tests now fail with "Cannot read properties of undefined (reading 'test')" - correct next error!

- [x] **Session 4 - ATDD Test Correction** ✅ COMPLETE
  - [x] Identified problem: Browser header injection != server-side MSW pattern
  - [x] Changed scenario: refererRegexScenario → campaignRegexScenario
  - [x] Updated API route: Extract campaign query param, add as x-campaign header to fetch
  - [x] Updated all 5 Playwright tests: Use query params instead of setExtraHTTPHeaders
  - [x] Documented flow: Query param → API extracts → server-side fetch
  - [x] Confirmed RED phase: Schema validation error (expected string, received object)
  - [x] Ready for Phase 1 core implementation

## Agent Checkpoints

- [x] **ATDD**: Create failing Playwright test (referer regex scenario) - **ADAPTER LAYER** ✅
- [x] **Adapter Helpers**: Extended getHeaders() to forward referer header - **ADAPTER LAYER** ✅
- [x] **TDD Guardian**: RED phase for SerializedRegexSchema - **CORE: SCHEMAS** ✅
- [x] **TDD Guardian**: GREEN phase for SerializedRegexSchema - **CORE: SCHEMAS** ✅
- [ ] **TDD Guardian**: RED phase for regex matching function - **CORE: DOMAIN** (next)
- [ ] **TDD Guardian**: GREEN phase for regex matching function - **CORE: DOMAIN**
- [ ] **TDD Guardian**: RED phase for ResponseSelector integration - **CORE: DOMAIN**
- [ ] **TDD Guardian**: GREEN phase for ResponseSelector integration - **CORE: DOMAIN**
- [ ] **Refactor Scan**: Assess code quality after GREEN
- [ ] **Learn**: Document ReDoS protection patterns
- [ ] **Docs Guardian**: Update core-functionality.md when complete

## Next Steps (REVISED)

**Phase 1: Core Infrastructure**
1. ~~**CORE: SCHEMAS**: SerializedRegexSchema with ReDoS protection~~ ✅
2. **CORE: TYPES**: Define MatchStrategy type (string | MatchStrategyObject)
3. **CORE: DOMAIN**: Implement string-matching.ts (contains, startsWith, endsWith)
4. **CORE: DOMAIN**: Implement regex-matching.ts with timeout protection

**Phase 2: Header Matching (Vertical Slice 1)**
5. **CORE: TYPES**: Extend MatchCriteria.headers to support MatchStrategy
6. **CORE: DOMAIN**: Integrate string + regex matching into matchesCriteria()
7. **ADAPTER**: Create E2E test with x-campaign header scenario

**Phase 3: Query Parameter Matching (Vertical Slice 2)**
8. **CORE: TYPES**: Extend MatchCriteria.query to support MatchStrategy
9. **CORE: DOMAIN**: Integrate matching into query parameter logic
10. **ADAPTER**: Create E2E test with category query param scenario

**Phase 4: URL Matching (Vertical Slice 3)**
11. **CORE: TYPES**: Extend Mock.url to support string | MatchStrategy
12. **MSW ADAPTER**: Integrate matching into URL matching logic
13. **ADAPTER**: Create E2E test with URL pattern scenario

**Phase 5: Integration & Documentation**
14. **ADAPTER**: Combined E2E test (URL + headers + query together)
15. **DOCS**: Update core-functionality.md with realistic examples
16. **DOCS**: Update CLAUDE.md with learnings

## Blockers

None currently

## Technical Notes

**CRITICAL ARCHITECTURAL INSIGHT: Why Referer Was Wrong**

**Initial Mistake**: Focused on referer header matching because Acquisition.Web used it.

**The Problem**: Referer is a **browser-side** header set by the browser during navigation. In server-side MSW testing (React Server Components, getServerSideProps), we're NOT testing browser behavior - we're testing server-side fetch calls.

**Server-Side Reality**:
- Backend code calls `fetch('http://localhost:3001/products?category=electronics')`
- Backend code decides which endpoint to call: `/products/premium` vs `/products/standard`
- Backend code adds headers: `{ 'x-campaign': 'summer-sale' }`
- MSW intercepts these server-side requests (NOT browser requests)

**What Actually Matters for Server-Side MSW**:
1. **URL patterns** - Different endpoints for different data
2. **Query parameters** - Filters, categories, search terms
3. **Headers** - Feature flags, campaigns, user attributes

**Revised Focus**: Support matching on all three locations with both string helpers AND regex.

**Architectural Layers Involved:**

**1. SCHEMAS (Trust Boundary Validation):**
- Location: `packages/core/src/schemas/match-criteria.ts`
- Purpose: Validate incoming scenario definitions at trust boundary
- Responsibility: Ensure regex patterns are safe (ReDoS protection)
- Technology: Zod + redos-detector
- Example:
  ```typescript
  export const SerializedRegexSchema = z.object({
    source: z.string().min(1).refine(isRegexSafe),
    flags: z.string().regex(/^[gimsuvy]*$/).optional().default(''),
  });

  export const MatchStrategySchema = z.union([
    z.string(),  // Simple exact match (current behavior)
    z.object({
      equals: z.string().optional(),
      contains: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional(),
      regex: SerializedRegexSchema.optional(),
    }).refine(obj => {
      // Exactly one strategy must be defined
      const strategies = [obj.equals, obj.contains, obj.startsWith, obj.endsWith, obj.regex];
      return strategies.filter(s => s !== undefined).length === 1;
    })
  ]);
  ```

**2. TYPES (Data Structures):**
- Location: `packages/core/src/types/match-criteria.ts`
- Purpose: Define immutable data shapes
- Responsibility: TypeScript compile-time guarantees
- Example:
  ```typescript
  type MatchStrategy = string | MatchStrategyObject;

  type MatchStrategyObject = {
    readonly equals?: string;
    readonly contains?: string;
    readonly startsWith?: string;
    readonly endsWith?: string;
    readonly regex?: SerializedRegex;
  };

  type MatchCriteria = {
    readonly headers?: Record<string, MatchStrategy>;
    readonly query?: Record<string, MatchStrategy>;
    readonly body?: Record<string, unknown>;  // Body stays as-is for now
  };

  // Mock.url also becomes MatchStrategy
  type ScenaristMock = {
    readonly method: HttpMethod;
    readonly url: MatchStrategy;  // CHANGED from string
    readonly match?: MatchCriteria;
    // ... rest of mock definition
  };
  ```

**3. DOMAIN (Business Logic):**
- Location: `packages/core/src/domain/string-matching.ts` (NEW)
- Location: `packages/core/src/domain/regex-matching.ts` (NEW)
- Purpose: Pure functions implementing all matching strategies
- Responsibility: String helpers + regex matching with timeout protection
- Technology: String methods, RegExp, timeout protection
- Example:
  ```typescript
  // string-matching.ts
  export const matchesContains = (actual: string, expected: string): boolean => {
    return actual.includes(expected);
  };

  export const matchesStartsWith = (actual: string, expected: string): boolean => {
    return actual.startsWith(expected);
  };

  export const matchesEndsWith = (actual: string, expected: string): boolean => {
    return actual.endsWith(expected);
  };

  // regex-matching.ts
  export const matchesRegex = (
    actual: string,
    pattern: SerializedRegex
  ): boolean => {
    const regex = new RegExp(pattern.source, pattern.flags || '');
    const startTime = Date.now();

    try {
      const matches = regex.test(actual);
      if (Date.now() - startTime > 100) {
        console.warn('[Scenarist] Regex timeout');
        return false;
      }
      return matches;
    } catch {
      return false;
    }
  };

  // Unified strategy matcher
  export const matchesStrategy = (
    actual: string,
    strategy: MatchStrategy
  ): boolean => {
    if (typeof strategy === 'string') {
      return actual === strategy;  // Exact match (backward compatible)
    }

    if (strategy.equals !== undefined) {
      return actual === strategy.equals;
    }

    if (strategy.contains !== undefined) {
      return matchesContains(actual, strategy.contains);
    }

    if (strategy.startsWith !== undefined) {
      return matchesStartsWith(actual, strategy.startsWith);
    }

    if (strategy.endsWith !== undefined) {
      return matchesEndsWith(actual, strategy.endsWith);
    }

    if (strategy.regex !== undefined) {
      return matchesRegex(actual, strategy.regex);
    }

    return false;  // No strategy defined (shouldn't happen with schema validation)
  };
  ```

**4. DOMAIN INTEGRATION:**
- Location: `packages/core/src/domain/response-selector.ts` (MODIFY)
- Purpose: Integrate regex matching into existing selection logic
- Responsibility: Call matchesRegex() when MatchValue is regex object
- No new abstractions - use existing matchesCriteria() pattern

**5. ADAPTER (Test Scenarios):**
- Location: `apps/nextjs-app-router-example/lib/scenarios-regex.ts`
- Purpose: Real-world scenario definitions for E2E testing
- Responsibility: Prove regex syntax works in actual app
- Example:
  ```typescript
  export const refererRegexScenario: ScenaristScenario = {
    id: 'refererRegex',
    mocks: [
      {
        match: {
          headers: {
            referer: {
              regex: { source: '/premium|/vip', flags: 'i' }
            }
          }
        },
        response: { status: 200, body: { products: premiumProducts } }
      }
    ]
  };
  ```

**Use Cases (Realistic Server-Side Scenarios):**

**1. URL Pattern Matching:**
```typescript
// Scenario: Premium features use /premium/ path
{
  id: 'premiumFeatures',
  mocks: [{
    method: 'GET',
    url: { regex: { source: '/products/premium', flags: '' } },
    response: { status: 200, body: { products: buildProducts('premium') } }
  }]
}

// Server code (RSC):
const tier = userTier === 'premium' ? '/premium' : '/standard';
const response = await fetch(`http://localhost:3001/products${tier}`);
```

**2. Query Parameter Matching:**
```typescript
// Scenario: Electronics or gadgets category
{
  id: 'techCategories',
  mocks: [{
    method: 'GET',
    url: 'http://localhost:3001/products',
    match: {
      query: {
        category: { regex: { source: 'electronics|gadgets', flags: 'i' } }
      }
    },
    response: { status: 200, body: { products: techProducts } }
  }]
}

// Server code (RSC):
const category = searchParams.get('category');
const response = await fetch(`http://localhost:3001/products?category=${category}`);
```

**3. Header Matching:**
```typescript
// Scenario: Campaign tracking
{
  id: 'campaignTracking',
  mocks: [{
    method: 'GET',
    url: 'http://localhost:3001/products',
    match: {
      headers: {
        'x-campaign': { regex: { source: 'premium|vip', flags: 'i' } }
      }
    },
    response: { status: 200, body: { products: buildProducts('premium') } }
  }]
}

// Server code (RSC):
const campaign = searchParams.get('campaign');
const response = await fetch('http://localhost:3001/products', {
  headers: { 'x-campaign': campaign }
});
```

**Expected Playwright Tests:**
```typescript
describe('URL Pattern Matching', () => {
  test('should match premium URL pattern', async ({ page, switchScenario }) => {
    await switchScenario(page, 'premiumFeatures');
    await page.goto('/?endpoint=premium');  // RSC calls /products/premium
    await expect(page.getByText('£99.99')).toBeVisible();
  });
});

describe('Query Parameter Matching', () => {
  test('should match electronics category regex', async ({ page, switchScenario }) => {
    await switchScenario(page, 'techCategories');
    await page.goto('/?category=electronics');
    await expect(page.getByText('Laptop')).toBeVisible();
  });

  test('should match gadgets category regex', async ({ page, switchScenario }) => {
    await switchScenario(page, 'techCategories');
    await page.goto('/?category=gadgets');
    await expect(page.getByText('Laptop')).toBeVisible();
  });
});

describe('Header Matching', () => {
  test('should match premium campaign header', async ({ page, switchScenario }) => {
    await switchScenario(page, 'campaignTracking');
    await page.goto('/?campaign=premium-sale');
    await expect(page.getByText('£99.99')).toBeVisible();
  });
});
```

**Security Requirements (SCHEMAS layer):**
- ReDoS validation via `redos-detector` package
- 100ms timeout on regex execution (DOMAIN layer)
- Only safe flag characters: `[gimsuvy]*` (SCHEMAS layer)
- Zod schema validation at trust boundaries (SCHEMAS layer)

**Architectural Decisions:**
- Regex is JSON-serializable: `{ source: string, flags?: string }` (TYPES layer)
- Converted to RegExp at runtime (DOMAIN layer, not during schema parse)
- Timeout protection prevents catastrophic backtracking (DOMAIN layer)
- Clear error messages for invalid patterns (SCHEMAS layer)

**Dependencies to Add:**
- `redos-detector` (core package) - ReDoS static analysis (SCHEMAS layer)

## Session Log

### 2025-11-15 - Session 1
**Duration**: 45 minutes

**Completed**:
- ✅ Created WIP document (this file)
- ✅ Planned ATDD approach for vertical slice 1
- ✅ Identified test scenario and expected behavior
- ✅ Explicitly mapped code to architecture layers
- ✅ Created `refererRegexScenario` in `apps/nextjs-app-router-example/lib/scenarios.ts`
- ✅ Created 5 Playwright tests in `tests/playwright/regex-matching.spec.ts`
- ✅ Added scenario to scenarios object and type exports
- ✅ Confirmed RED phase - all 5 tests fail as expected

**RED Phase Validation**:
- Error: Zod validation error "expected string, received object" at path `referer`
- Location: `packages/core/dist/domain/config-builder.js:10:27`
- All 5 tests fail with identical error (correct behavior - schema doesn't support regex yet)
- This proves schema validation is working at trust boundary (hexagonal architecture validated)

**Next Session**:
- Invoke TDD Guardian for SerializedRegexSchema implementation
- Focus on CORE: SCHEMAS layer (smallest vertical slice)
- Add `redos-detector` dependency to core package
- Create unit tests for schema validation
- Verify ReDoS protection works

**Learnings**:
- ATDD starts with E2E test (outside-in) - **ADAPTER LAYER** ✅
- Vertical slice focuses on ONE feature (regex only) ✅
- Test drives the API design (what does the scenario look like?) ✅
- **CRITICAL**: Schema validation catches type errors at trust boundary (scenario registration time)
- This proves hexagonal architecture working: adapters are thin, core validates
- RED phase must be explicitly confirmed before proceeding to implementation

**Architectural Clarity Reinforced:**
- Schemas = Trust boundary validation (Zod) - CATCHES INVALID SCENARIOS
- Types = Data structure definitions (TypeScript)
- Domain = Business logic (pure functions)
- Ports = Behavior contracts (interfaces) - NO CHANGES NEEDED
- Adapters = Framework integrations (MSW, Next.js) - PASS THROUGH

### 2025-11-15 - Session 2
**Duration**: 2 hours

**Completed (ADAPTER: Next.js App Router)**:
- ✅ Extended `scenarist.getHeaders()` helper to forward referer header
- ✅ Added 4 unit tests for getHeaders() behavior (all passing)
- ✅ Updated API route comment to document referer forwarding
- ✅ Confirmed all 25 Next.js adapter tests passing

**Completed (CORE: SCHEMAS)**:
- ✅ Added `redos-detector` dependency to core package
- ✅ Created `SerializedRegexSchema` with ReDoS protection (via TDD agent)
- ✅ Created 10 comprehensive schema unit tests (all passing)
- ✅ Exported schema from `core/src/schemas/index.ts`
- ✅ Verified schema catches unsafe patterns (catastrophic backtracking)
- ✅ Confirmed all 159 core tests passing

**RED Phase Evolution**:
- Initial error: "expected string, received object" (schema validation) ✅ FIXED
- New error: "Cannot read properties of undefined (reading 'test')" (regex.test() call)
- Location: MSW dynamic handler trying to execute regex matching
- This is the CORRECT next error - proves schema validation working!
- Ready for domain logic implementation

**Learnings**:
- **Schema Testing Through Behavior**: Don't test schemas directly with z.parse() in unit tests
  - Let scenarios use the schema (via ScenaristScenarioSchema)
  - Test schema validation behavior through scenario registration
  - This proves the schema is used at the right trust boundary
  - Matches CLAUDE.md guidance: "Test behavior, not implementation"

- **Error Progression is Good**: Each error is progress toward working feature
  - Zod validation error → Schema validation working ✅
  - Undefined 'test' error → Schema valid, domain logic needed ✅
  - This proves vertical slice approach working (adapter → schema → domain)

- **Adapter Helpers May Need Extension**:
  - Initially thought adapters wouldn't change
  - But helper functions ARE adapter responsibility
  - getHeaders() needed referer forwarding for regex matching
  - This is correct architecture - helpers adapt core concepts to framework

**Test Status**:
- Core unit tests: 159/159 passing ✅
- Next.js adapter tests: 25/25 passing ✅
- Playwright E2E tests: 0/5 passing (awaiting domain logic) ⏳
- Total: 184/189 tests passing (97.4%)

### 2025-11-15 - Session 3
**Duration**: 1.5 hours

**CRITICAL ARCHITECTURAL REALIZATION**:
- **Initial mistake**: Focused on referer header matching (browser-side, Acquisition.Web pattern)
- **The problem**: Referer is set by browser during navigation, NOT by server-side code
- **What we're actually testing**: Server-side MSW (RSC, getServerSideProps) intercepting fetch calls
- **What actually matters**: URL patterns, query parameters, headers controlled by backend code

**Scope Expansion Decision**:
- **FROM**: Vertical slice 1 (regex only for headers)
- **TO**: Comprehensive matching (string helpers + regex for URLs + headers + query params)
- **Why**: Server-side scenarios need ALL three locations, not just headers
- **Impact**: 15 total steps (was 10), more architectural soundness

**API Design Revised**:
```typescript
// URL matching
url: 'http://localhost:3001/products'  // Current: exact
url: { contains: '/premium/' }  // NEW: string helper
url: { regex: { source: '/products/(premium|vip)', flags: '' } }  // NEW: regex

// Header matching
headers: { 'x-campaign': 'summer-sale' }  // Current: exact
headers: { 'x-campaign': { contains: 'premium' } }  // NEW: helper
headers: { 'x-campaign': { regex: { source: 'premium|vip', flags: 'i' } } }  // NEW: regex

// Query parameter matching
query: { category: 'electronics' }  // Current: exact
query: { category: { startsWith: 'elec' } }  // NEW: helper
query: { category: { regex: { source: 'electronics|gadgets', flags: 'i' } } }  // NEW: regex
```

**Updated WIP Document**:
- ✅ Revised goal section (server-side focus)
- ✅ Expanded overall plan (5 phases instead of vertical slices)
- ✅ Updated current focus (Phase 1 infrastructure)
- ✅ Added MatchStrategy API examples
- ✅ Replaced referer tests with realistic server-side scenarios
- ✅ Updated acceptance criteria (phase-by-phase)
- ✅ Added session log entry (this section)

**Next Steps**:
- Define MatchStrategy type in core/src/types/
- Implement string matching functions (contains, startsWith, endsWith)
- Implement regex matching function with timeout
- Then proceed phase-by-phase (headers → query → URL → integration)

**Key Insight Documented**:
The referer pattern from Acquisition.Web was a red herring. Real server-side testing needs matching on what backend code controls: endpoint URLs, query params, and custom headers. This is a BETTER feature that solves more real-world problems.

### 2025-11-15 - Session 4
**Duration**: 1 hour

**CRITICAL CORRECTION: ATDD Tests Must Reflect Server-Side Reality**

**The Problem**: Initial Playwright tests used `page.setExtraHTTPHeaders({ referer: ... })` to test referer matching. This was fundamentally wrong for server-side MSW testing.

**Why Wrong**:
- `setExtraHTTPHeaders()` sets **browser request headers** (browser → Next.js server)
- Server-side MSW intercepts **server-side fetch calls** (Next.js server → localhost:3001)
- Referer header from browser doesn't propagate to server-side fetch
- Artificially injecting headers != realistic server-side pattern

**The Fix**: Changed to realistic campaign tracking scenario:

**BEFORE (Artificial Pattern)**:
```typescript
// Browser-side header injection (not server-side)
await page.setExtraHTTPHeaders({ referer: 'https://example.com/premium' });
await page.goto('/products');

// Scenario matched on referer (not realistic for server-side fetch)
{
  match: {
    headers: {
      referer: { regex: { source: '/premium|/vip', flags: 'i' } }
    }
  }
}
```

**AFTER (Realistic Server-Side Pattern)**:
```typescript
// Query param drives server-side header
await page.goto('/products?campaign=summer-premium-sale');

// API route extracts campaign, adds as x-campaign header to fetch
const campaign = searchParams.get('campaign');
const response = await fetch('http://localhost:3001/products', {
  headers: { 'x-campaign': campaign }
});

// Scenario matches on x-campaign (server-side header)
{
  match: {
    headers: {
      'x-campaign': { regex: { source: 'premium|vip', flags: 'i' } }
    }
  }
}
```

**Files Updated**:
- ✅ `lib/scenarios.ts` - refererRegexScenario → campaignRegexScenario
- ✅ `app/api/products/route.ts` - Extract campaign from query, add to fetch headers
- ✅ `tests/playwright/regex-matching.spec.ts` - All 5 tests use query params
- ✅ Flow documented in test comments (query param → API extracts → server-side fetch)

**RED Phase Status**:
```
Error: Invalid input: expected string, received object
Path: ["campaignRegex", "mocks", 0, "match", "headers", "x-campaign"]
```

**Why This Error is Correct**:
- ✅ Schema validation working (Zod catching type mismatch)
- ✅ Regex syntax not yet supported in MatchCriteria
- ✅ Proves trust boundary validation working
- ✅ Perfect RED phase for ATDD outside-in approach

**Test Coverage**: 5 Playwright tests failing correctly:
1. Premium campaign match (`summer-premium-sale`)
2. VIP campaign match (`vip-early-access` - case insensitive)
3. No match (standard campaign)
4. Missing campaign param (fallback to default)
5. Partial match (`premium-lite` contains `premium`)

**Next Steps**:
- Ready for Phase 1 implementation (Core Infrastructure)
- Update MatchCriteria schema to support regex objects
- Implement regex matching logic
- Integrate with ResponseSelector
- Tests will turn GREEN

**Key Lesson**: ATDD tests must reflect ACTUAL server-side patterns, not artificial browser header injection. Campaign tracking via query params is a realistic server-side pattern that demonstrates regex value.

## Files to Create/Modify

**ADAPTER: Next.js App Router Example (ATDD - Step 1):** ✅ COMPLETE
- ✅ `apps/nextjs-app-router-example/lib/scenarios.ts` (MODIFIED - added refererRegexScenario)
- ✅ `apps/nextjs-app-router-example/tests/playwright/regex-matching.spec.ts` (NEW - 5 Playwright tests)
- ✅ `apps/nextjs-app-router-example/app/api/products/route.ts` (MODIFIED - comment updated)
- ✅ `packages/nextjs-adapter/src/app/setup.ts` (MODIFIED - extended getHeaders() helper)
- ✅ `packages/nextjs-adapter/tests/app/app-setup.test.ts` (MODIFIED - added 4 helper tests)

**CORE: SCHEMAS (TDD - Step 2):** ✅ COMPLETE
- ✅ `packages/core/src/schemas/match-criteria.ts` (NEW - SerializedRegexSchema)
- ✅ `packages/core/tests/schemas/match-criteria.test.ts` (NEW - 10 schema tests)
- ✅ `packages/core/src/schemas/index.ts` (MODIFIED - exported schema)
- ✅ `packages/core/package.json` (MODIFIED - added redos-detector dependency)

**CORE: TYPES (Step 3):** ⏳ PENDING
- [ ] `packages/core/src/types/match-criteria.ts` (MODIFY)
  - Layer: TYPES (data structures)
  - Purpose: Add regex to MatchValue type union
  - Change: `type MatchValue = string | MatchValueObject;`
  - Status: Ready to implement alongside domain logic

**CORE: DOMAIN (TDD - Steps 3-4):** ⏳ NEXT
- [ ] `packages/core/src/domain/regex-matching.ts` (NEW)
  - Layer: DOMAIN (business logic)
  - Purpose: Regex matching functions with timeout protection
  - Technology: Pure functions, RegExp, error handling
  - Status: **NEXT - invoke TDD agent**

- [ ] `packages/core/src/domain/response-selector.ts` (MODIFY)
  - Layer: DOMAIN (business logic)
  - Purpose: Integrate regex matching into selection algorithm
  - Change: Call matchesRegex() when MatchValue is object with regex
  - Status: After regex-matching.ts implementation

- [ ] `packages/core/tests/domain/regex-matching.test.ts` (NEW)
  - Layer: DOMAIN (unit tests)
  - Purpose: Verify matching logic and timeout protection
  - Status: Part of TDD cycle with implementation

- [ ] `packages/core/tests/response-selector.test.ts` (MODIFY)
  - Layer: DOMAIN (integration tests)
  - Purpose: Verify regex integrates correctly with specificity selection
  - Status: After ResponseSelector integration

**DOCUMENTATION (Step 5):**
- `docs/core-functionality.md` (UPDATE)
  - Add regex matching section
  - Explain security considerations (ReDoS, timeout)
  
- `CLAUDE.md` (UPDATE)
  - Capture learnings about architectural layers
  - Document ReDoS protection pattern

## Revised Acceptance Criteria (Expanded Scope)

**Phase 1: Core Infrastructure**
- [x] SerializedRegexSchema validates source and flags ✅
- [x] ReDoS vulnerable patterns rejected ✅
- [x] Invalid flags rejected ✅
- [ ] MatchStrategy type defined (string | MatchStrategyObject)
- [ ] String matching functions (contains, startsWith, endsWith)
- [ ] Regex matching function with timeout protection
- [ ] 100% unit test coverage for matching functions

**Phase 2: Header Matching**
- [ ] MatchCriteria.headers supports MatchStrategy
- [ ] Integration with matchesCriteria()
- [ ] E2E test with x-campaign header
- [ ] Backward compatibility (string headers still work)

**Phase 3: Query Parameter Matching**
- [ ] MatchCriteria.query supports MatchStrategy
- [ ] Integration with query parameter logic
- [ ] E2E test with category query param
- [ ] Backward compatibility (string query params still work)

**Phase 4: URL Matching**
- [ ] Mock.url supports string | MatchStrategy
- [ ] Integration with URL matching logic
- [ ] E2E test with URL pattern
- [ ] Backward compatibility (string URLs still work)

**Phase 5: Integration**
- [ ] Combined E2E test (URL + headers + query)
- [ ] All existing 281+ tests still passing
- [ ] No performance degradation
- [ ] TypeScript types fully inferred
- [ ] Documentation updated with realistic examples

**Security (All Phases):**
- [x] ReDoS validation at schema layer ✅
- [ ] Timeout protection (100ms) in regex matching
- [x] Clear error messages for unsafe patterns ✅
- [ ] No crashes on malformed input

## Architectural Boundaries

**What Changes Where:**

**CORE (Hexagon):**
- ✅ New schema for regex validation (SCHEMAS)
- ✅ New type for MatchValue extension (TYPES)
- ✅ New domain logic for regex matching (DOMAIN)
- ❌ NO changes to PORTS (existing RequestContext sufficient)

**ADAPTERS (Framework Integrations):**
- ✅ New test scenarios (Next.js example app)
- ✅ New E2E tests (Playwright)
- ❌ NO changes to MSW adapter (passes scenarios through)
- ❌ NO changes to Next.js adapter (passes scenarios through)

**Why Adapters Don't Change:**
- Adapters are thin translation layers
- They pass ScenaristScenario objects to core
- Core's ResponseSelector handles all matching logic
- Adapters just provide RequestContext (already contains headers)

**This proves hexagonal architecture is working:**
- New feature added entirely in CORE
- Adapters unaffected (thin, decoupled)
- Tests added at ADAPTER layer prove integration

## Red Flags to Watch For

**Architectural Violations:**
- ❌ Adding regex logic to ADAPTER layer (should be in CORE: DOMAIN)
- ❌ Adding validation to DOMAIN layer (should be in CORE: SCHEMAS)
- ❌ Creating new PORTS when existing ones sufficient
- ❌ Modifying MSW/Next.js adapters (should pass through)

**TDD Violations:**
- ❌ Writing implementation before test
- ❌ Skipping RED phase verification
- ❌ Adding features not driven by tests
- ❌ Speculative code without failing test

**Coverage Gaps:**
- ❌ Schema validation edge cases not tested
- ❌ Timeout protection not verified
- ❌ Error handling paths not covered
- ❌ Backward compatibility not proven

**Security Issues:**
- ❌ ReDoS patterns not caught by validation
- ❌ Timeout not enforced
- ❌ Invalid regex crashes at runtime
- ❌ User input directly in regex (not applicable - scenarios are authored)

## Success Metrics

**Completion Criteria:**
- ✅ Playwright test passes (referer regex matching)
- ✅ 100% unit test coverage (core package)
- ✅ All existing tests passing (281+ tests)
- ✅ ReDoS protection verified
- ✅ Timeout protection verified
- ✅ Backward compatible (no breaking changes)
- ✅ TypeScript strict mode satisfied
- ✅ Documentation updated

**Architectural Validation:**
- ✅ All new domain logic in CORE package
- ✅ No adapter modifications (pass-through confirmed)
- ✅ Schemas at trust boundaries only
- ✅ Pure functions in DOMAIN layer
- ✅ Immutable types in TYPES layer

**Quality Gates:**
- Tests must pass on first implementation (proves TDD)
- No type assertions without justification
- No `any` types
- No commented-out code
- Clear commit messages showing RED → GREEN → REFACTOR

## Notes for Next Session

**If resuming later:**
1. Check "Current Focus" section for last completed step
2. Review "Session Log" for context
3. Verify all agent checkpoints completed for current step
4. Continue from "Next Steps" list
5. **ALWAYS identify which layer you're working in**

**Remember:**
- ATDD = Start with failing E2E test (ADAPTER)
- TDD = Red → Green → Refactor for each unit (CORE)
- Vertical slice = ONE feature only (regex)
- Don't add contains/startsWith/endsWith yet
- Security first (ReDoS in SCHEMAS, timeout in DOMAIN)
- 100% coverage required
- **CRITICAL**: Map every file to its architectural layer

**Hexagonal Architecture Reminder:**
- CORE = Domain logic + Types + Schemas + Ports
- ADAPTERS = Framework integrations (thin, pass-through)
- Changes should happen in CORE (hexagon)
- Adapters should rarely need modification
