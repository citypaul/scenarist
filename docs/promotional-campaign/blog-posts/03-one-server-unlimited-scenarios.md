# One Server, Unlimited Scenarios

_Video 3 Companion Post_

In the [previous post](/blog/02-meet-payflow), we looked at PayFlow - a real e-commerce app with backend services for users, inventory, shipping, and payments. We saw the Testing Problem Table: some scenarios are easy, some are annoying, and some are outright impossible.

Today, I'll show you how Scenarist makes all of those scenarios trivially testable.

## The Testing Problem Table (Recap)

| Scenario                      | User Service | Inventory       | Shipping    | Payment  | Without Scenarist |
| ----------------------------- | ------------ | --------------- | ----------- | -------- | ----------------- |
| Happy path                    | Pro member   | In stock        | All options | Success  | Easy              |
| Pro member discount           | Pro member   | In stock        | Any         | Success  | Annoying          |
| Free user full price          | Free user    | In stock        | Any         | Success  | Annoying          |
| Sold out                      | Any          | 0 units left    | N/A         | N/A      | Hard              |
| Low stock urgency             | Any          | 3 units left    | N/A         | N/A      | Hard              |
| Express shipping unavailable  | Any          | In stock        | No express  | N/A      | Hard              |
| Shipping service down         | Any          | In stock        | 500 error   | N/A      | Hard              |
| Payment declined              | Any          | In stock        | Any         | Declined | Hard              |
| **Sells out during checkout** | Any          | In stock → Gone | Any         | N/A      | **Impossible**    |
| 50 tests in parallel          | Various      | Various         | Various     | Various  | **Impossible**    |

The "annoying" scenarios require setting up multiple user accounts or configuring specific test data. The "hard" scenarios require manually editing database files or simulating payment failures. And the "impossible" scenarios? Those require changing state mid-test or running tests in parallel without conflicts.

## The Core Insight

Here's the key realization: **when we're testing, we don't need these services to actually do anything**. We just need them to return the responses we want for each test.

PayFlow's Next.js server talks to four backend services:

1. **User Service** - Returns membership tier (pro/free) for pricing decisions
2. **Inventory Service** - Returns stock levels
3. **Shipping Service** - Returns available delivery options and rates
4. **Payment Service** - Processes transactions (success/decline/error)

These are all **server-side HTTP calls**. Your browser never talks to these services directly - the Next.js server does.

What if we could intercept those server-side calls and return whatever we want?

## How Scenarist Works

Scenarist intercepts HTTP requests at the server level and returns whatever you specify.

```
┌─────────────────────────────────────────────────────────────┐
│                    PayFlow Architecture                      │
│                                                              │
│  Browser ──► Next.js Server ──► User Service (/users)       │
│                              ├──► Inventory Service (/inventory)
│                              ├──► Shipping Service (/shipping)
│                              └──► Payment Service (/payments)
│                                                              │
│  With Scenarist:                                             │
│                                                              │
│  Browser ──► Next.js Server ──► [Scenarist Intercepts]      │
│                              └──► Returns controlled response│
│                                                              │
│              The real services are never called.             │
└─────────────────────────────────────────────────────────────┘
```

**Important:** This interception happens **server-side**. When your Next.js server makes an HTTP request to a backend service, Scenarist intercepts that request before it leaves the server. The browser still makes real requests to your Next.js server - those aren't mocked. Only the server-to-service calls are intercepted.

At its core, Scenarist is framework-agnostic. It doesn't care if you're using Express, Next.js, Fastify, or Hono. Adapters connect your framework to the core.

Whether you're using Express today or migrating to Next.js tomorrow, the patterns are the same. Only the adapter changes.

## Scenario Switching in Action

Let me show you PayFlow with Scenarist integrated. Same app. Same code. But now I can test any scenario from that table.

**Test 1: Pro Member Gets Discount**

```typescript
test("pro member sees 20% discount", async ({ page, switchScenario }) => {
  await switchScenario("default"); // Pro member scenario
  await page.goto("/products/1");
  await expect(page.getByText("20% off")).toBeVisible();
  await expect(page.getByText("$63.99")).toBeVisible(); // Discounted price
});
```

Passes. User Service returns `{ tier: "pro" }`, discount is applied.

**Test 2: Free User Pays Full Price**

```typescript
test("free user sees full price", async ({ page, switchScenario }) => {
  await switchScenario("freeUser");
  await page.goto("/products/1");
  await expect(page.getByText("$79.99")).toBeVisible(); // Full price
  await expect(page.getByText("20% off")).not.toBeVisible();
});
```

Passes. I didn't create a different user account. Scenarist just returns `{ tier: "free" }`.

**Test 3: Sold Out**

```typescript
test("sold out shows out of stock", async ({ page, switchScenario }) => {
  await switchScenario("soldOut");
  await page.goto("/products/1");
  await expect(page.getByText("Sold Out")).toBeVisible();
});
```

Passes. I didn't edit db.json. Scenarist returns `{ quantity: 0 }`.

**Test 4: Shipping Service Down**

```typescript
test("handles shipping service errors gracefully", async ({
  page,
  switchScenario,
}) => {
  await switchScenario("shippingServiceDown");
  await page.goto("/checkout");
  await expect(page.getByText("Unable to load shipping options")).toBeVisible();
  await expect(page.getByText("Please try again")).toBeVisible();
});
```

Passes. Scenarist returns a 500 error. The app handles it gracefully.

**Test 5: Payment Declined**

```typescript
test("handles payment decline gracefully", async ({ page, switchScenario }) => {
  await switchScenario("paymentDeclined");
  // ... add items and go to checkout
  await page.click('[data-testid="pay"]');
  await expect(page.getByText("Your card was declined")).toBeVisible();
});
```

Passes. Payment Service returns a decline. The app shows the error message.

**Now look at the backend services terminal.**

Zero requests. Scenarist intercepted everything. The real services are running, but we never hit them.

Five scenarios that were "annoying", "hard", or "impossible" on our table. Now they're just... tests.

## Parallel Test Isolation

But what about parallel tests? The table said that was impossible too.

Every test gets a unique test ID. Every request includes an `x-scenarist-test-id` header. Scenarist uses this to look up which scenario that specific test is using.

```
Test A (test-id: abc123) → proMember scenario   → 20% discount
Test B (test-id: def456) → freeUser scenario    → Full price
Test C (test-id: ghi789) → soldOut scenario     → "Sold Out"
Test D (test-id: jkl012) → shippingDown scenario → Shipping error
Test E (test-id: mno345) → paymentDeclined scenario → Payment error
```

Same server. Same endpoints. Different responses based on the test ID.

This is how you run 50 tests in parallel without a single conflict.

## Defining Scenarios

Scenarios are defined declaratively:

```typescript
// scenarios.ts
export const scenarios = {
  default: {
    // Pro member, in stock, all shipping options, payment success
    mocks: [
      {
        url: "http://localhost:3001/users/current",
        response: { status: 200, body: { id: "current", tier: "pro" } },
      },
      {
        url: "http://localhost:3001/inventory",
        response: {
          status: 200,
          body: [
            { id: "1", productId: "1", quantity: 50, reserved: 0 },
            { id: "2", productId: "2", quantity: 15, reserved: 0 },
            { id: "3", productId: "3", quantity: 3, reserved: 0 },
          ],
        },
      },
      {
        url: "http://localhost:3001/shipping",
        response: {
          status: 200,
          body: [
            { id: "standard", price: 5.99 },
            { id: "express", price: 14.99 },
          ],
        },
      },
      {
        url: "http://localhost:3001/payments",
        method: "POST",
        response: { status: 200, body: { id: "pay_123", status: "succeeded" } },
      },
    ],
  },
  freeUser: {
    mocks: [
      {
        url: "http://localhost:3001/users/current",
        response: { status: 200, body: { id: "current", tier: "free" } },
      },
    ],
  },
  soldOut: {
    mocks: [
      {
        url: "http://localhost:3001/inventory",
        response: {
          status: 200,
          body: [
            { id: "1", productId: "1", quantity: 0, reserved: 0 },
            { id: "2", productId: "2", quantity: 0, reserved: 0 },
            { id: "3", productId: "3", quantity: 0, reserved: 0 },
          ],
        },
      },
    ],
  },
  shippingServiceDown: {
    mocks: [
      {
        url: "http://localhost:3001/shipping",
        response: { status: 500, body: { error: "Service unavailable" } },
      },
    ],
  },
  paymentDeclined: {
    mocks: [
      {
        url: "http://localhost:3001/payments",
        method: "POST",
        response: {
          status: 200,
          body: { id: "pay_456", status: "failed", error: "card_declined" },
        },
      },
    ],
  },
};
```

No functions. No imperative logic. Just declarative patterns describing what each scenario returns.

## What's Next: The Killer Scenario

We've turned "hard" into "easy" and made parallel testing possible. But what about that killer scenario - "sells out during checkout"? The one that was truly impossible?

That requires a feature called **sequences** - where the same endpoint returns different responses over time.

```typescript
// Coming next: Response Sequences
{
  url: "http://localhost:3001/inventory",
  sequence: {
    responses: [
      // First call: in stock
      { status: 200, body: [
        { id: "1", productId: "1", quantity: 15, reserved: 0 },
        { id: "2", productId: "2", quantity: 15, reserved: 0 },
        { id: "3", productId: "3", quantity: 15, reserved: 0 },
      ]},
      // Second call: sold out
      { status: 200, body: [
        { id: "1", productId: "1", quantity: 0, reserved: 0 },
        { id: "2", productId: "2", quantity: 0, reserved: 0 },
        { id: "3", productId: "3", quantity: 0, reserved: 0 },
      ]},
    ],
    repeat: "last",
  }
}
```

The test calls the inventory endpoint twice. First call returns products in stock. Second call returns all sold out. We can finally test what happens when an item sells out during checkout.

That's the next video.

---

_This is the companion blog post for [Video 3: One Server, Unlimited Scenarios](https://github.com/citypaul/scenarist). The video demonstrates live scenario switching with PayFlow._

**Previous:** [Video 2: Meet PayFlow](/blog/02-meet-payflow) - The app and the testing challenges

**Next:** [Video 4: Response Sequences](/blog/04-response-sequences) - Testing state changes over time
