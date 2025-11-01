# Next.js Pages Router + Playwright Helpers - Living Implementation Plan

**Status**: ✅ Phase -1 Complete & Merged, Ready for Phase 0
**Started**: 2025-11-01
**Last Updated**: 2025-11-01
**PR**: [#39](https://github.com/citypaul/scenarist/pull/39) (planning), [#40](https://github.com/citypaul/scenarist/pull/40) (Phase -1 implementation - MERGED)
**Related**: [next-stages.md](./next-stages.md) (Overall v1.0 roadmap)

---

## ⚠️ Important Notes

**Code Examples:** All TypeScript code examples in this document are **illustrative** and may require adjustment during implementation. They demonstrate intended API design but have not been type-checked or validated. Treat them as guidance, not final implementation.

**Living Document:** This plan will be updated throughout implementation as learnings emerge. Expect sections to evolve as we discover better approaches through TDD.

---

## Quick Navigation

- [Current Status](#current-status) ← What's happening NOW
- [Overall Progress](#overall-progress) ← High-level tracking
- [Architecture](#architecture-playwright-helpers-package) ← WHY decisions made
- [Fake API Strategy](#fake-api-strategy) ← Comparison demo
- [Phase Details](#tdd-implementation-phases) ← HOW to implement each phase
- [Decision Log](#decision-log) ← Decisions during implementation
- [Metrics](#metrics) ← Actual vs estimated
- [Risk Tracking](#risk-tracking) ← Issues and mitigations

---

## Current Status

### What We're Working On

**Phase 1: Scenarist Integration + First Helper 🔄 IN PROGRESS**

Implementing MSW + Scenarist setup and extracting first Playwright helper.

### Progress

**Phase -1: Next.js Adapter** - ✅ COMPLETE & MERGED (PR #40)
**Phase 0: Infrastructure Setup** - ✅ COMPLETE & MERGED (PR #41)
- [x] Next.js app scaffolding
- [x] Playwright configuration
- [x] Vitest configuration
- [x] Playwright helpers package structure
- [x] TypeScript strict mode throughout
- [x] Smoke tests passing
- [x] README documentation

**Phase 1: Scenarist Integration** - 🔄 IN PROGRESS
- [ ] Write verbose Playwright test (RED)
- [ ] Implement Scenarist setup in Next.js app (GREEN)
- [ ] Extract first helper from verbose test (REFACTOR)

### Blockers

None

### Next Steps

1. **Phase 1a (RED)**: Write failing test for scenario switching
2. **Phase 1b (GREEN)**: Implement Scenarist integration to make test pass
3. **Phase 1c (REFACTOR)**: Extract `switchScenario` helper

---

## Overall Progress

| Phase | Status | Estimated | Actual | Files Changed |
|-------|--------|-----------|--------|---------------|
| **-1: Next.js Adapter** | ✅ **COMPLETE & MERGED** | **2-3 days** | **1 day** | **21** |
| **0: Setup** | ✅ **COMPLETE & MERGED (PR #41)** | **0.5 day** | **0.5 day** | **27** |
| 1: Integration + First Helper | 🔄 **IN PROGRESS** | 1 day | - | 0 |
| 2: Products/Matching | ⏳ Not Started | 1 day | - | 0 |
| 3: Cart/Stateful | ⏳ Not Started | 1 day | - | 0 |
| 4: Checkout/Composition | ⏳ Not Started | 0.5 day | - | 0 |
| 5: Payment/Sequences | ⏳ Not Started | 1 day | - | 0 |
| 6: Parallel Isolation | ⏳ Not Started | 0.5 day | - | 0 |
| 7: Documentation | ⏳ Not Started | 1 day | - | 0 |
| **Total** | **12.5% complete** | **8-9 days** | **1.5 days** | **48** |

**Next**: Phase 1 - Scenarist Integration + First Helper (🔄 IN PROGRESS)

---

## Overview

**Triple implementation**: Create `packages/nextjs-adapter` (framework adapter) + `apps/nextjs-pages-example` (e-commerce demo) + `packages/playwright-helpers` (reusable test utilities).

**Critical Dependency**: Next.js adapter MUST be built FIRST - it's required for the example app to work.

**Key Insight**: Write verbose Playwright tests first, then extract reusable patterns into the helpers package. This ensures helpers solve real problems, not speculative ones.

**Timeline**: ~~2-3 days~~ **1 day (adapter ✅)** + 5-6 days (example + helpers) = 6-7 days total (revised)

---

## User Decisions (From Planning Session)

These decisions were made during the ultrathinking/planning phase:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **App Architecture** | Separate applications | Pages Router and App Router as distinct apps (nextjs-pages-example, nextjs-app-example). Clearer separation, easier to understand each approach. |
| **App Domain** | E-commerce checkout | Product catalog → cart → checkout → payment. Natural fit for all three Scenarist features. |
| **Initial Scope** | Full MVP (4-5 pages) | Products, cart, checkout, payment confirmation, plus all API routes and full Playwright suite (~3-4 days). |
| **Scenarios** | Create new Next.js-specific | Tailored to e-commerce flow, shows best practices for real Next.js apps. |
| **Helper Implementation** | In parallel (TDD-driven) | Write Next.js example tests that NEED helpers, let those needs drive helper design. Co-evolve both together. |
| **Helpers Scope** | Scenario switching + Test ID + Fixtures | Auto test ID generation, switchScenario helper, Playwright fixtures. Debug helpers when Phase 5 implemented. |
| **Test Location** | Co-located in each app | `apps/nextjs-pages-example/tests/playwright/` - Tests live with the app they're testing. Traditional, easy to understand. |
| **Demo Priority** | Ease of use (DX) | Show how helpers make tests dramatically simpler/cleaner. 70% less boilerplate. Before/after comparison in README. |

---

## Architecture: Next.js Adapter Package

### Package: `packages/nextjs-adapter/`

**CRITICAL REQUIREMENT**: This package MUST be built BEFORE the Next.js example apps. It's not optional - it's a core dependency.

**Why We Need This:**
- Next.js has different request/response patterns than Express
- Pages Router uses API routes with Next.js-specific `req`/`res` objects
- App Router uses Route Handlers with Web Request/Response objects
- Test ID extraction needs to work with both patterns
- Scenario endpoints need Next.js-specific implementation

**What it provides:**

1. **Pages Router Support** (`@scenarist/nextjs-adapter/pages`)
   - Middleware for API routes
   - RequestContext implementation for Next.js `req`
   - Scenario endpoint (`pages/api/__scenario__.ts`)
   - Test ID extraction from Next.js requests

2. **App Router Support** (`@scenarist/nextjs-adapter/app`)
   - Middleware for Route Handlers
   - RequestContext implementation for Web Request
   - Scenario endpoint Route Handler
   - Test ID extraction from Web Request headers

**Similar To**: `@scenarist/express-adapter` (follow same patterns, adapt for Next.js)

**API Design (Pages Router):**

```typescript
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  scenarios,
  config: {
    enabled: process.env.NODE_ENV === 'development',
    defaultScenarioId: 'default'
  }
});

// pages/api/products.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { scenarist } from '../../lib/scenarist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get request context (extracts test ID, active scenario)
  const context = scenarist.getContext(req);

  // Make external API call - MSW intercepts using test ID
  const response = await fetch('https://api.catalog.com/products', {
    headers: {
      'x-test-id': context.testId,
      'x-user-tier': req.headers['x-user-tier'] as string
    }
  });

  const products = await response.json();
  res.status(200).json(products);
}

// pages/api/__scenario__.ts (provided by adapter)
import { createScenarioEndpoint } from '@scenarist/nextjs-adapter/pages';
import { scenarist } from '../../lib/scenarist';

export default createScenarioEndpoint(scenarist);
```

**API Design (App Router):**

```typescript
// lib/scenarist.ts
import { createScenarist } from '@scenarist/nextjs-adapter/app';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  scenarios,
  config: {
    enabled: process.env.NODE_ENV === 'development',
    defaultScenarioId: 'default'
  }
});

// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { scenarist } from '../../../lib/scenarist';

export async function GET(request: NextRequest) {
  // Get request context (Web Request pattern)
  const context = scenarist.getContext(request);

  // Make external API call
  const response = await fetch('https://api.catalog.com/products', {
    headers: {
      'x-test-id': context.testId,
      'x-user-tier': request.headers.get('x-user-tier') || 'standard'
    }
  });

  const products = await response.json();
  return NextResponse.json(products);
}

// app/api/__scenario__/route.ts (provided by adapter)
import { createScenarioEndpoint } from '@scenarist/nextjs-adapter/app';
import { scenarist } from '../../../lib/scenarist';

export const { POST } = createScenarioEndpoint(scenarist);
```

**Implementation Requirements:**

1. **Package Structure:**
```
packages/nextjs-adapter/
├── src/
│   ├── pages/
│   │   ├── context.ts           # RequestContext for Pages Router
│   │   ├── setup.ts             # createScenarist()
│   │   └── endpoints.ts         # createScenarioEndpoint()
│   ├── app/
│   │   ├── context.ts           # RequestContext for App Router
│   │   ├── setup.ts             # createScenarist()
│   │   └── endpoints.ts         # createScenarioEndpoint()
│   ├── types.ts                 # Shared types
│   └── index.ts                 # Main exports
├── tests/
│   ├── pages/                   # Pages Router tests
│   └── app/                     # App Router tests
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

2. **Dependencies:**
   - `@scenarist/core` (core functionality)
   - `@scenarist/msw-adapter` (MSW integration)
   - `next` (peer dependency)
   - `msw` (peer dependency)

3. **Testing Strategy:**
   - Unit tests for RequestContext implementations
   - Unit tests for scenario endpoints
   - Integration tests with mock Next.js requests
   - 100% test coverage (behavior-driven)

**Implementation Timeline:**

- **Day 1**: Package structure, Pages Router middleware
- **Day 2**: App Router middleware, RequestContext implementations
- **Day 3**: Scenario endpoints, tests, documentation

**Success Criteria:**

- [ ] Pages Router RequestContext extracts test ID correctly
- [ ] App Router RequestContext extracts test ID correctly
- [ ] Scenario endpoints work with both routers
- [ ] 100% test coverage
- [ ] Comprehensive README
- [ ] Example apps can use the adapter

**This adapter is REQUIRED before starting the Next.js example app. It cannot be skipped or done in parallel - it's a dependency.**

### Phase -1 Implementation Complete ✅

**Completed**: 2025-11-01
**Time Taken**: 1 day (50% faster than estimated!)
**Files Created**: 21 (18 initial + 3 common modules from refactorings)
**Tests Passing**: 66 (58 initial + 8 added for coverage)
**Test Coverage**:
- Lines: 100% ✅
- Statements: 100% ✅
- Branches: 100% ✅
- Functions: 93.2% ✅ (explicit exception documented)

**What Was Built:**

1. **Pages Router Support** (`@scenarist/nextjs-adapter/pages`)
   - `PagesRequestContext` - Adapts `NextApiRequest` to RequestContext port
   - `createScenarioEndpoint()` - Factory for `pages/api/__scenario__.ts` handler
   - `createScenarist()` - Wires MSW server, ScenarioManager, state, sequences
   - 33 tests passing (28 initial + 5 added)

2. **App Router Support** (`@scenarist/nextjs-adapter/app`)
   - `AppRequestContext` - Adapts Web standard `Request` to RequestContext port
   - `createScenarioEndpoint()` - Factory for `app/api/__scenario__/route.ts` handler
   - `createScenarist()` - Same wiring as Pages Router, different Request/Response types
   - 33 tests passing (30 initial + 3 added)

3. **Common Modules** (extracted via refactoring)
   - `src/common/create-scenarist-base.ts` - Shared setup logic (~150 lines eliminated)
   - `src/common/endpoint-handlers.ts` - Framework-agnostic business logic (~80 lines eliminated)
   - `tests/common/test-setup.ts` - Reusable test factories (~50 lines eliminated)

4. **Documentation**
   - Comprehensive README (996 lines) with both routers documented
   - Usage examples for both Pages Router and App Router
   - Comparison table showing differences
   - API reference, troubleshooting, common patterns
   - Explicit coverage exception documentation

**Key Architectural Decisions:**

1. **Dual Export Structure** - Separate `/pages` and `/app` entry points for tree-shaking
2. **Web Standard APIs** - App Router uses native Request/Response (no Next.js types)
3. **No Middleware** - Unlike Express, Next.js requires manual endpoint creation
4. **Factory Function Tests** - No `let` or `beforeEach`, pure factory pattern throughout
5. **Semantic Refactoring** - Three refactorings eliminated ~280 lines of semantic duplication
6. **Explicit Coverage Exception** - 93.2% function coverage documented (arrow functions only execute during HTTP)

**Implementation Timeline:**

1. **Initial Implementation** (Commit 1) - 58 tests, 97.11% lines, 81.81% functions
2. **Coverage Improvements** (Commit 2) - Added 7 tests, achieved 100% lines/statements/branches, 86.36% functions
3. **Documentation Updates** (Commit 3) - Added user reassurance, removed duplicates
4. **Refactoring #1** (Commit 4) - Extracted `create-scenarist-base.ts` (93% functions)
5. **Refactoring #2** (Commit 5) - Extracted `endpoint-handlers.ts` (93.2% functions)
6. **Refactoring #3** (Commit 6) - Extracted `test-setup.ts` (maintained 93.2% functions)
7. **TypeScript Fix** (Commit 7) - Fixed TS2698 spread type errors in strict mode

**Learnings:**

1. **Coverage Verification is Mandatory**: Never trust coverage claims without running `pnpm exec vitest run --coverage`. Initial PR claimed 100% but was actually 97.11% lines, 81.81% functions. Added "Coverage Verification - CRITICAL" section to CLAUDE.md.

2. **100% Rule is Non-Negotiable**: Exceptions require explicit approval and three-level documentation (config, README, CLAUDE.md). Next.js adapter is the ONLY exception in the project. Added "Test Coverage: 100% Required" section to CLAUDE.md.

3. **Refactoring Improved Coverage**: Three systematic refactorings improved function coverage from 86.36% → 93.2% by eliminating semantic duplication and creating reusable modules.

4. **TypeScript Strict Mode Limitations**: Cannot spread `unknown` types. Must use explicit property assignment with type annotation when conditionally including properties. Fixed in both `src/pages/endpoints.ts` and `src/app/endpoints.ts`.

5. **TDD Guardian Verification**: Used tdd-guardian agent to verify TDD discipline followed throughout (RED → GREEN → REFACTOR). Received 95/100 score with "APPROVED WITHOUT RESERVATION" for exception legitimacy.

6. **Factory Pattern Success**: Using factory functions instead of `beforeEach` in tests kept state isolated and tests pure. Pattern worked perfectly for creating fresh dependencies per test.

7. **Ahead of Schedule**: Strict TDD with RED → GREEN → REFACTOR kept implementation focused. No speculative code = faster completion.

8. **Pattern Reuse**: Following Express adapter patterns made implementation smooth. Hexagonal architecture meant only the Next.js-specific parts needed work.

**Success Criteria Met:**

- [x] Pages Router RequestContext extracts test ID correctly
- [x] App Router RequestContext extracts test ID correctly
- [x] Scenario endpoints work with both routers
- [x] 100% test coverage (lines, statements, branches) - 66/66 tests passing
- [x] 93.2% function coverage (explicit exception documented)
- [x] Comprehensive README (996 lines)
- [x] Ready for example apps to use
- [x] TDD discipline verified by tdd-guardian agent
- [x] All refactorings completed with semantic duplication eliminated

**PR**: [#40](https://github.com/citypaul/scenarist/pull/40) (MERGED)

---

## Architecture: Playwright Helpers Package

### Package: `packages/playwright-helpers/`

**What it provides:**

1. **Scenario switching**: `scenarist.switchScenario('premiumUser')`
2. **Test ID management**: Auto-generated unique IDs, automatic header injection
3. **Playwright fixtures**: Extends base test with `scenarist` context

**Future Work (Post-v1.0):**
- Debug/inspection helpers - **BLOCKED** on core inspection API (not yet implemented, see `next-stages.md` Section 5)

**Package exports:**

```typescript
// Main exports
export { test, expect } from './fixtures';  // Extended Playwright test
export { switchScenario } from './utils';    // Standalone helper
export { generateTestId } from './utils';    // ID generator
export type { ScenaristFixtures } from './types';

// Usage
import { test } from '@scenarist/playwright-helpers';

test('my test', async ({ page, scenarist }) => {
  await scenarist.switchScenario('premiumUser');  // Auto test ID!
  await page.goto('/');
});
```

### Value Proposition (Ease of Use)

**BEFORE (without helpers):**

```typescript
test('premium pricing', async ({ page }) => {
  // 1. Manually construct test ID
  const testId = `test-${Date.now()}-${Math.random()}`;

  // 2. Manually call scenario endpoint
  await page.request.post('http://localhost:3000/__scenario__', {
    headers: { 'x-test-id': testId },
    data: { scenarioId: 'premiumUser' }
  });

  // 3. Manually set test ID header for all requests
  await page.setExtraHTTPHeaders({ 'x-test-id': testId });

  await page.goto('/');
  // 6 lines of boilerplate before actual test!
});
```

**AFTER (with helpers):**

```typescript
test('premium pricing', async ({ page, scenarist }) => {
  await scenarist.switchScenario('premiumUser');
  await page.goto('/');
  // Just 2 lines, focused on intent! 70% less code.
});
```

### API Design

```typescript
// packages/playwright-helpers/src/types.ts
export type ScenaristFixtures = {
  scenarist: {
    switchScenario: (scenarioId: string, variantName?: string) => Promise<void>;
    testId: string;
  };
};

// packages/playwright-helpers/src/fixtures.ts
export const test = base.extend<ScenaristFixtures>({
  scenarist: async ({ page }, use) => {
    // Auto-generate unique test ID
    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Auto-inject test ID header for all requests
    await page.setExtraHTTPHeaders({ 'x-test-id': testId });

    // Scenario switching helper
    const switchScenario = async (scenarioId: string, variantName?: string) => {
      const baseURL = page.context()._options.baseURL || 'http://localhost:3000';
      const response = await page.request.post(`${baseURL}/__scenario__`, {
        headers: { 'x-test-id': testId },
        data: { scenarioId, variantName }
      });

      if (!response.ok()) {
        throw new Error(`Failed to switch scenario: ${response.status()}`);
      }
    };

    await use({ switchScenario, testId });
  },
});
```

### Why Fixtures Over Standalone Functions?

**Decision**: Use Playwright fixtures instead of standalone utility functions

**Rationale**:
- Fixtures provide test-scoped context (test ID persists across page navigations, API calls)
- Auto-injection of headers happens once per test, not per page navigation
- Cleaner API - no need to pass `testId` parameter everywhere
- Aligns with Playwright's extension model

**Alternative considered**: Standalone functions like `switchScenario(page, testId, scenarioId)`
**Rejected because**: Would require passing testId everywhere, more boilerplate, easy to forget

---

## Architecture: Next.js Pages Example

### Application: E-commerce Checkout Flow

**User Journey:**

1. **Products Page** (`/`)
   - Select tier (premium/standard) via UI toggle
   - View different pricing based on tier
   - **Demonstrates**: Request matching (match on `x-user-tier` header)

2. **Shopping Cart** (`/cart`)
   - Add items from products page
   - View accumulated cart items
   - **Demonstrates**: Stateful mocks (capture items, inject into GET /cart)

3. **Checkout** (`/checkout`)
   - Enter shipping address
   - Calculate shipping cost (UK = free)
   - **Demonstrates**: Matching + Stateful (match on country, capture address)

4. **Payment** (`/payment/[orderId]`)
   - Submit payment
   - Poll for status (pending → processing → succeeded)
   - Show confirmation
   - **Demonstrates**: Sequences (polling scenario)

### File Structure

```
apps/nextjs-pages-example/
├── src/
│   ├── pages/
│   │   ├── _app.tsx                      # App wrapper
│   │   ├── index.tsx                     # Product listing (matching)
│   │   ├── cart.tsx                      # Shopping cart (stateful)
│   │   ├── checkout.tsx                  # Checkout form (stateful + matching)
│   │   ├── payment/
│   │   │   └── [orderId].tsx            # Payment status (sequences)
│   │   └── api/
│   │       ├── products.ts               # GET /api/products
│   │       ├── cart/
│   │       │   ├── add.ts                # POST /api/cart/add
│   │       │   └── index.ts              # GET /api/cart
│   │       ├── checkout/
│   │       │   └── shipping.ts           # POST /api/checkout/shipping
│   │       └── payment/
│   │           ├── create.ts             # POST /api/payment/create
│   │           └── status/[id].ts        # GET /api/payment/status/:id
│   ├── components/
│   │   ├── ProductCard.tsx
│   │   ├── CartItem.tsx
│   │   ├── CheckoutForm.tsx
│   │   └── TierSelector.tsx
│   ├── lib/
│   │   ├── scenarist.ts                  # MSW + Scenarist setup
│   │   └── scenarios.ts                  # Scenario definitions
│   └── styles/
│       └── globals.css
├── tests/
│   ├── playwright/                       # E2E tests (uses @scenarist/playwright-helpers)
│   │   ├── setup.ts
│   │   ├── products.spec.ts
│   │   ├── cart.spec.ts
│   │   ├── checkout.spec.ts
│   │   ├── payment.spec.ts
│   │   └── isolation.spec.ts             # Parallel test isolation
│   └── api/                              # Vitest API route tests
│       ├── products.test.ts
│       └── cart.test.ts
├── playwright.config.ts
├── vitest.config.ts
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── README.md
```

### External APIs to Mock

All external API calls will be intercepted by MSW and mocked by Scenarist:

1. **Product Catalog API** (`https://api.catalog.com`)
   - `GET /products` → Match on `x-user-tier: premium|standard`
   - Returns different pricing based on tier

2. **Shopping Cart API** (`https://api.cart.com`)
   - `POST /cart/add` → Capture items with `captureState: { 'cartItems[]': 'body.item' }`
   - `GET /cart` → Inject `{{state.cartItems}}` and `{{state.cartItems.length}}`

3. **Shipping API** (`https://api.shipping.com`)
   - `POST /calculate` → Match on `body.country` (UK = free shipping)
   - Returns shipping cost based on country

4. **Payment API** (`https://api.payments.com`)
   - `POST /payment/create` → Creates payment, returns payment ID
   - `GET /payment/:id/status` → Sequence: pending → processing → succeeded (repeat: 'last')

### Scenarios (New Next.js-Specific)

**7 scenarios tailored to e-commerce flow:**

1. **default** - Happy path for all APIs (fallback when no scenario set)
2. **premiumUser** - Premium pricing (£99.99 vs £149.99) - demonstrates matching
3. **standardUser** - Standard pricing - demonstrates matching
4. **cartAccumulation** - Cart state capture/injection - demonstrates stateful
5. **paymentPolling** - Payment status sequence (pending → processing → succeeded) - demonstrates sequences
6. **paymentDeclined** - Payment failure scenario - demonstrates error handling
7. **freeShippingUK** - UK gets free shipping - demonstrates matching on request body

Example scenario definition:

```typescript
// lib/scenarios.ts
export const premiumUserScenario: ScenarioDefinition = {
  id: 'premiumUser',
  name: 'Premium User',
  description: 'Premium tier pricing and features',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.catalog.com/products',
      match: {
        headers: { 'x-user-tier': 'premium' }
      },
      response: {
        status: 200,
        body: {
          products: [
            { id: '1', name: 'Product A', price: 99.99, tier: 'premium' },
            { id: '2', name: 'Product B', price: 149.99, tier: 'premium' },
          ]
        }
      }
    }
  ]
};
```

---

## Fake API Strategy

### Why We Need This

To demonstrate Scenarist's value clearly, we need to show the comparison:

1. **Without Scenarist**: Tests hitting "real" backend (slow, flaky, requires external service running)
2. **With Scenarist**: Tests using mocked scenarios (fast, reliable, zero external dependencies)

This makes the value proposition obvious: Scenarist eliminates the pain of managing test backends.

### Technology Choice: json-server

**Selected**: json-server
**Why**: Simple, zero-code, automatically generates REST endpoints from JSON
**Installation**: `pnpm add -D json-server`

**Alternatives Considered**:
- **Prism** (OpenAPI mock server): More powerful but overkill for our needs
- **Custom Express server**: More work, not needed for simple demo

**Decision**: json-server is intentionally simple. Its limitations (no sequences, no state, static responses) highlight why Scenarist is better.

### Endpoints to Mock

All external API calls that our Next.js app makes:

1. **Product Catalog API** (`http://localhost:3001/products`)
   - `GET /products` → List of products with pricing (tier-based)

2. **Shopping Cart API** (`http://localhost:3001/cart`)
   - `POST /cart/add` → Add item to cart
   - `GET /cart` → Get current cart items

3. **Shipping API** (`http://localhost:3001/shipping`)
   - `POST /shipping/calculate` → Calculate shipping cost

4. **Payment API** (`http://localhost:3001/payment`)
   - `POST /payment/create` → Create payment intent
   - `GET /payment/:id/status` → Get payment status

### File Structure

```
apps/nextjs-pages-example/
├── fake-api/
│   ├── db.json              # json-server database
│   ├── routes.json          # Custom route mappings (optional)
│   └── README.md            # How to run fake API
├── package.json             # Script: "fake-api": "json-server fake-api/db.json --port 3001"
└── ...
```

### Usage Comparison

**Without Scenarist (using fake API)**:
```bash
# Terminal 1: Start json-server on port 3001
npm run fake-api &

# Terminal 2: Start Next.js app
npm run dev &

# Terminal 3: Run tests
npm test

# Limitations:
# - Requires running json-server (extra process)
# - Can't test error scenarios easily (json-server returns 404s)
# - Can't test sequences (payment status polling)
# - Can't test stateful behavior (cart state)
# - Slower (real HTTP calls to json-server)
# - Flaky (timing issues, port conflicts)

# Approximate test run time: 10-15 seconds
```

**With Scenarist**:
```bash
# Start Next.js app (Scenarist built-in)
npm run dev

# Run tests
npm test

# Benefits:
# ✅ No external dependencies
# ✅ Test error scenarios (payment declined, out of stock)
# ✅ Test sequences (payment status: pending → processing → succeeded)
# ✅ Test stateful behavior (cart accumulates items)
# ✅ Fast (in-memory mocks, no network calls)
# ✅ Reliable (no timing issues, no port conflicts)
# ✅ Parallel tests (isolated via test IDs)

# Approximate test run time: 2-3 seconds
```

### Metrics to Track

After implementation, we'll document:
- Test execution time: fake API vs Scenarist (target: 5-10x faster)
- Setup complexity: 2 processes vs 1 process
- Scenario coverage: limited (fake API) vs comprehensive (Scenarist)

This comparison will be prominently featured in the README to demonstrate value.

### Implementation Details for Comparison

**package.json Scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "fake-api": "json-server fake-api/db.json --port 3001",
    "test": "playwright test",
    "test:fake": "concurrently \"npm run fake-api\" \"npm test\" --kill-others --success first",
    "test:scenarist": "npm test"
  }
}
```

**Bruno Collection Structure:**
```
apps/nextjs-pages-example/bruno/
├── Fake API/
│   ├── Products - Get All.bru
│   ├── Cart - Add Item.bru
│   ├── Cart - Get Items.bru
│   ├── Shipping - Calculate.bru
│   └── Payment - Create.bru
├── Scenarist/
│   ├── Setup/
│   │   └── Switch to Premium Scenario.bru
│   ├── Products/
│   │   ├── Premium Pricing.bru
│   │   └── Standard Pricing.bru
│   ├── Cart/
│   │   ├── Add Multiple Items.bru
│   │   └── Verify State Accumulation.bru
│   ├── Checkout/
│   │   ├── UK Free Shipping.bru
│   │   └── US Paid Shipping.bru
│   └── Payment/
│       ├── Polling Sequence.bru
│       └── Declined Scenario.bru
└── README.md  # Explains Fake API vs Scenarist collections
```

**README Comparison Table:**

The example app's README will include a prominent comparison table:

| Feature | Fake API (json-server) | Scenarist |
|---------|------------------------|-----------|
| **Setup** | 2 processes (json-server + Next.js) | 1 process (Next.js only) |
| **Test Speed** | 10-15 seconds | 2-3 seconds |
| **Error Scenarios** | Limited (only 404s) | Full control (any status code) |
| **Sequences** | ❌ Not possible | ✅ Payment polling, multi-step flows |
| **Stateful Mocks** | ❌ Static data | ✅ Cart accumulation, state capture |
| **Parallel Tests** | ❌ Shared state conflicts | ✅ Test ID isolation |
| **Port Conflicts** | ⚠️ Possible (port 3001) | ✅ No external ports |
| **Maintenance** | Maintain separate db.json | Scenarios in codebase |

---

## Implementation Approach: Small Increments with Agent Verification

**Philosophy**: Work in small, mergeable increments. Each increment should be a known-good state that can be merged independently. Use specialized agents at every step to maintain quality and capture learnings.

### Small-Increment Strategy

Instead of large monolithic PRs, we break each phase into **multiple small PRs**:

1. **Each PR is independently valuable** - Can be merged on its own
2. **Each PR has clear success criteria** - Objective validation
3. **Each PR includes agent verification** - Quality gates at every step
4. **Merge frequently** - Reduce integration risk, maintain momentum

### Agent Usage Throughout

**Required agents for every increment**:

1. 🤖 **TDD Guardian** (`tdd-guardian` agent)
   - **When**: After writing tests, after implementation, after refactoring
   - **Purpose**: Verify RED → GREEN → REFACTOR discipline followed
   - **Use**: Proactively during development, reactively for verification
   - **Example**: `After GREEN phase: Run tdd-guardian to verify minimal implementation`

2. 🔧 **Refactor-Scan** (`refactor-scan` agent)
   - **When**: During REFACTOR step (after tests green)
   - **Purpose**: Assess refactoring opportunities, guide decisions
   - **Use**: Check for semantic duplication, evaluate abstraction value
   - **Example**: `Tests green: Run refactor-scan to assess improvement opportunities`

3. 📚 **Docs Guardian** (`docs-guardian` agent)
   - **When**: After creating/updating documentation
   - **Purpose**: Ensure world-class documentation quality
   - **Use**: Review READMEs, API docs, user-facing documentation
   - **Example**: `After README creation: Run docs-guardian for quality review`

4. 🧠 **Learn Agent** (`learn` agent)
   - **When**: After discoveries, bug fixes, architectural decisions
   - **Purpose**: Capture learnings for CLAUDE.md while context is fresh
   - **Use**: Document gotchas, patterns, decisions, edge cases
   - **Example**: `After completing increment: Run learn agent to capture insights`

### Checkpoint Pattern

**Every PR follows this pattern**:

```
1. Plan the increment (what will be achieved)
2. Write failing tests (RED phase)
3. Implement minimal code (GREEN phase)
   ├─ ✅ Run TDD Guardian (verify minimal implementation)
4. Assess refactoring (REFACTOR phase)
   ├─ ✅ Run Refactor-Scan (evaluate opportunities)
   └─ If refactoring: Refactor, then re-verify with TDD Guardian
5. Update documentation
   ├─ ✅ Run Docs Guardian (quality check)
6. Capture learnings
   ├─ ✅ Run Learn Agent (document discoveries)
7. Commit and create PR
8. Merge to main (known-good state)
```

### Phase 0 Breakdown Example

Phase 0 will be implemented as **one cohesive PR** (not three separate ones - scaffolding is too tightly coupled to split):

**PR: Phase 0 - Setup & Configuration**
- Part A: Next.js example scaffold
- Part B: Playwright helpers scaffold
- Part C: Test infrastructure (Playwright + Vitest configs)
- Part D: First failing test (smoke test)

**Agent Checkpoints**:
1. After Part A: `pnpm build` passes, `pnpm typecheck` passes
2. After Part B: `pnpm build --filter=@scenarist/playwright-helpers` passes
3. After Part C: Configs valid, scripts work
4. After Part D: First test fails (RED phase), TDD Guardian verification
5. Before PR: Docs Guardian (review READMEs), Learn Agent (capture setup learnings)

**Merge Criteria**:
- Both packages build successfully
- TypeScript strict mode, 0 errors
- Test infrastructure configured
- First failing test exists (documented RED phase)
- All agent checkpoints passed

This ensures Phase 0 ships as a complete, working foundation for Phase 1.

---

## TDD Implementation Phases

### Phase 0: Setup Both Packages (🔄 In Progress)

**Estimated**: 0.5 day

#### Part A: Next.js App Scaffold

**Tasks:**
- [ ] Create `apps/nextjs-pages-example/` directory
- [ ] Run `pnpm create next-app` with Pages Router + TypeScript
- [ ] Install dependencies:
  - [ ] Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`)
  - [ ] Playwright (`@playwright/test`)
  - [ ] Vitest (`vitest`, `@vitejs/plugin-react`)
  - [ ] MSW (`msw@latest`)
  - [ ] Scenarist (`@scenarist/core` - workspace dependency)
- [ ] Configure TypeScript strict mode (tsconfig.json)
- [ ] Configure Playwright (playwright.config.ts)
- [ ] Configure Vitest (vitest.config.ts)
- [ ] Configure Tailwind (tailwind.config.js)
- [ ] Create basic layout in `_app.tsx`

**Validation**: `pnpm build` passes, `pnpm typecheck` passes

#### Part B: Playwright Helpers Package Scaffold

**Tasks:**
- [ ] Create `packages/playwright-helpers/` directory
- [ ] Initialize package.json
  - [ ] Add peer dependency: `@playwright/test: ^1.40.0`
  - [ ] Add devDependency: `@playwright/test`, `typescript`, `tsup`
- [ ] Create TypeScript config (tsconfig.json - strict mode)
- [ ] Create build config (tsup.config.ts or package.json scripts)
- [ ] Create basic file structure:
  - [ ] `src/fixtures.ts` (empty for now)
  - [ ] `src/utils.ts` (empty for now)
  - [ ] `src/types.ts` (empty for now)
  - [ ] `src/index.ts` (main exports)
- [ ] Add to workspace (`pnpm-workspace.yaml` - should already include packages/*)
- [ ] Create basic README.md placeholder

**Validation**: `pnpm build --filter=@scenarist/playwright-helpers` passes

**Files Created**:
- `apps/nextjs-pages-example/` (entire app structure)
- `packages/playwright-helpers/` (package structure)

**Learnings**: _(to be filled in during implementation)_

---

### Phase 1: Scenarist Integration + First Helper (⏳ Not Started)

**Estimated**: 1 day

This phase establishes the foundation: MSW + Scenarist setup in Next.js app, then extracts the first helper.

#### 1a. RED - Write Verbose Playwright Test

**Tasks:**
- [ ] Create `tests/playwright/scenario-switching.spec.ts`
- [ ] Write test that manually switches scenario (verbose, no helpers yet)

**Test code:**
```typescript
// apps/nextjs-pages-example/tests/playwright/scenario-switching.spec.ts
import { test, expect } from '@playwright/test';

test('can switch to premium scenario manually', async ({ page }) => {
  // Manually construct test ID
  const testId = `test-premium-${Date.now()}`;

  // Manually call scenario endpoint
  const response = await page.request.post('http://localhost:3000/__scenario__', {
    headers: { 'x-test-id': testId },
    data: { scenarioId: 'premiumUser' }
  });

  expect(response.status()).toBe(200);

  // Manually set test ID header for all requests
  await page.setExtraHTTPHeaders({ 'x-test-id': testId });

  await page.goto('/');

  // Verify we can access the page (even if empty for now)
  await expect(page).toHaveTitle(/E-commerce/);
});
```

**Expected**: Test fails (no `/__scenario__` endpoint yet, no MSW setup)

#### 1b. GREEN - Implement Scenarist Integration

**Tasks:**
- [ ] Create `lib/scenarist.ts` - MSW server setup
- [ ] Create `lib/scenarios.ts` - Define `defaultScenario` and `premiumUserScenario` (minimal)
- [ ] Create API route `pages/api/__scenario__.ts` - Scenario switching endpoint
- [ ] Initialize MSW server in test setup
- [ ] Wire up Scenarist with MSW handlers

**Files:**

```typescript
// lib/scenarist.ts
import { setupServer } from 'msw/node';
import { createScenarioManager, buildConfig } from '@scenarist/core';
import { createMSWHandlers } from '@scenarist/msw-adapter';
import { scenarios } from './scenarios';

// Create Scenarist manager
export const scenarist = createScenarioManager({
  config: buildConfig({
    enabled: true,
    defaultScenarioId: 'default',
  }),
});

// Register all scenarios
Object.values(scenarios).forEach(scenario => {
  scenarist.registerScenario(scenario);
});

// Create MSW server with Scenarist handlers
const handlers = createMSWHandlers(scenarist);
export const server = setupServer(...handlers);

// Start/stop helpers
export const startMockServer = () => {
  server.listen({ onUnhandledRequest: 'bypass' });
};

export const stopMockServer = () => {
  server.close();
};
```

```typescript
// pages/api/__scenario__.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { scenarist } from '../../lib/scenarist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const testId = (req.headers['x-test-id'] as string) || 'default-test';
  const { scenarioId, variantName } = req.body;

  const result = scenarist.switchScenario(testId, scenarioId, variantName);

  if (result.success) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(404).json({ error: result.error.message });
  }
}
```

**Expected**: Test passes (can switch scenario, page loads)

#### 1c. GREEN - Extract Helper

**Tasks:**
- [ ] Create `packages/playwright-helpers/src/fixtures.ts`
- [ ] Implement `ScenaristFixtures` type
- [ ] Implement `test` fixture with auto test ID and `switchScenario` method
- [ ] Export from `src/index.ts`
- [ ] Add `@scenarist/playwright-helpers` as dependency in Next.js app
- [ ] **Create `packages/playwright-helpers/tests/` directory**
- [ ] **Add unit tests for helper utilities** (Layer 2 - Adapter tests):
  - [ ] Test `generateTestId` function (unique IDs, format)
  - [ ] Test `switchScenario` error handling (network errors, 404s)
  - [ ] Test fixture behavior (test ID injection, header setting)
  - [ ] Test testId accessibility from fixture
  - [ ] Target: 100% coverage of helper utilities

**Helper code:**

```typescript
// packages/playwright-helpers/src/types.ts
export type ScenaristFixtures = {
  scenarist: {
    switchScenario: (scenarioId: string, variantName?: string) => Promise<void>;
    testId: string;
  };
};
```

```typescript
// packages/playwright-helpers/src/fixtures.ts
import { test as base, expect } from '@playwright/test';
import type { ScenaristFixtures } from './types';

export const test = base.extend<ScenaristFixtures>({
  scenarist: async ({ page }, use) => {
    // Auto-generate unique test ID
    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Auto-inject test ID header for all requests
    await page.setExtraHTTPHeaders({ 'x-test-id': testId });

    // Scenario switching helper
    const switchScenario = async (scenarioId: string, variantName?: string) => {
      const baseURL = page.context()._options.baseURL || 'http://localhost:3000';
      const response = await page.request.post(`${baseURL}/__scenario__`, {
        headers: { 'x-test-id': testId },
        data: { scenarioId, variantName }
      });

      if (!response.ok()) {
        throw new Error(`Failed to switch scenario: ${response.status()}`);
      }
    };

    await use({ switchScenario, testId });
  },
});

export { expect };
```

```typescript
// packages/playwright-helpers/src/index.ts
export { test, expect } from './fixtures';
export type { ScenaristFixtures } from './types';
```

**Expected**: Helper package builds successfully

#### 1d. REFACTOR - Use Helper in Test

**Tasks:**
- [ ] Update `scenario-switching.spec.ts` to use `@scenarist/playwright-helpers`
- [ ] Verify test still passes
- [ ] Measure LOC reduction (should be ~70% less)

**Refactored test:**
```typescript
// apps/nextjs-pages-example/tests/playwright/scenario-switching.spec.ts
import { test, expect } from '@scenarist/playwright-helpers';

test('can switch to premium scenario with helper', async ({ page, scenarist }) => {
  await scenarist.switchScenario('premiumUser');
  await page.goto('/');
  await expect(page).toHaveTitle(/E-commerce/);
  // 70% less code than before!
});
```

**Validation**:
- Test passes with helper
- Helper package builds
- Before: ~10 lines, After: ~4 lines (60% reduction)

**Files Created**:
- `lib/scenarist.ts`
- `lib/scenarios.ts`
- `pages/api/__scenario__.ts`
- `packages/playwright-helpers/src/fixtures.ts`
- `packages/playwright-helpers/src/types.ts`
- `packages/playwright-helpers/src/index.ts`
- `tests/playwright/scenario-switching.spec.ts`

**Learnings**: _(to be filled in during implementation)_

---

### Phase 2: Products Page - Request Matching (⏳ Not Started)

**Estimated**: 1 day

Implement product listing with tier-based pricing (premium vs standard).

#### 2a. RED - Write Playwright Tests

**Tasks:**
- [ ] Create `tests/playwright/products.spec.ts`
- [ ] Write test for premium pricing
- [ ] Write test for standard pricing

**Test code:**
```typescript
test('premium user sees premium pricing', async ({ page, scenarist }) => {
  await scenarist.switchScenario('premiumUser');
  await page.goto('/');

  const firstProduct = page.locator('[data-testid="product-card"]').first();
  await expect(firstProduct.locator('[data-testid="product-price"]')).toContainText('£99.99');
});

test('standard user sees standard pricing', async ({ page, scenarist }) => {
  await scenarist.switchScenario('standardUser');
  await page.goto('/');

  const firstProduct = page.locator('[data-testid="product-card"]').first();
  await expect(firstProduct.locator('[data-testid="product-price"]')).toContainText('£149.99');
});
```

**Expected**: Tests fail (no products page, no API route)

#### 2b. GREEN - Implement Products Feature

**Tasks:**
- [ ] Create `pages/api/products.ts` - Fetch from external catalog API
- [ ] Create `pages/index.tsx` - Product listing page
- [ ] Create `components/ProductCard.tsx` - Display individual product
- [ ] Create `components/TierSelector.tsx` - Toggle premium/standard
- [ ] Update `lib/scenarios.ts` - Add `premiumUserScenario` and `standardUserScenario` with match criteria

**Scenario example:**
```typescript
export const premiumUserScenario: ScenarioDefinition = {
  id: 'premiumUser',
  name: 'Premium User',
  description: 'Premium tier pricing',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.catalog.com/products',
      match: {
        headers: { 'x-user-tier': 'premium' }
      },
      response: {
        status: 200,
        body: {
          products: [
            { id: '1', name: 'Product A', price: 99.99, tier: 'premium' },
            { id: '2', name: 'Product B', price: 149.99, tier: 'premium' },
          ]
        }
      }
    }
  ]
};
```

**Expected**: Tests pass, products display with correct pricing

#### 2c. REFACTOR

**Tasks:**
- [ ] Extract product types to `types/product.ts`
- [ ] Clean up component structure
- [ ] Add loading states
- [ ] Add error handling

**Validation**:
- Tests still pass
- TypeScript strict mode, 0 errors
- Clean component separation

**Files Created**:
- `pages/index.tsx`
- `pages/api/products.ts`
- `components/ProductCard.tsx`
- `components/TierSelector.tsx`
- `tests/playwright/products.spec.ts`

**Learnings**: _(to be filled in during implementation)_

---

### Phase 3: Shopping Cart - Stateful Mocks (⏳ Not Started)

**Estimated**: 1 day

Implement shopping cart with state capture (add items) and state injection (display cart).

#### 3a. RED - Write Playwright Test

**Tasks:**
- [ ] Create `tests/playwright/cart.spec.ts`
- [ ] Write test for adding items and viewing cart

**Test code:**
```typescript
test('items accumulate in cart across requests', async ({ page, scenarist }) => {
  await scenarist.switchScenario('cartAccumulation');

  // Add items from products page
  await page.goto('/');
  await page.click('[data-testid="add-to-cart-1"]');
  await page.click('[data-testid="add-to-cart-2"]');

  // View cart
  await page.goto('/cart');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('2');

  // Verify individual items displayed
  const items = page.locator('[data-testid="cart-item"]');
  await expect(items).toHaveCount(2);
});
```

**Expected**: Test fails (no cart page, no API routes)

#### 3b. GREEN - Implement Cart Feature

**Tasks:**
- [ ] Create `pages/api/cart/add.ts` - POST endpoint to add items
- [ ] Create `pages/api/cart/index.ts` - GET endpoint to retrieve cart
- [ ] Create `pages/cart.tsx` - Cart display page
- [ ] Create `components/CartItem.tsx` - Display cart item
- [ ] Update `lib/scenarios.ts` - Add `cartAccumulationScenario` with state capture/injection

**Scenario example:**
```typescript
export const cartAccumulationScenario: ScenarioDefinition = {
  id: 'cartAccumulation',
  name: 'Shopping Cart',
  description: 'Stateful cart with item accumulation',
  mocks: [
    // Add item - captures state
    {
      method: 'POST',
      url: 'https://api.cart.com/cart/add',
      captureState: {
        'cartItems[]': 'body.item',  // Append to array
      },
      response: {
        status: 200,
        body: { success: true, message: 'Item added' }
      }
    },
    // Get cart - injects state
    {
      method: 'GET',
      url: 'https://api.cart.com/cart',
      response: {
        status: 200,
        body: {
          items: '{{state.cartItems}}',
          count: '{{state.cartItems.length}}',
          total: 0,
        }
      }
    }
  ]
};
```

**Expected**: Test passes, cart displays accumulated items

#### 3c. REFACTOR

**Tasks:**
- [ ] Extract cart utilities
- [ ] Add cart summary component
- [ ] Add remove item functionality (optional)
- [ ] Clean up state management patterns

**Validation**: Tests pass, demonstrates stateful mocks

**Files Created**:
- `pages/cart.tsx`
- `pages/api/cart/add.ts`
- `pages/api/cart/index.ts`
- `components/CartItem.tsx`
- `tests/playwright/cart.spec.ts`

**Learnings**: _(to be filled in during implementation)_

---

### Phase 4: Checkout - Matching + Stateful (⏳ Not Started)

**Estimated**: 0.5 day

Implement checkout with shipping calculation (match on country, capture address).

#### 4a. RED - Write Playwright Test

**Tasks:**
- [ ] Create `tests/playwright/checkout.spec.ts`
- [ ] Write test for UK free shipping
- [ ] Write test for US paid shipping

**Test code:**
```typescript
test('UK address gets free shipping', async ({ page, scenarist }) => {
  await scenarist.switchScenario('freeShippingUK');

  // Add item to cart
  await page.goto('/');
  await page.click('[data-testid="add-to-cart-1"]');

  // Go to checkout
  await page.goto('/checkout');

  // Fill shipping form
  await page.fill('[name="country"]', 'UK');
  await page.fill('[name="address"]', '123 Test St');
  await page.click('[data-testid="calculate-shipping"]');

  // Verify free shipping
  await expect(page.locator('[data-testid="shipping-cost"]')).toHaveText('£0.00');
});
```

**Expected**: Test fails (no checkout page)

#### 4b. GREEN - Implement Checkout

**Tasks:**
- [ ] Create `pages/api/checkout/shipping.ts` - Calculate shipping
- [ ] Create `pages/checkout.tsx` - Checkout form
- [ ] Create `components/CheckoutForm.tsx` - Form component
- [ ] Update `lib/scenarios.ts` - Add `freeShippingUK` scenario

**Expected**: Test passes

#### 4c. REFACTOR

**Tasks:**
- [ ] Extract shipping logic
- [ ] Add form validation
- [ ] Clean up form state

**Validation**: Demonstrates composition of matching + stateful

**Files Created**:
- `pages/checkout.tsx`
- `pages/api/checkout/shipping.ts`
- `components/CheckoutForm.tsx`
- `tests/playwright/checkout.spec.ts`

**Learnings**: _(to be filled in during implementation)_

---

### Phase 5: Payment Polling - Sequences (⏳ Not Started)

**Estimated**: 1 day

Implement payment with status polling (sequence: pending → processing → succeeded).

#### 5a. RED - Write Playwright Test

**Tasks:**
- [ ] Create `tests/playwright/payment.spec.ts`
- [ ] Write test for payment status progression
- [ ] Write test for payment declined

**Test code:**
```typescript
test('payment status polls and progresses', async ({ page, scenarist }) => {
  await scenarist.switchScenario('paymentPolling');

  // Create payment
  await page.goto('/checkout');
  // ... fill form, add items
  await page.click('[data-testid="submit-payment"]');

  // Wait for redirect to payment status page
  await expect(page).toHaveURL(/\/payment\//);

  // Initial status: pending
  await expect(page.locator('[data-status="pending"]')).toBeVisible();

  // Status updates via polling
  await expect(page.locator('[data-status="processing"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-status="succeeded"]')).toBeVisible({ timeout: 5000 });

  // Confirmation message
  await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
});
```

**Expected**: Test fails (no payment pages, no polling)

#### 5b. GREEN - Implement Payment

**Tasks:**
- [ ] Create `pages/api/payment/create.ts` - Create payment
- [ ] Create `pages/api/payment/status/[id].ts` - Get payment status (sequence)
- [ ] Create `pages/payment/[orderId].tsx` - Payment status page
- [ ] Create `hooks/usePaymentPolling.ts` - Polling hook
- [ ] Update `lib/scenarios.ts` - Add `paymentPollingScenario` and `paymentDeclinedScenario`

**Scenario example:**
```typescript
export const paymentPollingScenario: ScenarioDefinition = {
  id: 'paymentPolling',
  name: 'Payment Polling',
  description: 'Payment status sequence',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.payments.com/payment/create',
      response: {
        status: 200,
        body: { paymentId: 'pay_123', status: 'pending' }
      }
    },
    {
      method: 'GET',
      url: 'https://api.payments.com/payment/:id/status',
      sequence: {
        responses: [
          { status: 200, body: { status: 'pending' } },
          { status: 200, body: { status: 'processing' } },
          { status: 200, body: { status: 'succeeded' } },
        ],
        repeat: 'last'  // Stay on 'succeeded' after reaching it
      }
    }
  ]
};
```

**Expected**: Test passes, demonstrates sequences

#### 5c. REFACTOR

**Tasks:**
- [ ] Extract polling logic to custom hook
- [ ] Add error handling for polling
- [ ] Add loading states
- [ ] Clean up payment flow

**Validation**: Demonstrates response sequences with polling

**Files Created**:
- `pages/payment/[orderId].tsx`
- `pages/api/payment/create.ts`
- `pages/api/payment/status/[id].ts`
- `hooks/usePaymentPolling.ts`
- `tests/playwright/payment.spec.ts`

**Learnings**: _(to be filled in during implementation)_

---

### Phase 6: Parallel Test Isolation (⏳ Not Started)

**Estimated**: 0.5 day

Prove parallel test execution with different scenarios doesn't interfere.

#### 6a. RED - Write Parallel Tests

**Tasks:**
- [ ] Create `tests/playwright/isolation.spec.ts`
- [ ] Write 3+ tests that run concurrently with different scenarios
- [ ] Configure Playwright to run tests in parallel

**Test code:**
```typescript
import { test, expect } from '@scenarist/playwright-helpers';

test.describe.configure({ mode: 'parallel' });

test('concurrent test 1: premium user full flow', async ({ page, scenarist }) => {
  await scenarist.switchScenario('premiumUser');

  // Full premium flow: products → cart → checkout → payment
  await page.goto('/');
  await expect(page.locator('[data-testid="product-price"]').first()).toContainText('£99.99');
  // ... rest of flow
});

test('concurrent test 2: standard user full flow', async ({ page, scenarist }) => {
  await scenarist.switchScenario('standardUser');

  // Full standard flow: products → cart → checkout → payment
  await page.goto('/');
  await expect(page.locator('[data-testid="product-price"]').first()).toContainText('£149.99');
  // ... rest of flow
});

test('concurrent test 3: payment declined flow', async ({ page, scenarist }) => {
  await scenarist.switchScenario('paymentDeclined');

  // Payment failure flow
  await page.goto('/checkout');
  // ... checkout flow
  await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
});

// All 3 tests run in parallel with different test IDs - no interference!
```

**Expected**: All tests pass in parallel

#### 6b. Validation

**Tasks:**
- [ ] Run tests with `--workers=3` or more
- [ ] Verify no test interference
- [ ] Verify each test uses unique test ID
- [ ] Measure execution time (parallel should be faster)

**Validation**:
- All tests pass in parallel
- Demonstrates test ID isolation
- Proves concurrent scenario usage works

**Files Created**:
- `tests/playwright/isolation.spec.ts`

**Learnings**: _(to be filled in during implementation)_

---

### Phase 7: Documentation & Polish (⏳ Not Started)

**Estimated**: 1 day

Comprehensive documentation for both packages.

#### Playwright Helpers Package

**Tasks:**
- [ ] Write comprehensive README.md
  - [ ] Installation instructions
  - [ ] Before/After comparison (with LOC metrics)
  - [ ] API documentation (fixtures, types, utils)
  - [ ] Usage examples (Next.js, Express)
  - [ ] TypeScript types reference
  - [ ] Troubleshooting section
- [ ] Add package.json metadata
  - [ ] Description
  - [ ] Keywords
  - [ ] Repository URL
  - [ ] Homepage
  - [ ] Author
- [ ] Add CHANGELOG.md (initial v0.1.0)
- [ ] Verify all exports work correctly
- [ ] Build and test package locally

**Validation**: Package can be installed and used in example apps

#### Next.js Pages Example

**Tasks:**
- [ ] Write comprehensive README.md
  - [ ] Project overview
  - [ ] Setup instructions (installation, running locally)
  - [ ] Architecture explanation (e-commerce flow, MSW setup)
  - [ ] Running tests (Playwright, Vitest, Bruno)
  - [ ] Scenario demonstrations (all 7 scenarios)
  - [ ] How it uses Playwright helpers
  - [ ] Code walkthrough (key files explained)
- [ ] Create Bruno collection
  - [ ] Setup requests (switch scenarios)
  - [ ] Product listing requests (premium/standard)
  - [ ] Cart requests (add items, view cart)
  - [ ] Checkout requests (shipping calculation)
  - [ ] Payment requests (create, poll status)
  - [ ] 10+ requests total with assertions
- [ ] Add screenshots (optional but nice)
  - [ ] Products page
  - [ ] Cart page
  - [ ] Checkout form
  - [ ] Payment status
- [ ] Verify all links work
- [ ] Proofread all documentation

**Validation**: New developer can clone, setup, run tests, and understand the code

#### Update Project Documentation

**Tasks:**
- [ ] Update `docs/plans/next-stages.md`
  - [ ] Mark "Next.js Example Application" as complete
  - [ ] Update checkboxes
- [ ] Update root README.md
  - [ ] Add Playwright helpers to package list
  - [ ] Add Next.js example to examples list
  - [ ] Link to new packages
- [ ] Update this plan document (next-stages-and-playwright-helpers.md)
  - [ ] Mark all phases complete
  - [ ] Add final learnings
  - [ ] Add metrics (LOC reduction, test counts, etc.)

**Validation**: All documentation is accurate and up-to-date

**Files Created**:
- `packages/playwright-helpers/README.md`
- `packages/playwright-helpers/CHANGELOG.md`
- `apps/nextjs-pages-example/README.md`
- `apps/nextjs-pages-example/bruno/` (collection)
- Updated: `docs/plans/next-stages.md`
- Updated: Root `README.md`

**Learnings**: _(to be filled in during implementation)_

---

## Progress Tracking

**Overall Progress**: 0/7 phases complete (0%)

| Phase | Status | Estimated | Actual | Files Changed |
|-------|--------|-----------|--------|---------------|
| 0: Setup | ⏳ Not Started | 0.5 day | - | 0 |
| 1: Integration + First Helper | ⏳ Not Started | 1 day | - | 0 |
| 2: Products/Matching | ⏳ Not Started | 1 day | - | 0 |
| 3: Cart/Stateful | ⏳ Not Started | 1 day | - | 0 |
| 4: Checkout/Composition | ⏳ Not Started | 0.5 day | - | 0 |
| 5: Payment/Sequences | ⏳ Not Started | 1 day | - | 0 |
| 6: Parallel Isolation | ⏳ Not Started | 0.5 day | - | 0 |
| 7: Documentation | ⏳ Not Started | 1 day | - | 0 |
| **Total** | **0%** | **6 days** | **-** | **0** |

**Next Steps**: Begin Phase 0 - Setup both packages

---

## Success Criteria

### Playwright Helpers Package

- [x] Package structure created
- [ ] Reduces test boilerplate by 70%+ (measurable via LOC comparison)
- [ ] 100% TypeScript coverage with strict mode
- [ ] Unit tests for all utilities
- [ ] Comprehensive README with before/after examples
- [ ] Works with Next.js example (proven)
- [ ] Can work with Express example (documented, not necessarily implemented)
- [ ] Published to workspace (not npm yet)

### Next.js Pages Example

- [x] Application structure created
- [ ] All Playwright E2E tests passing (20+ tests across 5 specs)
- [ ] All Vitest API tests passing (100% API route coverage)
- [ ] Demonstrates request matching naturally (premium/standard tiers)
- [ ] Demonstrates sequences naturally (payment polling)
- [ ] Demonstrates stateful mocks naturally (shopping cart)
- [ ] Tests run in parallel without interference (isolation proof)
- [ ] TypeScript strict mode, 0 errors
- [ ] Comprehensive README with setup instructions
- [ ] Bruno collection with 10+ requests
- [ ] Clean, production-quality code

### Overall

- [ ] Both packages build successfully (`pnpm build`)
- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Documentation is comprehensive and accurate
- [ ] Plan document updated with learnings and metrics

---

## Key Technical Decisions

### 1. MSW Server Lifecycle

**Decision**: Initialize MSW server in Playwright test setup, not per-test

**Rationale**:
- MSW server is global state, should be started once
- Starting/stopping per test is slow and unnecessary
- Scenarist handles scenario isolation via test IDs

**Implementation**:
```typescript
// tests/playwright/setup.ts
import { startMockServer, stopMockServer } from '../../lib/scenarist';

export default async function globalSetup() {
  startMockServer();
  return async () => {
    stopMockServer();
  };
}
```

### 2. Test ID Propagation

**Decision**: Use Playwright fixtures to auto-inject test ID headers

**Rationale**:
- Fixtures provide test-scoped context
- Auto-injection happens once per test, not per page navigation
- No need to manually set headers in every test
- Cleaner API

**Implementation**:
```typescript
// Fixture sets header once
await page.setExtraHTTPHeaders({ 'x-test-id': testId });

// All subsequent requests include the header automatically
await page.goto('/');  // Has header
await page.click('[data-testid="button"]');  // Has header
```

### 3. Scenario Switching Pattern

**Decision**: Call `/__scenario__` endpoint before navigation, not during

**Rationale**:
- Scenarist stores scenario per test ID server-side
- Switch once, all requests use that scenario
- No need to switch before every page
- Matches real-world usage (set scenario at test start)

**Implementation**:
```typescript
test('my test', async ({ page, scenarist }) => {
  await scenarist.switchScenario('premiumUser');  // Switch once

  await page.goto('/');  // Uses premium scenario
  await page.goto('/cart');  // Still uses premium scenario
  await page.goto('/checkout');  // Still uses premium scenario
});
```

### 4. baseURL Configuration

**Decision**: Read baseURL from Playwright config, don't hardcode

**Rationale**:
- Makes helpers work with any Playwright setup
- Supports different environments (localhost, staging, prod)
- User configures baseURL in `playwright.config.ts`, helpers respect it

**Implementation**:
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
  },
});

// Helper reads this automatically
const baseURL = page.context()._options.baseURL || 'http://localhost:3000';
```

### 5. Why Fixtures Over Standalone Functions?

**Decision**: Use Playwright fixtures, not standalone helper functions

**Alternatives Considered**:
```typescript
// Alternative 1: Standalone functions (rejected)
import { switchScenario, setTestId } from '@scenarist/playwright-helpers';

test('my test', async ({ page }) => {
  const testId = generateTestId();
  await setTestId(page, testId);
  await switchScenario(page, testId, 'premiumUser');
  // Too much boilerplate, easy to forget steps
});

// Alternative 2: Page extension (rejected)
// Would require patching Playwright's Page type, fragile

// Chosen: Fixtures (best)
test('my test', async ({ page, scenarist }) => {
  await scenarist.switchScenario('premiumUser');
  // Clean, testId handled automatically
});
```

**Rationale**:
- ✅ Fixtures provide test-scoped context
- ✅ Auto-injection of headers (no manual setup)
- ✅ Cleaner API (no passing testId everywhere)
- ✅ Aligns with Playwright's extension model
- ✅ TypeScript-friendly (fixtures are typed)

---

## Timeline

**Estimated Total**: 5-6 days of focused work

**Breakdown**:
- Phase 0: Setup (0.5 day)
- Phase 1: Integration + First Helper (1 day)
- Phase 2: Products/Matching (1 day)
- Phase 3: Cart/Stateful (1 day)
- Phase 4: Checkout/Composition (0.5 day)
- Phase 5: Payment/Sequences (1 day)
- Phase 6: Parallel Isolation (0.5 day)
- Phase 7: Documentation (1 day)

**Actual**: _(to be filled in as we progress)_

**Start Date**: TBD (after PR approval)
**Target Completion**: TBD

---

## Learnings

_(This section will be filled in during implementation with discoveries, gotchas, and insights)_

### Phase 0 Learnings
- _(to be added)_

### Phase 1 Learnings
- _(to be added)_

### Phase 2 Learnings
- _(to be added)_

### Phase 3 Learnings
- _(to be added)_

### Phase 4 Learnings
- _(to be added)_

### Phase 5 Learnings
- _(to be added)_

### Phase 6 Learnings
- _(to be added)_

### Phase 7 Learnings
- _(to be added)_

---

## Metrics

### Test Coverage

- **Playwright E2E tests**: 0 / 20 (target)
- **Vitest API tests**: 0 (100% coverage target)
- **Bruno requests**: 0 / 10 (target)

### Code Quality

- **TypeScript errors**: 0 (always, strict mode)
- **Linting warnings**: 0 (always)
- **Test boilerplate reduction**: TBD (70% target after Phase 1)

### Performance

- **Fake API test run**: TBD seconds (baseline)
- **Scenarist test run**: TBD seconds (with mocks)
- **Speed improvement**: TBD% (target: 5-10x faster)

### Build Times

- **Next.js app build**: TBD seconds
- **Playwright helpers build**: TBD seconds

### LOC Comparison (Phase 1)

**Before (verbose test without helpers)**:
- Lines of code: TBD
- Boilerplate: TBD lines

**After (with helpers)**:
- Lines of code: TBD
- Boilerplate: TBD lines
- Reduction: TBD%

### Final Summary (After Phase 7)

**Playwright Helpers:**
- Total LOC reduction: TBD%
- Test count using helpers: TBD
- Build size: TBD KB
- Package exports: TBD

**Next.js Pages Example:**
- Total files created: TBD
- Total lines of code: TBD
- Playwright E2E tests: TBD specs, TBD total tests
- Vitest API tests: TBD tests
- Bruno collection: TBD requests
- TypeScript errors: 0
- Test coverage: TBD%
- Scenarios implemented: TBD / 7

---

## Decision Log

### Decisions Made During Implementation

[This section will be filled in as we make decisions during implementation]

**Template format:**
- **Date**: YYYY-MM-DD
- **Phase**: Phase N
- **Decision**: What was decided
- **Rationale**: Why this decision was made
- **Alternatives Considered**: What else was considered and why rejected
- **Impact**: What this affects

**Example:**
- **Date**: 2025-10-27
- **Phase**: Phase 0
- **Decision**: Use json-server for fake API
- **Rationale**: Simple, zero-code, highlights Scenarist's advantages through limitations
- **Alternatives Considered**: Prism (too complex), custom Express (too much work), MSW standalone (defeats comparison purpose)
- **Impact**: Enables clear before/after comparison in README

### Decisions Deferred

[Things we consciously decided NOT to do yet]

**Template format:**
- **Decision**: What was deferred
- **Rationale**: Why not doing it now
- **Revisit**: When to reconsider
- **Phase**: When this came up

### Mistakes & Corrections

[What didn't work and how we fixed it - learning opportunities]

**Template format:**
- **Issue**: What went wrong
- **Cause**: Root cause analysis
- **Fix**: How we resolved it
- **Learning**: What we learned for future phases
- **Phase**: When this happened

---

## Risk Tracking

### High Priority Risks

Track and monitor risks identified in planning:

**1. MSW + Next.js Integration**
- **Risk**: MSW might not intercept Next.js API routes correctly
- **Status**: Not yet validated
- **Mitigation**: Phase 0 validates this immediately (fail fast if broken)
- **Validation**: ONE test must pass calling API route through MSW
- **Outcome**: TBD

**2. Playwright Fixtures with Next.js**
- **Risk**: Fixture pattern might not work with Next.js Pages Router
- **Status**: Not yet validated
- **Mitigation**: Phase 1 extracts from working verbose test (proven pattern)
- **Validation**: Helper must work after extraction
- **Outcome**: TBD

**3. Test ID Propagation**
- **Risk**: Test ID headers might not propagate from page → API route
- **Status**: Not yet validated
- **Mitigation**: Phase 0 validates header flow, Phase 6 proves isolation
- **Validation**: Different test IDs must not interfere in parallel
- **Outcome**: TBD

**4. Scope Creep in Scenarios**
- **Risk**: Scenarios become too complex, obscure core value
- **Status**: Watching
- **Mitigation**: Keep scenarios simple, focus on demonstrating ONE feature each
- **Validation**: Each scenario should be <20 lines of definition
- **Outcome**: TBD

### Medium Priority Risks

**5. Premature Helper Extraction**
- **Risk**: Extracting helpers before understanding real needs
- **Status**: Watching
- **Mitigation**: TDD approach - write verbose test first, extract after proven
- **Validation**: Helper API must feel natural, not forced
- **Outcome**: TBD

**6. Feature Dependencies**
- **Risk**: Features become coupled, hard to test independently
- **Status**: Watching
- **Mitigation**: Keep features independent (cart doesn't need products)
- **Validation**: Each feature should work standalone
- **Outcome**: TBD

**7. Time Estimation**
- **Risk**: 6-day estimate might be optimistic
- **Status**: Watching
- **Mitigation**: Track actual time per phase, adjust if needed
- **Validation**: If Phase 0 takes >1 day, something's wrong
- **Outcome**: TBD

### Low Priority Risks

**8. Documentation Clarity**
- **Risk**: README might not clearly show Scenarist value
- **Status**: Low concern
- **Mitigation**: Prominently feature before/after comparison
- **Validation**: New developer should understand value in <5 minutes
- **Outcome**: TBD

### Mitigations Applied

[Track what we did to mitigate risks as we discover them]

**Template format:**
- **Risk**: Which risk from above
- **Mitigation**: What we did
- **Effective?**: Yes/No/Partial
- **Phase**: When applied

---

## Related Documentation

- [Next Stages Plan](./next-stages.md) - Overall v1.0 roadmap
- [Express Example](../../apps/express-example/) - Existing example app
- [Core Functionality](../core-functionality.md) - Scenarist features explained
- [ADR-0002: Dynamic Response System](../adrs/0002-dynamic-response-system.md) - Three-phase execution model

---

## Appendix: File Checklist

Quick reference of all files to be created/modified:

### Playwright Helpers Package (`packages/playwright-helpers/`)
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `tsup.config.ts` (or build script)
- [ ] `README.md`
- [ ] `CHANGELOG.md`
- [ ] `src/fixtures.ts`
- [ ] `src/types.ts`
- [ ] `src/utils.ts`
- [ ] `src/index.ts`
- [ ] `tests/fixtures.test.ts`

### Next.js Pages Example (`apps/nextjs-pages-example/`)

**Config files:**
- [ ] `package.json`
- [ ] `tsconfig.json`
- [ ] `next.config.js`
- [ ] `tailwind.config.js`
- [ ] `postcss.config.js`
- [ ] `playwright.config.ts`
- [ ] `vitest.config.ts`
- [ ] `README.md`

**Pages:**
- [ ] `src/pages/_app.tsx`
- [ ] `src/pages/index.tsx`
- [ ] `src/pages/cart.tsx`
- [ ] `src/pages/checkout.tsx`
- [ ] `src/pages/payment/[orderId].tsx`

**API Routes:**
- [ ] `src/pages/api/__scenario__.ts`
- [ ] `src/pages/api/products.ts`
- [ ] `src/pages/api/cart/index.ts`
- [ ] `src/pages/api/cart/add.ts`
- [ ] `src/pages/api/checkout/shipping.ts`
- [ ] `src/pages/api/payment/create.ts`
- [ ] `src/pages/api/payment/status/[id].ts`

**Components:**
- [ ] `src/components/ProductCard.tsx`
- [ ] `src/components/TierSelector.tsx`
- [ ] `src/components/CartItem.tsx`
- [ ] `src/components/CheckoutForm.tsx`

**Lib:**
- [ ] `src/lib/scenarist.ts`
- [ ] `src/lib/scenarios.ts`

**Hooks:**
- [ ] `src/hooks/usePaymentPolling.ts`

**Tests:**
- [ ] `tests/playwright/setup.ts`
- [ ] `tests/playwright/scenario-switching.spec.ts`
- [ ] `tests/playwright/products.spec.ts`
- [ ] `tests/playwright/cart.spec.ts`
- [ ] `tests/playwright/checkout.spec.ts`
- [ ] `tests/playwright/payment.spec.ts`
- [ ] `tests/playwright/isolation.spec.ts`
- [ ] `tests/api/products.test.ts`
- [ ] `tests/api/cart.test.ts`

**Bruno:**
- [ ] `bruno/Setup/Switch to Premium.bru`
- [ ] `bruno/Products/Get Products.bru`
- [ ] `bruno/Cart/Add Item.bru`
- [ ] `bruno/Cart/Get Cart.bru`
- [ ] `bruno/Checkout/Calculate Shipping.bru`
- [ ] `bruno/Payment/Create Payment.bru`
- [ ] `bruno/Payment/Get Status.bru`
- [ ] (10+ total requests)

**Total New Files**: ~50+

---

## Update Log

Track when this document was updated and why. This helps maintain document history and shows evolution of the plan.

| Date | Phase | Update | Author |
|------|-------|--------|--------|
| 2025-10-27 | Planning | Initial comprehensive plan created | Claude |
| 2025-10-27 | Planning | Merged with working document for unified tracking | Claude |
| 2025-11-01 | Phase -1 | Next.js adapter implementation complete (1 day, 58 tests, 100% coverage) | Claude |
| 2025-11-01 | Phase -1 | Phase -1 complete and merged via PR #40. Added refactorings (3 refactorings, ~280 lines eliminated), coverage improvements (66 tests, 93.2% functions), TDD verification (95/100, APPROVED), and comprehensive learnings section | Claude |

**Update Guidelines:**
- Add entry when making significant changes (not typo fixes)
- Include phase, what changed, and why
- Be concise but informative
- Date format: YYYY-MM-DD

---

**End of Plan Document**
