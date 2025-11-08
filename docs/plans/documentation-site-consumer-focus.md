# Documentation Site Plan - Consumer-Focused Addendum

## Research: Why Testing Modern Frameworks Is Broken

### The Real Problem: Testability as an Afterthought

Modern frameworks (Next.js, Remix, TanStack) prioritize **developer experience for building features** over **developer experience for testing features**. The result is a testing nightmare that forces developers into painful trade-offs.

---

## Framework-Specific Pain Points (2024-2025 Research)

### Next.js App Router

**The Testing Situation:**

> "Since async Server Components are new to the React ecosystem, some tools do not fully support them. In the meantime, we recommend using End-to-End Testing over Unit Testing for async components."
> — Next.js Official Docs

**What This Actually Means:**
- ❌ Jest doesn't support React Server Components testing
- ❌ Attempting to render RSC in Jest: `"Objects are not valid as a React child (found: [object Promise])"`
- ❌ Testing requires spawning a new Next.js instance PER TEST for proper isolation
- ❌ MSW beta setup required with `remote.enabled: true` just to mock server-side requests
- ❌ "Work-in-progress, beta features, subjected to change. Please do not use in production."

**Additional Pain:**
- **Aggressive Caching Defaults**: "You thought you made an API call, but you didn't, and you are just reading a cached result." (opt-out instead of opt-in)
- **Cookie Handling Surprises**: `cookies().set("key", "value")` type-checks everywhere but fails at runtime in certain contexts
- **High Internal Knowledge Requirement**: Must understand extensive framework internals to accomplish basic tasks

**Developer Quote:**
> "It's not just you, Next.js is getting harder to use... There are many ways to shoot yourself in the foot that are opt-out instead of opt-in."
> — PropelAuth Blog, March 2025

### Remix

**The Testing Situation:**

> "At the time of this writing, there aren't standard ways of testing components that have Remix code, so developers are testing their business logic, loaders and actions separately."
> — Remix Testing Documentation

**What This Means:**
- ❌ No standard way to test components with Remix code
- ❌ SSR testing requires E2E tools (Cypress, Playwright) for "comprehensive" coverage
- ❌ Integration tests complex without mocking client-side OR server-side code
- ❌ Developers forced to test loaders/actions separately from components

**The Workaround Tax:**
- Build custom test helpers for every project
- Test business logic separately from UI (hope they integrate correctly)
- Rely heavily on E2E tests (slow, brittle)

### TanStack Router

**The Testing Situation:**

> "The official docs don't mention testing at all"
> — GitHub Discussion #655

**What Developers Face:**
- ❌ Router requires full boot-up for testing (can't mock hooks)
- ❌ All hooks depend on `useMatch`, which requires real route-tree (no mocking)
- ❌ Tests involving full route rendering: "couple 100s ms" EACH
- ❌ File route exports get mangled in tests (`path` and `id` become `undefined`)
- ❌ Different behavior in local tests vs. CI/CD
- ❌ Storybook integration broken

**Developer Quote:**
> "The easiest thing is to create a minimal router with the route you need to render. For jest unit tests, I have a renderWithTanStack helper function to wrap the component under test."
> — Developer workaround (every team reinvents this)

---

## The Universal E2E Testing Crisis

Across ALL modern frameworks, E2E testing faces the same problems:

### 1. **Test Pollution (Shared State)**

**The Problem:**
```typescript
// Global MSW handlers - SHARED across all tests
beforeAll(() => {
  server.use(
    http.get('/api/user', () => HttpResponse.json({ role: 'admin' }))
  );
});

// Test 1 expects admin
it('admin dashboard', () => { /* passes */ });

// Test 2 expects guest - BUT GETS ADMIN (pollution!)
it('guest landing', () => { /* fails - why is user admin?? */ });
```

**Why It Happens:**
- MSW handlers are global by default
- `beforeAll`/`beforeEach` create shared state
- Tests can't declare their scenario in isolation
- Changing handlers in one test affects others

**The Impact:**
- ❌ Flaky tests (pass/fail randomly)
- ❌ Must run tests sequentially (slow)
- ❌ Hard to debug ("which test polluted my state?")
- ❌ Fear of changing test setup (might break unrelated tests)

### 2. **Brittle Test Suites (Scattered Mock Setup)**

**The Problem:**
```typescript
// Mock setup scattered across 50 test files
// payments.test.ts
beforeEach(() => {
  server.use(http.post('/api/payments', () => {/* ... */}));
});

// checkout.test.ts
beforeEach(() => {
  server.use(http.post('/api/payments', () => {/* ... */})); // DUPLICATED!
});

// orders.test.ts
beforeEach(() => {
  server.use(http.post('/api/payments', () => {/* ... */})); // DUPLICATED AGAIN!
});
```

**Why It Happens:**
- No reusable scenario definitions
- Mocks defined inline in each test file
- Copy-paste across test suites
- No single source of truth

**The Impact:**
- ❌ Update payment response? Change 50 files
- ❌ Tests drift (same endpoint, different mocks)
- ❌ Unclear what backend state test expects
- ❌ Hard to onboard ("where are the mocks?")

### 3. **Slow Test Suites (Sequential Execution)**

**The Problem:**
```typescript
// Can't run in parallel - tests interfere
// 50 tests × 2 seconds each = 100 seconds (1.7 minutes)

// Must run sequentially:
test.describe.serial(() => {
  it('test 1', () => {/* 2s */});
  it('test 2', () => {/* 2s */});
  it('test 3', () => {/* 2s */});
  // ...
  it('test 50', () => {/* 2s */});
});
```

**Why It Happens:**
- Shared global state (MSW handlers)
- No test isolation
- Parallel execution causes race conditions
- Must serialize to avoid pollution

**The Impact:**
- ❌ Feedback loop: Minutes instead of seconds
- ❌ CI/CD slowdown (blocks deployments)
- ❌ Developers skip running tests locally
- ❌ Test suite grows slower over time

### 4. **App Restart Hell (Static Configuration)**

**The Problem:**
```bash
# Want to test error scenario?
# 1. Stop dev server
# 2. Change mock configuration
# 3. Restart dev server (10+ seconds)
# 4. Manually trigger error
# 5. Repeat for each scenario...
```

**Why It Happens:**
- MSW handlers set up at app boot
- No runtime scenario switching
- Can't change backend state without restart

**The Impact:**
- ❌ Manual testing takes FOREVER
- ❌ Can't demo different scenarios easily
- ❌ Development flow constantly interrupted
- ❌ Error scenarios rarely tested (too painful)

---

## What Scenarist Actually Solves

### For Next.js App Router Users

**Instead of:**
- ❌ Spawning new Next.js instance per test
- ❌ Beta MSW setup with `remote.enabled: true`
- ❌ Workarounds for RSC testing

**You Get:**
- ✅ Test Route Handlers directly (skip RSC complexity)
- ✅ Standard MSW setup (Scenarist handles remote server)
- ✅ Parallel tests work out of the box

### For Remix Users

**Instead of:**
- ❌ Testing loaders/actions separately from components
- ❌ Complex integration tests with client/server mocking
- ❌ Heavy reliance on slow E2E tests

**You Get:**
- ✅ Test loaders/actions with reusable scenarios
- ✅ Integration tests with declarative mock setup
- ✅ Fast unit tests + targeted E2E tests

### For TanStack Router Users

**Instead of:**
- ❌ Creating minimal routers for every test
- ❌ Custom `renderWithTanStack` helpers per project
- ❌ Slow tests (100s of ms each)

**You Get:**
- ✅ Reusable router scenarios
- ✅ Standard setup across all projects
- ✅ Fast parallel execution

### For EVERYONE

**Instead of:**
- ❌ Test pollution (shared MSW handlers)
- ❌ Scattered mock setup (copy-paste everywhere)
- ❌ Sequential execution (slow)
- ❌ App restarts (manual testing hell)

**You Get:**
- ✅ **Test Isolation** - Each test declares its scenario, no interference
- ✅ **Reusable Scenarios** - Define once, use everywhere, version control
- ✅ **Parallel Execution** - 10x faster test suites
- ✅ **Runtime Switching** - Change scenarios without restarts

---

## Documentation Refocus: Lead With Pain, Not Architecture

### OLD Approach (Architecture-First)

```markdown
# Scenarist

Scenarist is a hexagonal architecture library with ports and adapters...

## Architecture
- Core domain with dependency injection
- Serializable scenario definitions
- Port interfaces for storage...
```

**Problem:** Consumers don't care about hexagonal architecture. They care about **fast, reliable tests**.

### NEW Approach (Pain-First)

```markdown
# Scenarist

**Stop fighting your framework's testing story.**

Modern frameworks (Next.js, Remix, TanStack) make building features easy but testing them hard. Scenarist fixes E2E testing's biggest pain points:

## Before Scenarist
- ❌ Tests pollute each other (shared MSW handlers)
- ❌ Must run tests sequentially (slow)
- ❌ Mocks scattered across 50 files
- ❌ Restart app to test different scenarios

## After Scenarist
- ✅ Each test isolated (declare scenario per test)
- ✅ Tests run in parallel (10x faster)
- ✅ Scenarios reusable (define once, use everywhere)
- ✅ Runtime scenario switching (no restarts)
```

**Why It Works:** Immediately relatable. Every Next.js/Remix/TanStack developer has felt this pain.

---

## Updated Content Priorities

### Phase 1: Essential (Week 1)

**OLD:**
1. Homepage (value proposition, quick links)
2. Why Scenarist? (problem/solution)
3. Quick Start
4. Core Concepts: Scenarios & Variants
5. Core Concepts: Hexagonal Architecture ← REMOVE

**NEW:**
1. **Homepage: The Testing Crisis**
   - Lead with framework-specific pain
   - "Testing Next.js App Router is broken. Here's why."
   - Real quotes from developers (GitHub issues, Stack Overflow)
   - Before/after code examples

2. **Why Scenarist: Framework Testing Is An Afterthought**
   - Section per framework (Next.js, Remix, TanStack)
   - What the docs recommend (E2E everything)
   - Why that's painful (slow, brittle, pollution)
   - How Scenarist fixes it

3. **Quick Start**
   - Framework selector FIRST (Next.js / Remix / Express)
   - "Get from broken tests to working tests in 5 minutes"

4. **Core Concepts: Scenarios & Test Isolation**
   - Focus on **WHAT** (scenarios eliminate pollution)
   - Focus on **WHY** (parallel execution, reusable)
   - Skip **HOW** (hexagonal architecture) ← Move to Contributors

### Phase 2-4: De-emphasize Architecture

**Move to "Contributing" Section:**
- Hexagonal Architecture
- Ports & Adapters
- Dependency Injection
- Serialization Principle

**Why:** Consumers don't need to understand ports/adapters to USE Scenarist. Only contributors building custom adapters need this.

**Keep Visible:**
- Framework guides (Next.js, Remix, Express)
- Features (Request Matching, Sequences, Stateful Mocks)
- Recipes (Authentication, Payments, Polling)
- API Reference

---

## Homepage Rewrite: Pain-First Approach

### Hero Section

```markdown
# Testing Next.js, Remix, and TanStack Is Broken.

**Scenarist fixes it.**

Modern frameworks make building features easy but testing them painful. You're stuck with:
- ❌ Flaky tests from shared MSW handlers
- ❌ Sequential execution (tests can't run in parallel)
- ❌ Scattered mocks across 50 test files
- ❌ Restarting your app to test different scenarios

**Scenarist eliminates E2E testing's biggest pain points in any framework.**

[Try Quick Start →] [Why Is Testing Broken? →] [See Examples →]
```

### The Pain Section (Before/After)

```markdown
## The Problem: Framework Testing Is An Afterthought

### Next.js App Router

> "Since async Server Components are new to the React ecosystem, some tools do not fully support them. In the meantime, we recommend using End-to-End Testing over Unit Testing for async components."
> — Next.js Official Docs

**Translation:** Jest doesn't support RSC. Spawn a new Next.js instance per test. Hope it works.

### Remix

> "At the time of this writing, there aren't standard ways of testing components that have Remix code."
> — Remix Testing Docs

**Translation:** Test loaders separately from components. Hope they integrate correctly. Rely on slow E2E tests.

### TanStack Router

> "The official docs don't mention testing at all"
> — TanStack Router Developers

**Translation:** You're on your own. Create custom helpers. Reinvent the wheel for every project.

---

**The Result:** Developers spend more time fighting their test setup than building features.

**Without Scenarist:**
```typescript
// ❌ Global MSW handlers - shared state
beforeAll(() => {
  server.use(http.get('/api/user', () => HttpResponse.json({ role: 'admin' })));
});

// Tests interfere with each other
it('test 1: admin view', () => {/* passes */});
it('test 2: guest view', () => {/* FAILS - sees admin! */});

// Must run sequentially (slow)
// Must restart app to test errors (painful)
// Mocks duplicated across 50 files (brittle)
```

**With Scenarist:**
```typescript
// ✅ Isolated scenarios - no shared state
it('test 1: admin view', async () => {
  await setScenario('admin-user', { testId: 'test-1' });
  // Test with admin scenario
});

it('test 2: guest view', async () => {
  await setScenario('guest-user', { testId: 'test-2' });
  // Test with guest scenario - no interference!
});

// Tests run in parallel (10x faster)
// Switch scenarios at runtime (no restarts)
// Scenarios reusable (define once, use everywhere)
```

**Impact:**
- ✅ Tests run in parallel: **10x faster**
- ✅ Zero flaky tests: **test isolation**
- ✅ Clear scenarios: **self-documenting**
- ✅ Runtime switching: **no app restarts**
```

### Framework Support Section

```markdown
## Works With Your Framework

Scenarist is built on MSW but adds the test isolation and scenario management your framework forgot.

**Next.js** (Pages Router, App Router)
- Test Route Handlers without spawning new Next.js instances
- Parallel tests work out of the box
- No beta MSW setup required

**Remix**
- Test loaders/actions with reusable scenarios
- Integration tests without complex client/server mocking
- Fast unit tests + targeted E2E tests

**Express**
- Test middleware and routes with declarative scenarios
- Parallel test execution
- Runtime scenario switching for manual testing

**TanStack Router** (Coming Soon)
- Standard router testing setup
- Reusable router scenarios
- Fast parallel execution

**Build Your Own Adapter**
- Framework-agnostic core
- Hexagonal architecture
- Swap frameworks, swap storage (in-memory → Redis)
```

---

## Key Documentation Changes

### 1. Move Architecture to Contributors Section

**Current:** Architecture is prominently featured in main navigation

**Change:** Move to bottom-level "Contributing" section

**Reason:** Only contributors building custom adapters need hexagonal architecture details. Consumers just want their tests to work.

### 2. Lead Every Page With Pain

**Pattern for Every Feature Page:**

```markdown
# Feature Name

## The Problem [Framework] Developers Face

[Specific pain point with real quote/example]

## How Scenarist Solves It

[Before/after code example]

## How It Works

[Technical details]
```

**Example - Request Matching Page:**

```markdown
# Request Matching

## The Problem: One Endpoint, Multiple Scenarios

Testing `/api/items` for premium vs. standard users means duplicating mock setup:

```typescript
// ❌ Without Scenarist: Duplicate mocks everywhere
// premium-tests.ts
beforeEach(() => {
  server.use(http.get('/api/items', () => HttpResponse.json({
    items: [/* premium items */]
  })));
});

// standard-tests.ts
beforeEach(() => {
  server.use(http.get('/api/items', () => HttpResponse.json({
    items: [/* standard items */]  // DUPLICATED!
  })));
});
```

**The Problem:** Change the response shape? Update every test file.

## How Scenarist Solves It

```typescript
// ✅ With Scenarist: Define scenarios once, match by headers
{
  mocks: [
    {
      method: 'GET',
      url: '/api/items',
      match: { headers: { 'x-tier': 'premium' } },
      response: { body: { items: [/* premium items */] } }
    },
    {
      method: 'GET',
      url: '/api/items',
      match: { headers: { 'x-tier': 'standard' } },
      response: { body: { items: [/* standard items */] } }
    }
  ]
}

// Use in test
it('premium user', async () => {
  await setScenario('tiered-items', { testId: 'test-1' });
  const res = await fetch('/api/items', {
    headers: { 'x-tier': 'premium', 'x-test-id': 'test-1' }
  });
  // Gets premium items
});
```

## How It Works: Specificity-Based Selection

[Technical details about matching algorithm]
```

### 3. Framework-Specific Landing Pages

**Create dedicated landing pages:**
- `/docs/nextjs` - "Fix Next.js App Router Testing"
- `/docs/remix` - "Fix Remix Testing"
- `/docs/express` - "Fix Express Testing"

**Each page:**
1. Framework-specific pain points (with quotes/links)
2. What framework docs recommend (and why it's painful)
3. How Scenarist fixes it (before/after examples)
4. Quick Start for that framework
5. Link to full framework guide

**SEO Benefit:** Rank for "Next.js App Router testing problems", "Remix testing broken", etc.

---

## Success Metrics (Updated)

### Quantitative

**OLD:**
- Lighthouse score >90
- "Was this helpful?" >70%

**NEW:**
- **Framework-specific conversions:**
  - "Fix Next.js Testing" page → Quick Start conversion >40%
  - "Fix Remix Testing" page → Quick Start conversion >40%
- **Search rankings:**
  - Rank top 10 for "Next.js App Router testing problems"
  - Rank top 10 for "Remix testing challenges"
  - Rank top 10 for "MSW test pollution"

### Qualitative

**OLD:**
- User feedback via GitHub discussions

**NEW:**
- **Framework developer quotes:**
  - "Finally, Next.js testing that doesn't suck"
  - "Scenarist saved my Remix test suite"
- **Social proof:**
  - Mentions in framework communities (Next.js Discord, Remix Discord)
  - Blog posts from framework developers
  - Conference talk mentions

---

## Summary: Consumer-First Documentation

### Core Principles

1. **Lead With Pain** - Every page starts with the problem developers actually face
2. **Framework-Specific** - Speak to Next.js/Remix/TanStack developers directly
3. **Before/After** - Show the transformation, not just features
4. **Real Quotes** - Use actual developer frustrations from GitHub/Stack Overflow
5. **Architecture Last** - Move hexagonal design to Contributors section

### The Shift

**From:** "Here's our clever architecture"
**To:** "Here's your pain point. Here's how we fix it."

**From:** "Scenarist uses ports and adapters"
**To:** "Stop restarting your app to test error scenarios"

**From:** "Hexagonal design enables flexibility"
**To:** "Run 50 tests in 5 seconds instead of 50 seconds"

### Why It Matters

Developers don't adopt libraries because of clever architecture. They adopt libraries because **their current solution is painful and your solution is better**.

Scenarist solves REAL pain:
- Next.js App Router testing is broken
- Remix testing is an afterthought
- TanStack Router testing is undocumented
- MSW alone causes test pollution
- E2E tests are slow and brittle

**Our documentation must lead with this pain, not with hexagonal architecture.**

---

**Document Status:** ADDENDUM to documentation-site.md
**Created:** 2025-11-08
**Research Sources:** Next.js docs, Remix docs, TanStack GitHub, PropelAuth blog, Stack Overflow, GitHub discussions
**Next Action:** Review and integrate into main documentation plan
