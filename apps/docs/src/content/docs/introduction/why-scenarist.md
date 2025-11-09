---
title: Why Scenarist?
description: The pain points Scenarist solves and how Scenarist's framework-agnostic architecture enables true full-stack testing
---

# Why Scenarist?

## The Problem: The Testing Gap

Whether you're building with **Express**, **Hono**, **Fastify**, **Next.js**, or **Remix**, you probably test your backend using this standard approach:

### What Teams Actually Do Today

**1. Unit Tests (Jest/Vitest)** - Test business logic in isolation
```typescript
// Test individual functions
test('calculateDiscount returns 20% for premium', () => {
  expect(calculateDiscount(100, 'premium')).toBe(80);
});

test('validatePaymentAmount rejects negative amounts', () => {
  expect(validatePaymentAmount(-100)).toBe(false);
});
```

**2. Browser Tests (Playwright/Cypress)** - Test happy path only
```typescript
// Test one scenario: successful checkout
test('user completes checkout', async ({ page }) => {
  await page.goto('/checkout');
  await page.fill('[name="amount"]', '100');
  await page.click('button[type="submit"]');
  await expect(page.getByText('Success')).toBeVisible();
});
```

### The Critical Gap

**What's painful with unit tests:**

You CAN test server-side logic in unit tests, but it requires extensive code-level mocking:
- ⚠️ Mock request/response objects manually
- ⚠️ Mock session state and auth context
- ⚠️ Mock middleware chains and execution order
- ⚠️ Mock database connections, external service clients
- ⚠️ Server Components require especially complex test setup

**The risk:** Those mocks create distance from production. Code tested with mocked sessions/auth/middleware can hide bugs that only surface when users hit real journeys with real server-side context.

**What browser tests DON'T cover:**
- ❌ Error scenarios (payment failures, validation errors, API timeouts)
- ❌ Edge cases (negative amounts, invalid formats, missing fields)
- ❌ Different user states (premium vs standard, authenticated vs guest)
- ❌ Various API response scenarios (rate limits, partial failures)

**Why? Because testing multiple scenarios in the browser requires:**
- Mocking external APIs per scenario (complex setup)
- OR restarting your server per scenario (impractical in CI)
- OR hitting real external APIs (slow, flaky, expensive)

**The result:** You can test everything in unit tests with enough mocking, but those mocks create a gap between how you test and how code actually runs in production. Browser tests give you production-like execution, but only for the happy path.

### What Developers Actually Need

Test your backend logic (API routes, validation, middleware, business rules) through real HTTP requests in the browser with multiple scenarios—without external API dependencies and without server restarts.

## How Scenarist Solves This

Scenarist mocks **only external APIs you don't control** (Stripe, SendGrid, Auth0, etc.) while letting **your entire backend run normally**. Your API routes execute. Your validation logic runs. Your middleware chains process requests. Your business logic calculates results. Your SSR fetches and renders data. Your Server Components render (Next.js). Everything in your codebase executes just like production.

### The Architecture

Scenarist is built using **hexagonal architecture** (ports and adapters):

- **Core domain** = Framework-agnostic scenario management with zero dependencies
- **Thin adapters** = Small integration layers for Express, Next.js, Fastify, etc. (typically ~100 lines)
- **MSW integration** = Intercepts only EXTERNAL HTTP calls, not your application code

This means:
1. Write scenario definitions once (plain JavaScript objects)
2. Use with any framework via thin adapters
3. Switch scenarios at runtime with a single HTTP request
4. Run parallel tests with perfect isolation (unique test IDs per test)

**The key insight:** Your application runs one instance. MSW intercepts external API calls. Scenarist routes each test to its own mock scenario based on test ID headers. No restarts. No shared state. Your backend always executes.

## Real-World Example: Premium Checkout API

Let's see this with a complex feature that's nearly impossible to test with traditional approaches. This example uses **Express**, but the same principles apply to Next.js, Hono, Fastify, or any Node.js framework.

### The Feature Requirements

**A checkout API with tier-based pricing and validation:**

- User authenticates via OAuth (external auth provider API)
- Premium/Standard tier retrieved from session
- `/api/cart` endpoint:
  - Fetches user tier from external auth API
  - Calculates dynamic pricing (premium users get 20% discount)
  - Returns cart with personalized prices
- `/api/checkout` endpoint validates payment:
  - Middleware checks authentication
  - Validates tier-based limits (premium: $10,000, standard: $1,000)
  - Processes payment via Stripe API (external)
  - Sends confirmation email via SendGrid API (external)
  - Returns success/error response
- Frontend displays cart and checkout UI (tested in browser)

### Test Coverage Needed

✅ Premium users see 20% discount (API pricing logic)
✅ Standard users see full price (API pricing logic)
✅ Premium checkout succeeds at $5,000 (validation allows it)
✅ Standard checkout blocked at $1,500 (validation rejects it)
✅ Failed Stripe payment shows error (error handling)
✅ Successful payment sends email (SendGrid integration)
✅ All scenarios run in parallel without interference

### With Traditional Approaches: 4 Bad Options

<details>
<summary><strong>❌ Option 1: Jest/Vitest (Can't test browser flows)</strong></summary>

```typescript
// Can test individual functions, but not the full flow
test('calculateDiscount returns 20% for premium', () => {
  expect(calculateDiscount(100, 'premium')).toBe(80);
  // ✅ Tests function in isolation
  // ❌ Doesn't test API endpoint behavior
  // ❌ Doesn't test middleware execution
  // ❌ Doesn't test full user journey in browser
});
```

**Why it fails:** No browser, can't test how your API routes respond to actual HTTP requests, can't test full user journey.

</details>

<details>
<summary><strong>❌ Option 2: Playwright with True E2E (Too slow)</strong></summary>

```bash
# Test premium scenario
$ TIER=premium STRIPE_KEY=test npm run dev
$ playwright test premium.spec.ts  # 45 seconds (app startup + test)

# Must kill and restart for standard scenario
$ kill $(lsof -t -i:3000)
$ TIER=standard STRIPE_KEY=test npm run dev
$ playwright test standard.spec.ts  # 45 seconds

# Total: 90 seconds for 2 tests
# Can't run in parallel (port conflicts)
# Real external API calls (Stripe/SendGrid) make tests slow and flaky
```

**Why it fails:** App restart per scenario = slow. Can't run parallel tests. Real external API calls create flaky tests.

</details>

<details>
<summary><strong>❌ Option 3: Playwright + MSW (Mocking Your Backend)</strong></summary>

```typescript
// Mock your own API routes
worker.use(
  http.get('/api/cart', () => {
    return HttpResponse.json({
      items: [...],
      discount: 0.2,  // Hardcoded - your pricing logic never runs
      total: 4000     // Hardcoded - your calculation never runs
    });
  })
);

test('premium user sees discount', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByText('$4,000')).toBeVisible();
  // ✅ Test passes
  // ❌ Your Server Component never rendered
  // ❌ Your pricing calculation never executed
  // ❌ You tested the mock, not your code
});
```

**Why it fails:** Mocking your own API routes means your backend logic (Server Components, validation, business logic) never executes. You're testing mock responses, not actual application behavior.

</details>

<details>
<summary><strong>❌ Option 4: Cypress (Stubs everything)</strong></summary>

```typescript
cy.intercept('GET', '/api/cart', { fixture: 'premium-cart.json' });
cy.visit('/cart');
cy.contains('$4,000').should('be.visible');

// Your Server Component never rendered
// Your API route never ran
// Testing stubs, not real code
```

**Why it fails:** Same as MSW—backend bypassed completely.

</details>

### With Scenarist: Test Everything, Fast

Scenarist mocks **only external APIs** while your backend runs normally:

```typescript
// Scenario definition (framework-agnostic)
const premiumCheckoutScenario = {
  id: 'premiumCheckout',
  name: 'Premium User Checkout Flow',
  mocks: [
    // Mock EXTERNAL auth API (not your code)
    {
      method: 'GET',
      url: 'https://auth.provider.com/api/session',
      response: {
        status: 200,
        body: { userId: 'user-123', tier: 'premium' }
      }
    },
    // Mock EXTERNAL Stripe API (not your code)
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: { id: 'ch_123', status: 'succeeded' }
      }
    },
    // Mock EXTERNAL SendGrid API (not your code)
    {
      method: 'POST',
      url: 'https://api.sendgrid.com/v3/mail/send',
      response: { status: 202 }
    }
  ]
};

const standardCheckoutScenario = {
  id: 'standardCheckout',
  name: 'Standard User Checkout Flow',
  mocks: [
    {
      method: 'GET',
      url: 'https://auth.provider.com/api/session',
      response: {
        status: 200,
        body: { userId: 'user-456', tier: 'standard' } // Different tier
      }
    },
    // Same Stripe/SendGrid mocks...
  ]
};

const paymentFailureScenario = {
  id: 'paymentFailure',
  name: 'Stripe Payment Failure',
  mocks: [
    // Auth returns premium tier
    { /* ... */ },
    // But Stripe fails
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 402,
        body: { error: 'card_declined' }
      }
    }
  ]
};

export const scenarios = {
  default: premiumCheckoutScenario,
  premiumCheckout: premiumCheckoutScenario,
  standardCheckout: standardCheckoutScenario,
  paymentFailure: paymentFailureScenario,
} as const satisfies ScenaristScenarios;
```

### Your Tests (All Run in Parallel)

```typescript
import { test, expect } from '@scenarist/playwright-helpers';

test('premium user sees 20% discount in cart', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumCheckout'); // Instant (no restart)

  await page.goto('/cart');

  // Your API route /api/cart:
  // 1. Fetches session from mocked auth API → gets tier: 'premium'
  // 2. YOUR pricing logic executes: price * 0.8
  // 3. YOUR API returns calculated discount
  // 4. Browser renders the response

  await expect(page.getByText('$4,000.00')).toBeVisible(); // Was $5000, 20% off
  await expect(page.getByText('Premium Member Discount')).toBeVisible();
});

test('standard user sees full price in cart', async ({ page, switchScenario }) => {
  await switchScenario(page, 'standardCheckout'); // Instant switch (same app instance!)

  await page.goto('/cart');

  // Your API route /api/cart:
  // 1. Fetches session from mocked auth API → gets tier: 'standard'
  // 2. YOUR pricing logic executes: price * 1.0 (no discount)
  // 3. YOUR API returns full price
  // 4. Browser renders the response

  await expect(page.getByText('$5,000.00')).toBeVisible(); // Full price
  await expect(page.queryByText('Premium Member Discount')).not.toBeVisible();
});

test('premium user completes $5000 checkout', async ({ page, switchScenario }) => {
  await switchScenario(page, 'premiumCheckout');

  await page.goto('/checkout');
  await page.fill('[name="amount"]', '5000');
  await page.click('button[type="submit"]');

  // API route executes:
  // 1. Fetches tier from mocked auth API → 'premium'
  // 2. YOUR validation logic: 5000 <= 10000 (premium limit) ✓
  // 3. Calls mocked Stripe API → success
  // 4. Calls mocked SendGrid API → email queued
  // 5. YOUR response handling returns success

  await expect(page.getByText('Order confirmed')).toBeVisible();
  await expect(page.getByText('Check your email')).toBeVisible();
});

test('standard user blocked at $1500', async ({ page, switchScenario }) => {
  await switchScenario(page, 'standardCheckout');

  await page.goto('/checkout');
  await page.fill('[name="amount"]', '1500');
  await page.click('button[type="submit"]');

  // API route executes:
  // 1. Fetches tier from mocked auth API → 'standard'
  // 2. YOUR validation logic: 1500 > 1000 (standard limit) ✗
  // 3. YOUR error handling returns rejection

  await expect(page.getByText('Amount exceeds your account limit')).toBeVisible();
  await expect(page.getByText('Upgrade to Premium')).toBeVisible();
});

test('stripe payment failure shows error', async ({ page, switchScenario }) => {
  await switchScenario(page, 'paymentFailure');

  await page.goto('/checkout');
  await page.fill('[name="amount"]', '100');
  await page.click('button[type="submit"]');

  // API route executes:
  // 1. Validation passes
  // 2. Calls mocked Stripe API → card_declined (402)
  // 3. YOUR error handling catches Stripe error
  // 4. YOUR error response logic formats user message

  await expect(page.getByText('Payment failed: card declined')).toBeVisible();
});

// All 5 tests run in parallel: ~3 seconds total
// Each test has unique test ID (no interference)
// All YOUR code executed (Server Components, API routes, validation)
// Only EXTERNAL APIs mocked (auth, Stripe, SendGrid)
```

### What Actually Happened

For each test, **your entire backend executed**:

✅ **API routes processed requests** with real HTTP flow
✅ **Middleware chains executed** (authentication, logging, etc.)
✅ **Pricing calculations ran** in your backend code
✅ **Validation logic executed** with real tier-based limits
✅ **Error handling logic ran** when Stripe returned failures
✅ **Response formatting logic executed** for success/error messages

The **only things mocked** were external services you don't control:
- Auth provider API (returns tier data)
- Stripe API (processes payments)
- SendGrid API (sends emails)

**This works identically across frameworks:** Express, Hono, Fastify, Next.js, Remix, SvelteKit—your backend code always executes.

## Framework Adapters: Same Scenarios, Any Framework

The scenario definitions above work with any framework. You just swap the adapter:

```typescript
// Express
import { createScenarist } from '@scenarist/express-adapter';
const scenarist = createScenarist({ enabled: true, scenarios });
app.use(scenarist.middleware);

// Next.js Pages Router
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
const scenarist = createScenarist({ enabled: true, scenarios });
// pages/api/__scenario__.ts
export default scenarist.createScenarioEndpoint();

// Next.js App Router
import { createScenarist } from '@scenarist/nextjs-adapter/app';
const scenarist = createScenarist({ enabled: true, scenarios });
// app/api/__scenario__/route.ts
const handler = scenarist.createScenarioEndpoint();
export const POST = handler;
export const GET = handler;

// Fastify, Hono, Remix, SvelteKit - same pattern
```

### Why This Works

Each adapter is ~100 lines that does three things:
1. Extract test ID from request headers (framework-specific)
2. Wire up scenario switching endpoint (framework-specific)
3. Delegate everything else to framework-agnostic core

The core handles:
- Scenario management
- Mock registration with MSW
- Test ID isolation
- State management
- Response selection

### The Result

✅ Write scenarios once (framework-agnostic)
✅ Run parallel tests with perfect isolation
✅ Switch scenarios instantly (no restarts)
✅ Your backend always executes
✅ Only external APIs are mocked
✅ Fast feedback loop (seconds, not minutes)
