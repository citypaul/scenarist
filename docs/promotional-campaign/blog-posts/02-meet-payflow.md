# Meet PayFlow: A Real Payment App with Real Testing Challenges

_Video 2 Companion Post_

Before we can solve the testing problem, we need to understand what we're testing. In this post, I'll walk you through PayFlow - a real payment dashboard with real integrations - and show you exactly why testing it is harder than it looks.

## The App: PayFlow

PayFlow is a payment integration dashboard built with:

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** with shadcn/ui components
- **Three external services** that make real HTTP calls

Nothing exotic. The kind of tech stack you'd actually use in production.

## The Three External Services

Here's what makes PayFlow realistic - and challenging to test:

### 1. Auth0 - Authentication & User Tiers

```typescript
// src/lib/auth0.ts
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client();
```

When users log in, Auth0 handles authentication and returns user metadata including their subscription tier (free, basic, pro, enterprise). Premium users see different pricing.

### 2. Inventory Service - Promotional Offer Availability

```typescript
// Fetching offer availability
const response = await fetch(`${INVENTORY_SERVICE_URL}/inventory/${productId}`);
const data = await response.json();
// Returns: { id, productId, quantity, reserved }
```

This is an internal microservice we call to check promotional offer availability - "launch pricing" slots, "founding member" spots. Unlike Auth0 or Stripe, **this service has no test mode**. There's no magic API key that makes it behave differently in tests.

We simulate it locally with json-server:

```bash
npx json-server db.json --port 3001
```

### 3. Stripe - Payment Processing

```typescript
// src/lib/stripe.ts
import Stripe from "stripe";

export const getStripeServer = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
};
```

Real Stripe SDK. Real checkout sessions. Real webhooks.

## The Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PayFlow App (Real Code)                                        │
│                                                                 │
│  @auth0/nextjs-auth0 SDK ──────► HTTP calls to Auth0 API       │
│  fetch() to Inventory ─────────► HTTP calls to json-server:3001│
│  stripe SDK ─────────────────► HTTP calls to Stripe API        │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  In Development:    All calls go to real services               │
│  In Tests:          ??? (This is the problem)                   │
│  In Production:     All calls go to real services               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## The Happy Path Works Great

Running PayFlow locally with all three services is straightforward:

**Terminal 1: Next.js**

```bash
pnpm dev  # localhost:3000
```

**Terminal 2: Inventory Service**

```bash
npm run inventory  # localhost:3001
```

**Terminal 3: Stripe CLI (for webhooks)**

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The happy path flow:

1. User clicks "Sign In" - Auth0 Universal Login appears
2. User logs in with Pro tier account - tier badge appears in sidebar
3. Products show promotional offer availability from inventory service
4. Pro users see 20% discount applied
5. User adds product to cart, proceeds to checkout
6. Stripe Checkout handles payment (test card: 4242 4242 4242 4242)
7. Webhook arrives, order is created
8. User sees order in their history

**This all works.** The question is: how do we test it?

## The Testing Problem

Here's what I need to test:

| Scenario                       | Auth0     | Inventory         | Stripe                 | Without Scenarist             |
| ------------------------------ | --------- | ----------------- | ---------------------- | ----------------------------- |
| Happy path                     | Pro user  | Offer available   | Success                | Just run the app              |
| Premium user discount          | Pro user  | Offer available   | Success                | Need Pro account in Auth0     |
| Free user sees full price      | Free user | Offer available   | Success                | Need separate Auth0 account   |
| Payment declined               | Any       | Offer available   | Declined               | Stripe test card works        |
| Offer ended                    | Any       | 0 spots left      | N/A                    | Edit db.json, restart server  |
| Limited offer urgency          | Any       | 3 spots left      | N/A                    | Edit db.json manually         |
| **Offer ends during checkout** | Any       | Available -> Gone | N/A                    | **Impossible**                |
| Inventory service down         | Any       | 500 error         | N/A                    | Kill server mid-test?         |
| Auth0 returns error            | Error     | Any               | N/A                    | How?                          |
| Webhook never arrives          | Any       | Offer available   | Success but no webhook | **Impossible**                |
| 50 tests in parallel           | Various   | Various           | Various                | **Impossible** - shared state |

### What Each Color Means

**Easy (Happy path):** Just run the app. Everything works.

**Annoying (Different tiers, declined payments):** Possible, but requires manual setup. Need multiple Auth0 accounts. Need to remember specific test card numbers.

**Hard/Impossible (Everything else):** This is where it gets interesting.

## The Killer Scenario: Offer Ends During Checkout

Here's the scenario that's essentially impossible to test with real services:

1. User loads the products page
2. Promotional offer shows "15 spots left at this price"
3. User adds product to cart
4. User proceeds to checkout
5. **Meanwhile, someone else takes the last spot**
6. User clicks "Pay"
7. What happens?

This is a real edge case. It happens in production. Users will see it. But how do you test it?

With real services:

- Edit db.json while the test is running?
- Time it perfectly between page load and checkout?
- Run a script that modifies the database at exactly the right moment?

That's not testing. That's praying.

## The Parallel Testing Problem

Even if you could solve the edge cases, there's another problem: parallel testing.

With real services:

- All tests hit the same Auth0 tenant
- All tests hit the same json-server instance
- All tests hit the same Stripe account

If Test A expects the user to be logged in as Pro tier, and Test B expects the user to be logged in as Free tier, and they run at the same time... they conflict.

The typical "solution" is to run tests sequentially. But that means:

- Slower CI
- Longer feedback loops
- More expensive builds

## What We Actually Need

To test all these scenarios reliably, we need:

1. **Real browser** - Playwright, not jsdom
2. **Real server** - Our actual Next.js app executing real code
3. **Controlled external APIs** - We decide what Auth0, Inventory, and Stripe return

That third point is the key. We don't want to skip Auth0 or Stripe - our code needs to call them. But we need to control their responses.

## The Solution Preview

In the next post, I'll show you how Scenarist solves this:

```typescript
test("offer ends during checkout", async ({ page, switchScenario }) => {
  // Start with offer available
  await switchScenario("offerAvailable");
  await page.goto("/products");
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');

  // Now switch - offer is gone
  await switchScenario("offerEnded");
  await page.click('[data-testid="pay"]');

  // Verify the error handling
  await expect(page.getByText("Offer no longer available")).toBeVisible();
});
```

Same app. Same code. Same json-server running in the background. But Scenarist intercepts the requests before they reach it and returns exactly what we need for the test.

No restarts. No editing files. No timing tricks. No conflicts between parallel tests.

## Running PayFlow Yourself

Want to try PayFlow? Check out the [demo app](https://github.com/citypaul/scenarist/tree/main/demo/payflow).

You'll need:

- Node.js 18+
- A free Auth0 account (sign up at [auth0.com](https://auth0.com/signup))
- A free Stripe account (sign up at [stripe.com](https://dashboard.stripe.com/register))

The README has complete setup instructions for all three services.

## Summary

PayFlow is a realistic payment app with realistic integrations:

- Auth0 for authentication and user tiers
- An internal Inventory Service for promotional offer availability
- Stripe for payments

The happy path works great. But testing edge cases - different user tiers, service errors, the "offer ends during checkout" scenario - ranges from annoying to impossible with real services.

In the next video and post, I'll show you how Scenarist makes all of these scenarios trivial to test.

---

_This is the companion blog post for [Video 2: Meet PayFlow](https://github.com/citypaul/scenarist). The video walks through the live demo of PayFlow with all three services running._

**Next:** [Video 3: One Server, Unlimited Scenarios](/blog/03-one-server-unlimited-scenarios) - How Scenarist works
