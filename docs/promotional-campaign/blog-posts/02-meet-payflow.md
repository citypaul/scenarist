# Meet PayFlow: A Real E-Commerce App with Real Testing Challenges

_Video 2 Companion Post_

Before we can solve the testing problem, we need to understand what we're testing. In this post, I'll walk you through PayFlow - a real developer merchandise store with real integrations - and show you exactly why testing it is harder than it looks.

## The App: PayFlow

PayFlow is a developer merchandise store built with:

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** with shadcn/ui components
- **Four backend services** that make real HTTP calls

Nothing exotic. The kind of tech stack you'd actually use in production.

## The Four Backend Services

Here's what makes PayFlow realistic - and challenging to test. All four services are server-side HTTP calls - the browser never talks to them directly, only the Next.js server does.

### 1. User Service - Membership & Tiers

```typescript
// Server-side call to User Service
const response = await fetch("http://localhost:3001/users/current");
const user = await response.json();
// Returns: { id, email, name, tier }
```

The User Service returns user information including their membership tier (free, basic, pro, enterprise). Pro members get 20% off all products.

### 2. Inventory Service - Stock Levels

```typescript
// Server-side call to Inventory Service
const response = await fetch(`http://localhost:3001/inventory/${productId}`);
const data = await response.json();
// Returns: { id, productId, quantity, reserved }
```

This service tracks stock levels - how many units are left. Limited edition items may have low stock. It has **no test mode**. There's no magic API key that makes it behave differently in tests.

### 3. Shipping Service - Delivery Options & Rates

```typescript
// Server-side call to Shipping Service
const response = await fetch("http://localhost:3001/shipping");
const options = await response.json();
// Returns: [{ id, name, price, estimatedDays }, ...]
```

The Shipping Service returns available delivery options and rates - standard, express, overnight.

### 4. Payment Service - Transaction Processing

```typescript
// Server-side call to Payment Service
const response = await fetch("http://localhost:3001/payments", {
  method: "POST",
  body: JSON.stringify({ amount, currency, items }),
});
const result = await response.json();
// Returns: { id, status, amount, currency }
```

The Payment Service processes transactions - it can succeed, decline, or error.

We simulate all four services locally with json-server:

```bash
pnpm inventory  # Runs json-server on port 3001 with logging
```

## The Architecture

The key point: **all four are server-side HTTP calls**. Your browser talks to Next.js. Next.js talks to these backend services.

```
┌─────────────────────────────────────────────────────────────────┐
│  PayFlow Architecture                                            │
│                                                                  │
│  Browser ──► Next.js Server ──► User Service (/users/current)   │
│                              ├──► Inventory Service (/inventory) │
│                              ├──► Shipping Service (/shipping)   │
│                              └──► Payment Service (/payments)    │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  In Development:    All calls go to json-server:3001             │
│  In Tests:          ??? (This is the problem)                    │
│  In Production:     All calls go to real backend services        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## The Happy Path Works Great

Running PayFlow locally with all services is straightforward:

**Terminal 1: Next.js**

```bash
pnpm dev  # localhost:3000
```

**Terminal 2: Backend Services**

```bash
pnpm inventory  # localhost:3001 (json-server with logging)
```

The happy path flow:

1. Products page shows stock availability from Inventory Service
2. User tier badge shows "Pro" (from User Service)
3. Pro members see 20% discount applied
4. User adds product to cart
5. Checkout page shows shipping options from Shipping Service
6. User selects shipping and pays via Payment Service
7. Order appears in history

**This all works.** The question is: how do we test it?

## The Testing Problem

Here's what I need to test:

| Scenario                      | User Service | Inventory       | Shipping    | Payment  | Without Scenarist |
| ----------------------------- | ------------ | --------------- | ----------- | -------- | ----------------- |
| Happy path                    | Pro member   | In stock        | All options | Success  | Easy              |
| Pro member discount           | Pro member   | In stock        | Any         | Success  | Annoying          |
| Free user sees full price     | Free user    | In stock        | Any         | Success  | Annoying          |
| Sold out                      | Any          | 0 units left    | N/A         | N/A      | Hard              |
| Low stock urgency             | Any          | 3 units left    | N/A         | N/A      | Hard              |
| Express shipping unavailable  | Any          | In stock        | No express  | N/A      | Hard              |
| Shipping service down         | Any          | In stock        | 500 error   | N/A      | Hard              |
| Payment declined              | Any          | In stock        | Any         | Declined | Hard              |
| **Sells out during checkout** | Any          | In stock → Gone | Any         | N/A      | **Impossible**    |
| 50 tests in parallel          | Various      | Various         | Various     | Various  | **Impossible**    |

### What Each Difficulty Level Means

**Easy (Happy path):** Just run the app. Everything works.

**Annoying (Different tiers):** Possible, but requires manual setup. You'd have to edit db.json to change the user's tier, then remember to change it back.

**Hard (Service states):** This is where it gets interesting. Want to test what happens when an item sells out? Edit db.json, restart json-server. Want to test a shipping service error? Kill the server mid-test? Want to test a payment decline? Good luck simulating that.

**Impossible (Everything else):** This is where manual testing breaks down completely.

## The Killer Scenario: Sells Out During Checkout

Here's the scenario that's essentially impossible to test with real services:

1. User loads the products page
2. Limited edition hoodie shows "15 units left in stock"
3. User adds product to cart
4. User proceeds to checkout
5. **Meanwhile, someone else buys the last one**
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

- All tests hit the same User Service (same db.json)
- All tests hit the same Inventory Service (same db.json)
- All tests hit the same Shipping Service (same db.json)
- All tests hit the same Payment Service (same db.json)

If Test A expects a Pro member and Test B expects a free user, and they run at the same time... they conflict.

The typical "solution" is to run tests sequentially. But that means:

- Slower CI
- Longer feedback loops
- More expensive builds

## What We Actually Need

To test all these scenarios reliably, we need:

1. **Real browser** - Playwright, not jsdom
2. **Real server** - Our actual Next.js app executing real code
3. **Controlled backend services** - We decide what User Service, Inventory Service, Shipping Service, and Payment Service return

That third point is the key. We don't want to skip these services - our code needs to call them. But we need to control their responses.

## The Solution Preview

In the next post, I'll show you how Scenarist solves this:

```typescript
test("sells out during checkout", async ({ page, switchScenario }) => {
  // Start with item in stock
  await switchScenario("inStock");
  await page.goto("/products");
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');

  // Now switch - item is sold out
  await switchScenario("soldOut");
  await page.click('[data-testid="pay"]');

  // Verify the error handling
  await expect(page.getByText("Item no longer available")).toBeVisible();
});
```

Same app. Same code. Same json-server running in the background. But Scenarist intercepts the requests before they reach it and returns exactly what we need for the test.

No editing files. No timing tricks. No conflicts between parallel tests.

## Running PayFlow Yourself

Want to try PayFlow? Check out the [demo app](https://github.com/citypaul/scenarist/tree/main/demo/payflow).

You'll need:

- Node.js 18+
- pnpm

The README has complete setup instructions.

## Summary

PayFlow is a realistic e-commerce app with realistic integrations:

- User Service for membership tiers and discounts
- Inventory Service for stock levels
- Shipping Service for delivery options and rates
- Payment Service for transaction processing

All four are **server-side HTTP calls** - your browser talks to Next.js, and Next.js talks to these backend services. This architecture is 100% mockable with Scenarist.

The happy path works great. But testing edge cases - different membership tiers, service errors, payment declines, the "sells out during checkout" scenario - ranges from annoying to impossible with real services.

In the next video and post, I'll show you how Scenarist makes all of these scenarios trivial to test.

---

_This is the companion blog post for [Video 2: Meet PayFlow](https://github.com/citypaul/scenarist). The video walks through the live demo of PayFlow with all services running._

**Next:** [Video 3: One Server, Unlimited Scenarios](/blog/03-one-server-unlimited-scenarios) - How Scenarist works
