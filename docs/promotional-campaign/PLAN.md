# Scenarist Promotional Campaign Plan

## Overview

A video + blog post series that sells Scenarist's value through **pain-first storytelling**. Videos are max 5 minutes, face + screen presentation. Each builds on the previous while remaining standalone valuable.

**Critical Messaging Principle:** Scenarist solves a **framework-agnostic problem**. The problem is NOT "testing Next.js Server Components" - that's just one manifestation. The REAL problem is testing **any server-side code that calls external APIs and manages state**.

## Target Audiences

1. **Engineers** (primary) - Developers doing integration testing with ANY Node.js framework
2. **Decision Makers** (secondary) - Tech leads/architects evaluating testing strategies
3. **QA Engineers** (tertiary) - Testing professionals seeking better tooling

---

## The Core Problem (Framework-Agnostic)

**The Real Pain: The Gap Between Isolated Tests and Real User Behavior**

Testing your server-side code in isolation is easy (supertest, jest).
Testing your frontend in isolation is easy (React Testing Library, jsdom).
But testing them **together** - proving that when your server returns X, your frontend actually does Y - that's where everything falls apart.

**Why?**

1. **Server-side state builds up over real user flows** - A checkout isn't one request. It's login → browse → add to cart → apply coupon → checkout. State accumulates. Order matters.

2. **Isolated server tests can't prove frontend behavior** - Your API test proves `/checkout` returns `{ error: "card_declined" }`. But does your React component show the error? Does the retry button work? Does the loading state clear?

3. **The only way to prove this is with a real browser + real server** - But then how do you control what Stripe/Auth0/SendGrid return?

**The Testing Gap Nobody Talks About:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE REAL TESTING GAP                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ISOLATED SERVER TESTS          ISOLATED FRONTEND TESTS             │
│  ─────────────────────          ─────────────────────────           │
│  ✅ API returns right JSON       ✅ Component renders with props     │
│  ✅ Business logic works         ✅ Click handlers fire              │
│  ✅ External APIs mocked         ✅ State updates correctly          │
│                                                                      │
│  BUT: Uses supertest/jest        BUT: Uses jsdom, not real browser  │
│  BUT: No real browser            BUT: No real server                │
│  BUT: Can't prove UI works       BUT: Uses fake data, not real API  │
│                                                                      │
│  ═══════════════════════════════════════════════════════════════    │
│                                                                      │
│                    THE GAP: REAL BROWSER + REAL SERVER              │
│                    ────────────────────────────────────             │
│                                                                      │
│  You need to prove:                                                 │
│  • User logs in (browser) → Session established (server)            │
│  • User adds to cart (browser) → Cart state accumulates (server)    │
│  • User checks out (browser) → Payment processed (server → Stripe)  │
│  • Payment declined (Stripe) → Error shown (browser)                │
│                                                                      │
│  But how do you control Stripe's response in a real browser test?   │
│  How do you test "payment declined" when Stripe is a real service?  │
│  How do you test "premium pricing" when Auth0 is a real service?    │
│                                                                      │
│               SCENARIST FILLS THIS GAP                              │
│                                                                      │
│  Real browser (Playwright) + Real server + Controlled external APIs │
│  Your server code executes. State accumulates. UI is verified.      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Additional Challenges (Documented in MSW Issues):**

- **Parallel test isolation** - [MSW Issue #474](https://github.com/mswjs/msw/issues/474): Mock state leaks between tests running in parallel
- **Next.js singleton issues** - [Next.js Discussion #68572](https://github.com/vercel/next.js/discussions/68572): Webpack bundling breaks singleton patterns, causing multiple MSW instances
- **Scattered mock definitions** - No centralized way to define and manage scenarios

**This problem exists in:**

- Express
- Fastify
- Hono
- Koa
- Next.js (App Router & Pages Router)
- Remix
- SvelteKit
- Any Node.js server that calls external APIs

**Scenarist is the solution, and it's designed to work with ALL of them.**

---

## Key Diagrams (For Videos & Blog Posts)

### Diagram 1: The Testing Gap

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE TESTING PYRAMID + THE GAP                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                              ▲                                       │
│                             /│\                                      │
│                            / │ \                                     │
│                           /  │  \    E2E Tests                       │
│                          /   │   \   • Real APIs (expensive, slow)   │
│                         /    │    \  • Can't control edge cases      │
│                        /─────│─────\ • Few scenarios possible        │
│                       /      │      \                                │
│           ┌─────────/────────│────────\─────────┐                   │
│           │   ░░░░░░░░░ THE GAP ░░░░░░░░░░░    │                   │
│           │   Real code + Controlled APIs?      │                   │
│           │   Server-side state testing?        │                   │
│           │   Order-dependent workflows?        │                   │
│           │   Parallel test isolation?          │                   │
│           │                                     │                   │
│           │      SCENARIST FILLS THIS GAP      │                   │
│           └─────────────────────────────────────┘                   │
│                      /            \                                  │
│                     /              \                                 │
│                    / Integration    \                                │
│                   /   Tests          \                               │
│                  /──────────────────────\                            │
│                 /                        \                           │
│                /     Unit Tests           \                          │
│               /  • Mocked everything       \                         │
│              /   • Fast but shallow         \                        │
│             /    • Isolated from reality     \                       │
│            ────────────────────────────────────                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Diagram 2: Framework Adapter Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│              SCENARIST: FRAMEWORK-AGNOSTIC ARCHITECTURE             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                     ┌───────────────────────┐                       │
│                     │     YOUR TEST CODE    │                       │
│                     │   switchScenario()    │                       │
│                     └───────────┬───────────┘                       │
│                                 │                                    │
│                                 ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    FRAMEWORK ADAPTERS                         │  │
│  │                                                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │ EXPRESS  │  │ NEXT.JS  │  │ FASTIFY  │  │   FUTURE     │ │  │
│  │  │ ADAPTER  │  │ ADAPTER  │  │ (coming) │  │   ADAPTERS   │ │  │
│  │  │   ✅     │  │    ✅    │  │   🔜     │  │  Hono, Koa   │ │  │
│  │  │          │  │          │  │          │  │  Remix, etc  │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │  │
│  │       │             │             │               │          │  │
│  └───────┼─────────────┼─────────────┼───────────────┼──────────┘  │
│          │             │             │               │             │
│          └─────────────┴──────┬──────┴───────────────┘             │
│                               │                                     │
│                               ▼                                     │
│         ┌─────────────────────────────────────────────┐            │
│         │          SCENARIST CORE (THE HEXAGON)       │            │
│         │                                             │            │
│         │  • Scenario Management                      │            │
│         │  • Test ID Isolation                        │            │
│         │  • State Management                         │            │
│         │  • Request Matching                         │            │
│         │  • Response Sequences                       │            │
│         │  • NO FRAMEWORK DEPENDENCIES                │            │
│         │                                             │            │
│         └──────────────────────┬──────────────────────┘            │
│                                │                                    │
│                                ▼                                    │
│         ┌─────────────────────────────────────────────┐            │
│         │              MSW (HTTP INTERCEPTION)        │            │
│         │         Battle-tested, framework-agnostic   │            │
│         └─────────────────────────────────────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Diagram 3: Test ID Isolation (The Magic)

```
┌─────────────────────────────────────────────────────────────────────┐
│              HOW PARALLEL TESTS STAY ISOLATED                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │
│  │   TEST A    │   │   TEST B    │   │   TEST C    │               │
│  │ Premium User│   │  Free User  │   │ Payment Err │               │
│  │ test-id: A  │   │ test-id: B  │   │ test-id: C  │               │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘               │
│         │                 │                 │                       │
│         │ x-scenarist     │ x-scenarist     │ x-scenarist          │
│         │ -test-id: A     │ -test-id: B     │ -test-id: C          │
│         │                 │                 │                       │
│         ▼                 ▼                 ▼                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    YOUR SERVER (ONE INSTANCE)                │   │
│  │                                                              │   │
│  │   ┌───────────────────────────────────────────────────────┐ │   │
│  │   │              SCENARIST ROUTING LAYER                  │ │   │
│  │   │                                                       │ │   │
│  │   │   Test ID → Scenario Map (in memory)                  │ │   │
│  │   │   ├─ "A" → premiumUser    (state: {tier: premium})   │ │   │
│  │   │   ├─ "B" → freeUser       (state: {tier: free})      │ │   │
│  │   │   └─ "C" → paymentError   (state: {error: true})     │ │   │
│  │   │                                                       │ │   │
│  │   └───────────────────────────────────────────────────────┘ │   │
│  │                                                              │   │
│  │   Your business logic runs normally for ALL requests         │   │
│  │   Only external API responses differ per test ID             │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  RESULT: Tests run in parallel, each with isolated state            │
│          No conflicts. No restarts. No separate servers.            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Diagram 4: Server-Side State Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│              SERVER-SIDE STATE: THE COMPLEXITY                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  WITHOUT SCENARIST:                                                  │
│  ─────────────────                                                   │
│                                                                      │
│  POST /login → Auth0 → Session created → Cookie set                 │
│       │                                                              │
│       ├── How do you test MFA required?                             │
│       ├── How do you test invalid credentials?                      │
│       └── How do you test rate limiting?                            │
│                                                                      │
│  GET /dashboard → Check session → Get user tier → Show content      │
│       │                                                              │
│       ├── Session depends on login (order matters!)                 │
│       ├── Different tiers need different API responses              │
│       └── How do you test all tiers in parallel?                    │
│                                                                      │
│  POST /cart/add → Validate session → Add item → Update state        │
│       │                                                              │
│       ├── State accumulates across multiple requests                │
│       ├── Cart must persist but be isolated per test                │
│       └── How do you verify cart contents in responses?             │
│                                                                      │
│  POST /checkout → Auth + Cart + Payment + Email                     │
│       │                                                              │
│       ├── Must happen AFTER login (order!)                          │
│       ├── Must use accumulated cart state                           │
│       ├── Payment can succeed, fail, or require 3DS                 │
│       └── Email sent only if payment succeeds                       │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  WITH SCENARIST:                                                     │
│  ───────────────                                                     │
│                                                                      │
│  • Request Matching: Different responses based on request content   │
│  • Response Sequences: Stateful progression (pending→complete)      │
│  • State Capture: Save data from requests, inject into responses    │
│  • Test Isolation: Each test has its own state, runs in parallel    │
│  • Framework Agnostic: Same patterns work in Express, Next.js, etc  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Diagram 5: Before/After Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BEFORE vs AFTER SCENARIST                        │
├───────────────────────────────┬─────────────────────────────────────┤
│         BEFORE                │           AFTER                     │
├───────────────────────────────┼─────────────────────────────────────┤
│                               │                                     │
│  // Test 1: Premium user      │  test('premium user', async () => { │
│  beforeAll(async () => {      │    await switchScenario('premium'); │
│    await stopServer();        │    // ... test code                 │
│    setEnv('USER_TIER',        │  });                                │
│           'premium');         │                                     │
│    await startServer();       │  test('free user', async () => {    │
│  });                          │    await switchScenario('free');    │
│                               │    // ... test code                 │
│  // Test 2: Free user         │  });                                │
│  beforeAll(async () => {      │                                     │
│    await stopServer();        │  // Both tests run in parallel!     │
│    setEnv('USER_TIER','free');│  // No restarts needed!             │
│    await startServer();       │  // State isolated per test!        │
│  });                          │                                     │
│                               │                                     │
│  // Tests run sequentially    │                                     │
│  // Server restarts 10x       │                                     │
│  // Total time: 5 minutes     │  // Total time: 30 seconds          │
│                               │                                     │
├───────────────────────────────┼─────────────────────────────────────┤
│  ❌ Slow (server restarts)    │  ✅ Fast (no restarts)              │
│  ❌ Sequential (conflicts)    │  ✅ Parallel (isolated)             │
│  ❌ Flaky (timing issues)     │  ✅ Stable (deterministic)          │
│  ❌ Framework-coupled         │  ✅ Framework-agnostic              │
│  ❌ Hard to test edge cases   │  ✅ Easy scenario switching         │
│                               │                                     │
└───────────────────────────────┴─────────────────────────────────────┘
```

---

## Demo App: "PayFlow" - Payment Integration Dashboard

**Location:** `demo/payflow/` in the Scenarist monorepo

**Why in the monorepo (but excluded from workspace):**

- Keeps promotional content and demo app in sync (one commit = one state)
- Installs Scenarist from npm (not workspace) - validates published packages work
- Catches packaging/bundling issues before external users do
- Blog posts and demo code stay together in git history

**Note:** The `demo/` folder is excluded from `pnpm-workspace.yaml`. This means the demo app installs `@scenarist/*` packages from npm, exactly like external users would. See `demo/README.md` for details.

**Why a new example app (vs apps/):**

- `apps/` contains internal testing/verification apps (use workspace dependencies)
- `demo/` contains consumer-facing promotional apps (use npm packages)
- Current examples are good but complex for quick demos
- Need something that naturally showcases all features in 5-minute videos
- Universal pain point: everyone has dealt with payment integration testing

**The App:**
A simple payment dashboard that integrates with:

- **Stripe** - Payment processing
- **Auth0** - User authentication
- **SendGrid** - Email notifications

**Why this is perfect:**

- Universally relatable (everyone has payment integration)
- Naturally demonstrates request matching (user tiers)
- Naturally demonstrates sequences (payment status polling)
- Naturally demonstrates stateful mocks (cart accumulation)
- Can show both success and error scenarios

**Tech Stack:**

- Next.js App Router (modern, Server Components)
- Tailwind CSS (clean visuals for video)
- TypeScript (demonstrates type safety)

### Staged Development with Git Tags

The demo app is built incrementally in stages, with git tags marking key points. This allows:

- **Incremental review** - Each stage reviewed before proceeding
- **Video-specific code states** - Blog posts link to exact code shown in videos
- **Progressive complexity** - Features added as videos need them

**Development Stages:**

| Stage | Tag                  | Videos Supported | Features Added                                  |
| ----- | -------------------- | ---------------- | ----------------------------------------------- |
| 1     | `stage-1-foundation` | 1-5              | Basic app, auth, pricing, basic Scenarist setup |
| 2     | `stage-2-features`   | 6-9              | Cart, checkout, payment flows, sequences        |
| 3     | `stage-3-complete`   | 10-14            | Full integration, production build, Playwright  |

**Video-Specific Tags:**

Each video gets a tag marking the exact code state shown:

| Video | Tag                           | Description                                      |
| ----- | ----------------------------- | ------------------------------------------------ |
| 1     | `video-01-testing-gap`        | Basic app showing the problem (before Scenarist) |
| 2     | `video-02-scenario-switching` | First Scenarist integration, scenario switching  |
| 3     | `video-03-case-study`         | Auth flow with intentional bug, then fix         |
| 4     | `video-04-server-state`       | Session and order-dependent flows                |
| 5     | `video-05-behavior-testing`   | Refactoring demo (tests don't break)             |
| 6     | `video-06-request-matching`   | User tier matching implementation                |
| 7     | `video-07-sequences`          | Payment polling with sequences                   |
| 8     | `video-08-stateful-mocks`     | Cart state capture and injection                 |
| 9     | `video-09-parallel-testing`   | Multiple tests running in parallel               |
| 10    | `video-10-composition`        | All features working together                    |
| 11    | `video-11-production-safety`  | Production build verification                    |
| 12    | `video-12-playwright`         | Full Playwright test suite                       |
| 13    | `video-13-tech-leads`         | (uses video-12 code)                             |
| 14    | `video-14-comparison`         | (uses video-12 code)                             |

**Tagging Workflow:**

1. Complete features for a stage
2. Review checkpoint with user
3. Create stage tag (e.g., `git tag stage-1-foundation`)
4. Record videos for that stage
5. After each video, create video-specific tag
6. Push tags to remote (`git push --tags`)

**Note:** Tag names and mappings above are initial proposals. They will evolve as we build the demo app and may be renamed, consolidated, or split based on what makes sense during implementation. The principle (tags marking reviewable states) is fixed; the specific names are flexible.

**Blog Post References:**

Blog posts should reference tags, not branches:

```markdown
You can see the complete code at this point:
[View on GitHub](https://github.com/citypaul/scenarist/tree/video-03-case-study/demo/payflow)
```

---

## Video Series Structure

### Phase 1: The Problem & Proof (Videos 1-3)

Establish the problem and PROVE Scenarist catches real bugs.

1. **The Testing Gap** (5 min) - The problem everyone has
2. **One Server, Unlimited Scenarios** (5 min) - How Scenarist works + architecture
3. **Case Study: The Bug Your Tests Didn't Catch** (8-10 min) - KEY VIDEO: Real example of isolated tests passing but Scenarist catching the bug

### Phase 2: Deep Dives (Videos 4-5)

Understand the complexity and philosophy. 4. **Server-Side State** (5 min) - The complexity nobody mentions 5. **Test Behavior, Not Implementation** (5 min) - Philosophy

### Phase 3: Core Features (Videos 6-9)

Deep dive into each key feature with practical demos. 6. **Request Matching** (5 min) - Content-based responses 7. **Response Sequences** (5 min) - Polling and state machines 8. **Stateful Mocks** (5 min) - Capture and inject state 9. **Parallel Testing** (5 min) - Test isolation

### Phase 4: Advanced Patterns (Videos 10-12)

Show powerful combinations and real-world patterns. 10. **Feature Composition** (5 min) - All features together 11. **Production Safety** (5 min) - Zero bundle size 12. **Playwright Integration** (5 min) - Type-safe fixtures

### Phase 5: Decision Maker Content (Videos 13-14)

Dedicated content for tech leads and architects. 13. **For Tech Leads** (5 min) - Team benefits and ROI 14. **Tool Comparison** (5 min) - Scenarist vs alternatives

---

## Video Details

### Video 1: "The Testing Gap Nobody Talks About" (5 min)

**Pain First:** You can test your server. You can test your frontend. But can you prove they work together?

**Critical framing:** This video establishes the REAL problem - proving frontend + backend work correctly together.

**Structure:**

- 0:00-0:30: Hook - "Your server tests pass. Your frontend tests pass. But do they actually work together?"
- 0:30-2:00: The Gap Between Isolated Tests
  - Server tests (supertest/jest): Proves API returns right JSON, but no real browser
  - Frontend tests (RTL/jsdom): Proves component renders, but no real server
  - "You've tested both sides separately, but you haven't proven they work together"
  - **Show Diagram: The Real Testing Gap**
- 2:00-3:00: Why Real Browser + Real Server Is Hard
  - Server-side state builds up over multiple requests
  - Login → session → cart → checkout (order matters!)
  - But how do you control what Stripe/Auth0 return in a browser test?
  - "You can't tell Stripe to decline the card just for your test"
- 3:00-4:00: What You Actually Need
  - Real browser (Playwright) - proves UI actually works
  - Real server - proves your code actually executes
  - Controlled external APIs - test any scenario
  - "This is the gap. Real browser + real server + controlled responses."
- 4:00-4:30: The Solution - Scenario-based testing concept
  - Define scenarios: success, declined, timeout, premium user
  - Switch scenarios at runtime, no restart
  - Each test isolated, runs in parallel
- 4:30-5:00: Tease Scenarist, link to next video

**Blog Post Companion:** "The Testing Gap: Why Your API Tests and Component Tests Don't Prove Your App Works"

**Key Phrases to Include:**

- "Your server tests pass. Your frontend tests pass. But can you prove they work together?"
- "Isolated tests can't prove integrated behavior"
- "Real browser + real server + controlled external APIs"

---

### Video 2: "One Server, Unlimited Scenarios" (5 min)

**Pain First:** Restarting your server for each test scenario is killing your CI.

**Introduce Scenarist architecture:** Show that it's framework-agnostic by design.

**Structure:**

- 0:00-0:30: Hook - "How many times have you restarted your server today?"
- 0:30-1:30: The Problem
  - Traditional mocks require app restarts
  - Parallel tests conflict with shared global state
  - CI bills are growing
  - **Show Diagram 5: Before/After Comparison**
- 1:30-2:30: Introduce Scenarist Architecture
  - **Show Diagram 2: Framework Adapter Architecture**
  - "Scenarist has a framework-agnostic core"
  - "Adapters exist for Express and Next.js today"
  - "Fastify, Hono, Remix adapters are coming"
  - "The concepts you learn work everywhere"
- 2:30-4:00: Live Demo - Show Scenarist switching scenarios without restart
  - PayFlow (Next.js): Default -> Payment Success -> Payment Declined -> 3DS Required
  - **Explicitly say:** "I'm using Next.js here, but this exact pattern works with Express"
  - All instant, no restart
- 4:00-4:30: Explain test ID isolation
  - **Show Diagram 3: Test ID Isolation**
- 4:30-5:00: Tease request matching in next video

**Blog Post Companion:** "Runtime Scenario Switching: How to Test 50 API States Without 50 Server Restarts"

**Key Phrases to Include:**

- "Whether you're using Express today or migrating to Next.js tomorrow"
- "The patterns are the same - only the adapter changes"

---

### Video 3: "Case Study: The Bug Your Tests Didn't Catch" (8-10 min)

**Pain First:** All your tests pass. You ship to production. Users report a bug. Sound familiar?

**This is the KEY proof-of-value video** - Shows a REAL scenario where isolated tests pass but Scenarist catches the bug.

**Why this video is longer:** This case study is worth the extra time because it proves the core value proposition with a concrete, relatable example.

**The Scenario:**

- Premium users should see 20% discount
- Server reads user tier from session (established at login via Auth0)
- Frontend displays pricing based on API response

**Structure:**

- 0:00-0:30: Hook - "All your tests are green. Your CI passes. You ship. Then users complain."

- 0:30-2:30: The App & What We're Testing
  - Show PayFlow app: login with Auth0, view pricing page
  - Premium users see 20% discount, standard users see full price
  - "Let's write tests to make sure this works"

- 2:30-4:30: The Isolated Tests (All Pass!)
  - **Server test (vitest):**
    ```typescript
    vi.mock("./session", () => ({
      getSession: () => ({ userId: "123", tier: "premium" }),
    }));
    // Test passes - API returns discount
    ```
  - **Frontend test (RTL):**
    ```typescript
    render(<PricingPage pricing={{ discount: 20 }} />);
    expect(screen.getByText('20% off')).toBeInTheDocument();
    // Test passes - component renders discount
    ```
  - "All green! Ship it!"

- 4:30-5:30: The Bug in "Production"
  - User reports: "I'm a premium user but I don't see the discount"
  - "But all our tests passed! How?"

- 5:30-7:30: The Scenarist Test Catches It
  - Write Playwright test with Scenarist:
    ```typescript
    test("premium user sees discount", async ({ page, switchScenario }) => {
      await switchScenario(page, "premiumUser");
      await page.goto("/login");
      await page.click('[data-testid="login-button"]');
      await page.waitForURL("/dashboard");
      await page.goto("/pricing");
      await expect(page.getByText("20% off")).toBeVisible(); // FAILS!
    });
    ```
  - Test fails! UI shows standard pricing.

- 7:30-9:00: Finding & Fixing the Bug
  - Debug: Login happens, Auth0 returns premium user data
  - But server code has bug: stores `session.userId` but forgets `session.tier`
  - Pricing endpoint reads `session.tier` → undefined → returns standard pricing
  - **The vitest mock LIED** - it assumed tier was in session
  - **The RTL mock LIED** - it assumed API returns premium pricing
  - Fix the session handling, Scenarist test passes

- 9:00-10:00: The Lesson
  - "Isolated tests test your assumptions. Integrated tests test reality."
  - "The mock was the lie - it assumed behavior that didn't exist"
  - "Real browser + real server + controlled APIs = higher confidence"
  - "This is why Scenarist exists"

**Blog Post Companion:** "Case Study: How Integrated Testing Catches Bugs That Unit Tests Miss"

**Key Phrases to Include:**

- "Your mocks are assumptions. Your assumptions can be wrong."
- "Isolated tests test your assumptions. Integrated tests test reality."
- "If the mock is wrong, your test is lying to you"

---

### Video 4: "Server-Side State: The Complexity Nobody Mentions" (5 min)

**Pain First:** Your server-side code has state that spans multiple requests - and it's almost impossible to test.

**This is a KEY differentiator video** - emphasizes a pain point competitors don't address well.

**Structure:**

- 0:00-0:30: Hook - "Your checkout flow depends on 4 previous requests. How do you test that?"
- 0:30-2:00: The Server-Side State Nightmare
  - Session state: Login establishes session, subsequent requests depend on it
  - Order-dependent logic: Must call /init before /process before /complete
  - Accumulated state: Cart builds up over multiple POST requests
  - Conditional flows: 3DS required only for certain amounts
  - **Show Diagram 4: Server-Side State Flow**
- 2:00-3:00: Why Traditional Approaches Fail
  - Unit tests: Can't test request order dependencies
  - E2E tests: Can't control intermediate states
  - Global mocks: State pollution between parallel tests
- 3:00-4:30: How Scenarist Handles This
  - **State Capture:** Save data from request 1, use in request 4
  - **Response Sequences:** Different response on each call
  - **Test Isolation:** Each test has its own state timeline
  - Demo: Complete checkout flow with accumulated cart state
- 4:30-5:00: "This works in Express, Next.js, Fastify - anywhere you have server-side state"

**Blog Post Companion:** "Server-Side State Testing: Sessions, Order Dependencies, and Accumulated State"

**Key Phrases to Include:**

- "Every Node.js framework has this problem"
- "Your business logic doesn't care which framework you use - neither does Scenarist"

---

### Video 5: "Test Behavior, Not Implementation" (5 min)

**Pain First:** Your tests break every time you refactor.

**Structure:**

- 0:00-0:30: Hook - "Why does every refactor break your tests?"
- 0:30-2:00: The Problem
  - Traditional mocking: `jest.spyOn(stripe.charges, 'create')`
  - Tests are coupled to implementation, not behavior
  - Refactoring becomes terrifying
- 2:00-4:00: The Scenarist Way
  - Scenarios describe what users experience, not what code executes
  - Demo: Refactor payment code, tests still pass
  - Show declarative scenario definition
- 4:00-5:00: Philosophy summary, link to practical deep-dives

**Blog Post Companion:** "Declarative Scenarios: Why Your Test Mocks Should Be Data, Not Functions"

---

### Video 6: "Request Matching: One Endpoint, Infinite Responses" (5 min)

**Pain First:** You have 6 user tiers. You don't want 6 scenarios.

**Structure:**

- 0:00-0:30: Hook - Show PayFlow with different user tiers
- 0:30-1:30: The Problem
  - Different users see different pricing
  - Premium users get discounts
  - Enterprise users get custom rates
- 1:30-4:00: Live Demo - Request Matching
  - Match on `x-user-tier` header
  - Match on request body content
  - Specificity-based selection (most specific wins)
- 4:00-5:00: Combine with URL regex matching

**Blog Post Companion:** "Request Matching Deep Dive: Content-Based Routing for Test Scenarios"

---

### Video 7: "Response Sequences: Test Polling Without Pain" (5 min)

**Pain First:** Testing async workflows is a nightmare of setTimeout and flaky tests.

**Structure:**

- 0:00-0:30: Hook - Show payment status polling UI in PayFlow
- 0:30-1:30: The Problem
  - Real APIs return: pending -> processing -> complete
  - Traditional mocks return the same thing every time
  - Timing hacks make tests flaky
- 1:30-4:00: Live Demo - Response Sequences
  - Define sequence: pending -> processing -> complete
  - Each call advances automatically
  - Repeat modes: `last`, `cycle`, `none`
- 4:00-5:00: Show retry scenario (fail twice, succeed on third)

**Blog Post Companion:** "Response Sequences: Testing Polling, Retries, and State Machines"

---

### Video 8: "Stateful Mocks: State That Flows Through Your Tests" (5 min)

**Pain First:** Your shopping cart test needs state to persist across requests.

**Structure:**

- 0:00-0:30: Hook - "Add to cart, navigate away, come back - is it still there?"
- 0:30-1:30: The Problem
  - Multi-step workflows need state
  - Traditional mocks can't capture and inject
  - External state management is complex
- 1:30-4:00: Live Demo - Stateful Mocks in PayFlow
  - Add items to cart (capture state)
  - View cart (inject captured items)
  - Checkout (use accumulated state)
- 4:00-5:00: Show template syntax `{{state.cartItems}}`

**Blog Post Companion:** "Stateful Mocks: Capture, Store, and Inject State Across Requests"

---

### Video 9: "Parallel Testing: 100 Tests, Zero Conflicts" (5 min)

**Pain First:** Your CI runs tests sequentially because parallel execution breaks everything.

**Structure:**

- 0:00-0:30: Hook - Show CI running 100 tests in parallel
- 0:30-1:30: The Problem
  - Shared mock state = test pollution
  - Running sequentially = slow CI
  - Spinning up multiple servers = complex and expensive
- 1:30-4:00: Live Demo - Parallel Execution
  - Show two tests running simultaneously with different scenarios
  - Explain header-based routing (diagram)
  - Show test ID isolation in action
- 4:00-5:00: CI configuration tips, Playwright fixtures

**Blog Post Companion:** "Parallel Test Isolation: Header-Based Routing vs. Multiple Server Instances"

---

### Video 10: "Feature Composition: All Features Together" (5 min)

**Pain First:** Real workflows use matching + sequences + state together.

**Structure:**

- 0:00-0:30: Hook - "The checkout flow from hell"
- 0:30-1:30: The Challenge
  - User tier affects pricing (matching)
  - Payment status changes over time (sequence)
  - Cart persists across pages (state)
- 1:30-4:00: Live Demo - Complete Checkout Flow
  - Premium user adds items (matching + state capture)
  - Initiates payment (sequence starts)
  - Polls for completion (sequence advances)
  - Receives confirmation (state injection)
- 4:00-5:00: Show the complete scenario definition

**Blog Post Companion:** "Feature Composition: Building Complex Scenarios from Simple Primitives"

---

### Video 11: "Production Safety: Zero Bundle Size Guaranteed" (5 min)

**Pain First:** "Will this ship to production?" is a legitimate concern.

**Structure:**

- 0:00-0:30: Hook - "Your test code in production? Never."
- 0:30-1:30: The Concern
  - Test infrastructure in production bundles
  - Bundle size bloat
  - Security implications
- 1:30-4:00: Live Demo - Tree Shaking Verification
  - Build PayFlow for production
  - Show bundle analysis (no Scenarist/MSW)
  - Explain conditional exports mechanism
- 4:00-5:00: CI verification script for ongoing confidence

**Blog Post Companion:** "Production Safety: How Scenarist Guarantees Zero Test Code in Production"

---

### Video 12: "Playwright Integration: Type-Safe Scenario Switching" (5 min)

**Pain First:** Managing test IDs and scenario switching manually is tedious.

**Structure:**

- 0:00-0:30: Hook - "One fixture, infinite type-safe scenarios"
- 0:30-1:30: The Problem
  - Manual header management is error-prone
  - No autocomplete for scenario names
  - Test isolation requires boilerplate
- 1:30-4:00: Live Demo - Playwright Helpers
  - `withScenarios()` fixture setup
  - Type-safe `switchScenario(page, 'premiumUser')`
  - Automatic test ID generation
- 4:00-5:00: Show full test file structure

**Blog Post Companion:** "Playwright Integration: Type-Safe Fixtures for Scenario-Based Testing"

---

### Video 13: "For Tech Leads: Why Scenarist for Your Team" (5 min)

**Decision Maker Focus**

**Structure:**

- 0:00-0:30: Hook - "Your team spends 40% of their time on test infrastructure"
- 0:30-2:00: The Team Challenges
  - Flaky tests waste CI time and developer focus
  - Test suites grow but confidence doesn't
  - Edge cases remain untested
- 2:00-3:30: What Scenarist Solves
  - Faster CI (parallel execution)
  - Better coverage (easy edge case testing)
  - Maintainable tests (centralized scenarios)
- 3:30-4:30: ROI Discussion
  - Time saved on test maintenance
  - Bugs caught before production
  - Developer happiness
- 4:30-5:00: Getting started path, docs link

**Blog Post Companion:** "Scenarist for Teams: ROI of Scenario-Based Integration Testing"

---

### Video 14: "Scenarist vs. The Alternatives" (5 min)

**Decision Maker Focus**

**Structure:**

- 0:00-0:30: Hook - "WireMock, Nock, Testcontainers, or Scenarist?"
- 0:30-1:30: Quick category overview
  - Network-level mocking (Scenarist, MSW, Nock)
  - Server-based mocking (WireMock)
  - Container testing (Testcontainers)
- 1:30-3:30: When to Use What
  - Scenarist: Server-side JS code, parallel testing, Playwright
  - WireMock: Non-JS ecosystems, standalone mock server
  - Nock: Simple unit tests, no parallelism needs
  - Testcontainers: Real databases, actual service behavior
- 3:30-4:30: Decision tree walkthrough
- 4:30-5:00: Link to detailed comparison docs

**Blog Post Companion:** "Tool Comparison: Choosing the Right Integration Testing Approach"

---

## Blog-Only Content (No Video Companion)

### Blog 1: "Introduction: The Server-Side Integration Testing Problem"

**IMPORTANT:** This is the foundational blog post - establishes the framework-agnostic problem.

- The testing gap exists in ALL Node.js frameworks
- Server-side state complexity (sessions, order dependencies, accumulated state)
- Why traditional approaches fail
- What scenario-based testing solves
- Links to framework-specific guides (Express, Next.js)

### Blog 2: "Getting Started with Scenarist in 10 Minutes"

Practical quick-start guide with copy-paste code.

- Express example
- Next.js example
- Same patterns, different adapters

### Blog 3: "Migrating from MSW to Scenarist"

Guide for teams already using MSW who want scenario management.

- What you keep (MSW handlers)
- What you gain (scenario management, test isolation)
- Migration path step-by-step

### Blog 4: "Testing Next.js Server Components: The Complete Guide"

Deep dive on RSC testing patterns with Scenarist.

- NOTE: Position as "one framework example" not "the main use case"
- Include note about Express equivalent patterns

### Blog 5: "Common Pitfalls and How to Avoid Them"

Troubleshooting guide based on real issues.

### Blog 6: "Real-World Patterns: E-Commerce, Auth, Payments"

Collection of scenario patterns for common use cases.

- Framework-agnostic patterns that work everywhere

---

## Implementation Order

**Recording Strategy:** Record all (or most) videos before releasing any. This allows:

- Building momentum at launch
- Flexibility in release cadence
- Ability to re-record if early feedback suggests improvements
- Cross-referencing between videos during editing

### Phase 1: Foundation

1. Build PayFlow demo app (in `demo/payflow/`, installs from npm)
2. Record Video 1 (The Testing Gap)
3. Write companion blog post (markdown)
4. Record Video 2 (One Server, Unlimited Scenarios)
5. Write companion blog post

### Phase 2: Core Features

6. Record Videos 3-7
7. Write companion blog posts

### Phase 3: Advanced & Decision Maker

8. Record Videos 8-10
9. Record Videos 11-12 (Decision Maker content)
10. Write all companion blog posts
11. Write blog-only content

### Phase 4: Pre-Launch Prep

12. Review and edit all videos
13. Create YouTube playlist
14. Decide release cadence based on content quality
15. Prepare social media content

### Phase 5: Launch

16. Release videos according to chosen cadence
17. Publish blog posts (hosting TBD)
18. Monitor engagement and iterate

---

## PayFlow Demo App Specification

### Pages

1. **Home** - Product listing with tier-based pricing
2. **Cart** - Cart with accumulated items (stateful mocks)
3. **Checkout** - Payment flow (sequences)
4. **Order Status** - Polling for payment completion

### Scenarios to Demonstrate

- `default` - Happy path, all APIs succeed
- `premiumUser` - 20% discount on all items
- `enterpriseUser` - Custom pricing, no limits
- `paymentDeclined` - Card declined error
- `payment3DSRequired` - 3D Secure flow
- `paymentPolling` - Status progression (pending -> processing -> complete)
- `cartState` - Cart persistence across requests
- `authError` - Authentication failure
- `emailFailure` - Email notification failure
- `slowNetwork` - Delayed responses
- `rateLimited` - Too many requests

### External APIs Mocked

- `https://api.stripe.com/*` - Payment processing
- `https://api.auth0.com/*` - User authentication
- `https://api.sendgrid.com/*` - Email notifications

---

## Content Guidelines

### Key Messaging Principles (CRITICAL)

**1. Framework-Agnostic First**

- Always establish the GENERAL problem before mentioning any specific framework
- When showing Next.js demos, explicitly say: "I'm using Next.js here, but this works with Express, Fastify, and more"
- Avoid phrases like "Scenarist for Next.js" - instead use "Scenarist with Next.js"

**2. Adapter Architecture Mention**

- In Video 2, show the adapter architecture diagram
- Regularly mention: "Express and Next.js adapters today, Fastify and Hono coming"
- Position adapters as thin integration layers, not core functionality

**3. Server-Side State Emphasis**

- Video 3 is dedicated to this - it's a KEY differentiator
- Mention session state, order dependencies, accumulated state in early videos
- Use concrete examples: "Your checkout depends on your login, which depends on your cart"

**4. Pain-First Storytelling**
Every video should follow this pattern:

1. Hook with relatable pain (0:00-0:30)
2. Validate the struggle - show it's a real problem (0:30-2:00)
3. Reveal the solution (2:00-4:00)
4. Tease what's next (4:00-5:00)

**5. Phrases to USE:**

- "Whether you're using Express, Next.js, Fastify, or any Node.js server..."
- "This problem exists in every Node.js framework"
- "The patterns you learn work everywhere"
- "Your business logic doesn't care which framework you use - neither does Scenarist"
- "We're showing Next.js here, but the exact same pattern works with Express"

**6. Phrases to AVOID:**

- "Scenarist for Next.js" (implies framework lock-in)
- "Next.js-specific" (unless truly adapter-specific)
- "The best way to test Next.js" (too narrow)

### Diagrams to Include

Every video and blog post should consider which diagrams to include:

| Diagram                        | Use When                           |
| ------------------------------ | ---------------------------------- |
| Testing Gap Pyramid            | Explaining the problem space       |
| Framework Adapter Architecture | Introducing Scenarist architecture |
| Test ID Isolation              | Explaining parallel testing        |
| Server-Side State Flow         | Explaining state complexity        |
| Before/After Comparison        | Showing value proposition          |

### Video Production

- Face + screen (picture-in-picture)
- Clean code font (16-18pt for readability)
- Highlight important lines
- 2-3 second pauses between sections
- No background music during code explanations

### Video Recording Format

**You will code live on camera.** For each video, Claude produces:

1. **The code** - Complete, working code to be written during the video
2. **Presentation instructions** - Step-by-step guide on:
   - What to type and when
   - What to explain while typing
   - Key points to emphasize
   - Where to pause for effect
   - What to show on screen vs. skip
3. **Talking points** - Key phrases and explanations for each section

**Workflow per video:**

1. Claude produces code + instructions → **REVIEW CHECKPOINT**
2. You practice/rehearse the flow
3. You record, coding live
4. Review recording → **REVIEW CHECKPOINT**
5. Tag the demo app at that state

This approach keeps videos authentic and engaging - viewers see real coding, not pre-recorded demos.

### Blog Post Structure

1. **The Problem** (lead with pain)
2. **Why It's Hard** (validate the struggle)
3. **The Solution** (introduce approach)
4. **How It Works** (practical implementation)
5. **Complete Example** (copy-paste code)
6. **Next Steps** (link to related content)

### Tone (from TONE_OF_VOICE.md)

- Empathetic, not defensive
- Honest, not hyperbolic
- Practical, not theoretical
- Framework-agnostic, not Next.js-only
- Factual, not marketing

---

## Success Metrics

- Views per video
- Watch time (aim for >60% retention)
- Blog post engagement
- GitHub stars growth
- npm download growth
- Community questions/discussions

---

## Deliverables

### PayFlow Demo App (`demo/payflow/`)

- Located in Scenarist monorepo at `demo/payflow/`
- Excluded from pnpm workspace (installs from npm, not workspace)
- Complete Next.js App Router application
- All scenarios defined for video demonstrations
- README with setup instructions
- Validates published Scenarist packages work correctly
- **Git tags** mark each stage and video state (see "Staged Development with Git Tags" section)

### Blog Posts (Markdown Files)

- 14 companion blog posts (one per video)
- 6 standalone blog posts (including foundational "Introduction" post)
- Format: Markdown, hosting decision TBD
- Follow TONE_OF_VOICE.md guidelines

### Video Scripts/Outlines

- Detailed scripts for each video
- Timestamps and key points
- Code snippets to show on screen

### Scenarist Repo Changes

- `demo/` folder created for consumer-facing demo apps
- `demo/README.md` explains the folder's purpose and workflow
- `pnpm-workspace.yaml` excludes `demo/` (documented in comments)
- `CLAUDE.md` updated with demo folder guidance and TDD exception
- `README.md` updated to distinguish apps/ vs demo/
