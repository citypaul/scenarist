# Scenarist Documentation: Comprehensive Research Summary

## Framework Testing Challenges (Direct Quotes from Docs)

### Next.js App Router
**Official Quote (from docs/plans/documentation-site.md):**
> "Since async Server Components are new to the React ecosystem, some tools do not fully support them. In the meantime, we recommend using End-to-End Testing over Unit Testing for async components."
> — Next.js Official Docs

**Translation in docs:** "Jest doesn't support RSC. Spawn a new Next.js instance per test. Hope it works."

**Additional Pain Points Documented:**
- MSW beta setup required with `remote.enabled: true`
- Aggressive caching defaults cause confusion
- High internal knowledge requirement

### Remix
**Official Quote:**
> "At the time of this writing, there aren't standard ways of testing components that have Remix code."
> — Remix Testing Documentation

**Translation:** "Test loaders separately from components. Hope they integrate correctly. Rely on slow E2E tests."

### TanStack Router
**Documentation notes:**
> "The official docs don't mention testing at all"
> — GitHub Discussion #655

**Translation:** "You're on your own. Create custom helpers. Reinvent the wheel for every project."

### Universal E2E Crisis (Across ALL frameworks)
**From documentation-site.md:**
1. **Test Pollution** - Shared MSW handlers cause flaky tests
2. **Scattered Mocks** - Copy-paste across 50 test files
3. **Sequential Execution** - Can't parallelize (slow suites)
4. **App Restart Hell** - No runtime scenario switching

---

## Documentation Writing Principles (Session Learnings)

### Critical Principle: Accuracy Over Absolutism

**The Problem:** Early documentation used absolute statements like "unit tests CAN'T test server-side logic"

**The Reality (from documentation-site.md):**
```markdown
❌ BAD: "Unit tests can't test server-side context"
✅ GOOD: "Unit tests CAN test server-side logic, but it's painful and risky"

❌ BAD: "Unit tests don't cover HTTP integration"
✅ GOOD: "Unit tests require extensive mocking at the code level, creating distance from production reality"
```

**Key Insight:**
"Your code runs as part of user journeys with real sessions, auth context, and middleware in production—but you're testing it either in isolation (unit tests) or only for happy path (browser tests). Browser-based testing with real server execution is closer to how code actually runs."

### No Marketing Fluff

**Guidelines:**
- Don't use "77% boilerplate reduction" or similar statistics
- Don't use "10x faster" without context
- Don't use hyperbolic language
- Let code speak for itself

**Example:**
```markdown
❌ BAD:
**Code Reduction: 77%** - From 9 lines to 2 lines

✅ GOOD:
**Without helpers:**
[9 lines of code]

**With helpers:**
[2 lines of code]
```

### Landing Page vs. Docs Separation

**Landing Page = High-Level Bullet Points:**
- Concise, decision-making focused
- 1-2 lines per concept
- Lead with pain, show solution briefly

**Docs Pages = Detailed Explanations:**
- Full technical details
- Code examples with context
- "How" and "Why" deep dives

**Rule:** If explanation requires more than 3-4 lines, it belongs in docs, not landing page.

### The Realistic Testing Gap Framing

**What teams actually do:**
- Unit tests (Jest/Vitest) → Test functions in isolation
- Browser tests (Playwright/Cypress) → Test happy path only

**The critical gap:**
Unit tests CAN test server-side logic, but:
- Requires extensive code-level mocking (sessions, auth, request objects)
- Mocks create distance from production reality
- Easy to introduce bugs that only surface in real user journeys

Browser tests capture real execution, but:
- Limited to 1-2 scenarios (happy path)
- Testing multiple scenarios requires complex setup OR server restarts

**Scenarist positioning:**
Test all scenarios (error cases, edge cases, different user states) through real HTTP requests with real server-side execution (sessions, middleware, Server Components), while mocking only external APIs.

### Framework-Agnostic Positioning

**The Mistake:**
Early positioning made Scenarist look like it was "primarily for Next.js/Server Components"

**The Reality:**
Scenarist works with ANY Node.js framework:
- Express, Hono, Fastify (pure backend APIs)
- Next.js (Pages Router + App Router)
- Remix, SvelteKit (future)
- TanStack Router (future)

**Server Components is ONE use case** among many:
- API routes (all frameworks)
- Middleware chains (all frameworks)
- Validation logic (all frameworks)
- SSR (Next.js, Remix, SvelteKit)
- Server Components (Next.js App Router)
- Business logic (all frameworks)

**Correct opening:**
```markdown
Whether you're building with **Express**, **Hono**, **Fastify**, **Next.js**, or **Remix**...
```

**Not:**
```markdown
Test Next.js Server Components without Jest...
```

---

## Tone & Voice Guidelines

**Primary Tone:** Empathetic, competent, honest

**Characteristics:**
- **Empathetic** - "We know testing Next.js is painful"
- **Direct** - Get to the point quickly
- **Practical** - Show working code, not theory
- **Honest** - Acknowledge trade-offs, don't oversell
- **Encouraging** - Build confidence, celebrate progress

---

## Key Value Propositions (From Docs)

### The Testing Gap Scenarist Fills
**From why-scenarist.md:**
- Tests make real HTTP requests to your backend
- Your backend code executes normally (middleware, routing, business logic)
- External API calls are intercepted and return scenario-defined responses
- Different scenarios run in parallel against the same server instance
- Each test is isolated via unique test identifiers

### Three Core Pillars
1. **Real Execution** - Your Server Components render, middleware runs, validation executes—all for real
2. **Controlled Scenarios** - External APIs mocked via MSW (Stripe, Auth0, SendGrid)
3. **Runtime Switching** - Change scenarios instantly without restarting your server

### Current Documentation Coverage

**Strengths:**
- Excellent problem/solution framing
- Real quotes from official documentation
- Clear before/after code comparisons
- Framework-agnostic positioning
- Links between landing page and detailed docs

**Where docs live:**
- `/apps/docs/src/content/docs/index.mdx` - Homepage (splash page with framework tabs)
- `/apps/docs/src/content/docs/introduction/why-scenarist.md` - Why Scenarist
- `/docs/plans/documentation-site.md` - Complete documentation site plan (APPROVED)
- `README.md`, `apps/docs/README.md` - Package-level documentation

---

## Content Hierarchy Decision Framework

**When writing documentation, ask:**

1. **Is this information essential for decision-making?**
   - YES → Landing page (bullet point)
   - NO → Docs page (detailed explanation)

2. **Can this be explained in 1-2 lines?**
   - YES → Landing page
   - NO → Docs page

3. **Does this explain HOW it works technically?**
   - YES → Docs page
   - NO → Could be landing page

4. **Would a developer skip this if they're just evaluating?**
   - YES → Docs page
   - NO → Landing page

---

## What Makes Documentation Credible

**From DOCUMENTATION_UPDATE_SUMMARY.md, the target is 9/10 quality:**

### Must-Have (All present):
- Clear problem/solution framing
- Complete capability list (framework-specific features)
- Framework-specific examples
- Self-contained (no required external reading)
- Links to detailed docs for deep dives
- Quick start guide (< 5 minutes)

### Nice-to-Have (Some present):
- Visual diagrams/architecture drawings
- Video walkthroughs
- Comparison tables vs alternatives
- Interactive examples/playground links
- Troubleshooting flowcharts

### Next Level (10/10):
- Comprehensive edge case examples
- Framework-specific gotchas documented
- Performance benchmarks
- Migration guides from competitors
- Visual architecture diagrams
- Community examples gallery

---

## Current Documentation Structure

### Homepage (Splash Page)
- **Pattern:** Framework tabs showing complete 4-step examples
- **Frameworks covered:** Express, Next.js Pages, Next.js App Router
- **Content:** Quick examples + problem/solution comparison + use cases

### Documentation Site Plan (Approved)
**Navigation Strategy:**
- Pain-first ordering: Framework Guides BEFORE Core Concepts
- Progressive disclosure: Quick Start → Framework Guide → Features → Recipes → Reference
- Framework selector widget on homepage
- Architecture hidden in Contributing section

**Key principle from docs:**
> "Developers don't adopt libraries because of clever architecture. They adopt libraries because **their current solution is painful and your solution is better**."

### Pages with Framework Testing Challenges
1. `/introduction/why-scenarist.md` - HTTP boundary testing gap
2. `/frameworks/nextjs/*` - RSC testing without Jest
3. `/frameworks/express/*` - Async/middleware testing
4. `/frameworks/remix/*` (future) - Loader/action testing
5. `/frameworks/tanstack-router/*` (future) - Router testing

---

## Examples of How Docs Frame Problems

### Next.js Issue Framing
**From index.mdx and why-scenarist.md:**
```markdown
## The Framework Mocking Problem

Unit tests for backend code require extensive mocking of framework internals—Request objects, cookies, headers, session stores. This creates brittle tests that don't match production behavior.

**Scenarist lets your actual backend code execute.** No framework mocking required.
```

### Before/After Code Patterns
**Structure used throughout:**
1. ❌ The painful way (unit test with mocks OR E2E spawn)
2. ✅ The Scenarist way
3. Impact bullets (10x faster, zero flakes, etc.)

---

## Content Migration Status

**From documentation-site.md:**
All existing content has a planned destination:
- `core-functionality.md` → Core Concepts section
- `stateful-mocks.md` → Features → Stateful Mocks
- `api-reference-state.md` → API Reference → StateManager
- `testing-guidelines.md` → Recipes → Testing Patterns
- Package READMEs → Framework Guides
- `docs/adrs/` → Contributing → ADRs

---

## Key Insight: Documentation is User-Focused

**From documentation-site.md:**
> "Developers don't adopt libraries because of clever architecture. They adopt libraries because **their current solution is painful and your solution is better**.
>
> Scenarist solves REAL pain:
> - Next.js App Router testing is broken
> - Remix testing is an afterthought
> - TanStack Router testing is undocumented
> - MSW alone causes test pollution
> - E2E tests are slow and brittle
>
> **Our documentation must lead with this pain, not with hexagonal architecture.**"

