---
title: Why Scenarist?
description: The pain points Scenarist solves and how Scenarist's framework-agnostic architecture enables true full-stack testing
---

# Why Scenarist?

## The Problem: Modern Frameworks Made Testing an Afterthought

Modern frameworks like **Next.js** are incredibly powerful. Server Components let you fetch data and render on the server. API routes handle validation and business logic. Server Actions streamline mutations. But **testing these features is an afterthought**.

**Server Components can't be unit tested**—they require a full runtime environment. Jest and Vitest can't help you. You're forced into browser-based testing with tools like Playwright or Cypress.

But here's the problem: **traditional browser-based testing gives you two bad choices:**

1. **Mock everything** (Cypress, MSW-only approaches)
   - Your Server Components never render
   - Your API route validation never runs
   - Your business logic is completely bypassed
   - You're testing mock responses, not your actual application

2. **Run a real backend** (true E2E with no mocks)
   - Must restart your application for every test scenario
   - Want to test both premium and standard user flows? Restart the app twice.
   - Need to test 10 different payment scenarios? Restart 10 times.
   - External API calls make tests slow and flaky
   - Takes minutes or hours, not seconds

**What developers actually need:** Test complete user journeys in the browser while your backend (Server Components, API routes, validation logic) executes normally, with the ability to instantly switch between scenarios without external API dependencies.

## How Scenarist Solves This

Scenarist mocks **only external APIs you don't control** (Stripe, SendGrid, Auth0, etc.) while letting **your entire backend run normally**. Your Server Components render. Your API routes execute. Your validation logic runs. Your database queries happen. Everything in your codebase executes just like production.

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

## Real-World Example: Premium Checkout Flow

Let's see this with a complex feature that's nearly impossible to test with traditional approaches.

### The Feature Requirements

- User authenticates via OAuth (external auth provider API)
- Premium/Standard tier retrieved from session cookie
- Shopping cart is a **Next.js Server Component** that:
  - Fetches user tier from external session API
  - Calculates dynamic pricing (premium users get 20% discount)
  - Renders cart server-side with personalized prices
- Checkout API route validates payment:
  - Checks tier-based limits (premium: $10,000, standard: $1,000)
  - Processes payment via Stripe API (external)
  - Sends confirmation email via SendGrid API (external)
- Confirmation page displays order details (another Server Component)

### Test Coverage Needed

✅ Premium users see 20% discount (Server Component pricing logic)
✅ Standard users see full price (Server Component pricing logic)
✅ Premium checkout succeeds at $5,000 (validation allows it)
✅ Standard checkout blocked at $1,500 (validation rejects it)
✅ Failed Stripe payment shows error (error handling)
✅ Successful payment sends email (SendGrid integration)
✅ All scenarios run in parallel without interference

### With Traditional Approaches: 4 Bad Options

<details>
<summary><strong>❌ Option 1: Jest/Vitest (Can't test at all)</strong></summary>

```typescript
// Impossible - Server Components require runtime environment
test('premium user sees discount', () => {
  // Error: Can't render Server Components
  // Error: No browser environment
  // Your pricing logic NEVER runs
});
```

**Why it fails:** No browser, no server runtime, no way to test full-stack flows.

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

  // Server Component:
  // 1. Fetches session from mocked auth API → gets tier: 'premium'
  // 2. YOUR pricing logic executes: price * 0.8
  // 3. YOUR Server Component renders with calculated discount

  await expect(page.getByText('$4,000.00')).toBeVisible(); // Was $5000, 20% off
  await expect(page.getByText('Premium Member Discount')).toBeVisible();
});

test('standard user sees full price in cart', async ({ page, switchScenario }) => {
  await switchScenario(page, 'standardCheckout'); // Instant switch (same app instance!)

  await page.goto('/cart');

  // Same Server Component code path:
  // 1. Fetches session from mocked auth API → gets tier: 'standard'
  // 2. YOUR pricing logic executes: price * 1.0 (no discount)
  // 3. YOUR Server Component renders with full price

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

✅ **Server Components rendered** with real tier data from mocked auth API
✅ **Pricing calculations ran** in your Server Component code
✅ **API route validation executed** with real tier-based limits
✅ **Error handling logic ran** when Stripe returned failures
✅ **Response formatting logic executed** for success/error messages

The **only things mocked** were external services you don't control:
- Auth provider API (returns tier data)
- Stripe API (processes payments)
- SendGrid API (sends emails)

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
