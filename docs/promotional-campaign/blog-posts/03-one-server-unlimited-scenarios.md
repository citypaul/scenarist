# One Server, Unlimited Scenarios

_Video 3 Companion Post_

In the [previous post](/blog/02-meet-payflow), we looked at PayFlow - a real payment app with backend services for users, inventory, and shipping. We saw the Testing Problem Table: some scenarios are easy, some are annoying, and some are outright impossible.

Today, I'll show you how Scenarist makes all of those scenarios trivially testable.

## The Testing Problem Table (Recap)

| Scenario                       | User Service | Inventory        | Shipping    | Without Scenarist |
| ------------------------------ | ------------ | ---------------- | ----------- | ----------------- |
| Happy path                     | Pro user     | Available        | All options | Easy              |
| Premium user discount          | Pro user     | Available        | Any         | Annoying          |
| Free user full price           | Free user    | Available        | Any         | Annoying          |
| Offer ended                    | Any          | 0 spots left     | N/A         | Hard              |
| Limited offer urgency          | Any          | 3 spots left     | N/A         | Hard              |
| Express shipping unavailable   | Any          | Available        | No express  | Hard              |
| Shipping service down          | Any          | Available        | 500 error   | Hard              |
| **Offer ends during checkout** | Any          | Available → Gone | Any         | **Impossible**    |
| 50 tests in parallel           | Various      | Various          | Various     | **Impossible**    |

The "annoying" scenarios require setting up multiple user accounts or configuring specific test data. The "hard" scenarios require manually editing database files. And the "impossible" scenarios? Those require changing state mid-test or running tests in parallel without conflicts.

## The Core Insight

Here's the key realization: **when we're testing, we don't need these services to actually do anything**. We just need them to return the responses we want for each test.

PayFlow's Next.js server talks to three backend services:

1. **User Service** - Returns user tier (pro/free) for pricing decisions
2. **Inventory Service** - Returns offer availability
3. **Shipping Service** - Returns available delivery options and rates

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
│                              └──► Shipping Service (/shipping)
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

**Test 1: Pro User Gets Discount**

```typescript
test("pro user sees 20% discount", async ({ page, switchScenario }) => {
  await switchScenario("default"); // Pro user scenario
  await page.goto("/products/1");
  await expect(page.getByText("20% off")).toBeVisible();
  await expect(page.getByText("$79.99")).toBeVisible(); // Discounted price
});
```

Passes. User Service returns `{ tier: "pro" }`, discount is applied.

**Test 2: Free User Pays Full Price**

```typescript
test("free user sees full price", async ({ page, switchScenario }) => {
  await switchScenario("freeUser");
  await page.goto("/products/1");
  await expect(page.getByText("$99.99")).toBeVisible(); // Full price
  await expect(page.getByText("20% off")).not.toBeVisible();
});
```

Passes. I didn't create a different user account. Scenarist just returns `{ tier: "free" }`.

**Test 3: Offer Ended**

```typescript
test("offer ended shows sold out", async ({ page, switchScenario }) => {
  await switchScenario("offerEnded");
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

**Now look at the backend services terminal.**

Zero requests. Scenarist intercepted everything. The real services are running, but we never hit them.

Four scenarios that were "annoying", "hard", or "impossible" on our table. Now they're just... tests.

## Parallel Test Isolation

But what about parallel tests? The table said that was impossible too.

Every test gets a unique test ID. Every request includes an `x-scenarist-test-id` header. Scenarist uses this to look up which scenario that specific test is using.

```
Test A (test-id: abc123) → proUser scenario   → 20% discount
Test B (test-id: def456) → freeUser scenario  → Full price
Test C (test-id: ghi789) → offerEnded scenario → "Sold Out"
Test D (test-id: jkl012) → shippingDown scenario → Error handling
```

Same server. Same endpoints. Different responses based on the test ID.

This is how you run 50 tests in parallel without a single conflict.

## Defining Scenarios

Scenarios are defined declaratively:

```typescript
// scenarios.ts
export const scenarios = {
  default: {
    // Pro user, offer available, all shipping options
    mocks: [
      {
        url: "http://localhost:3001/users/current",
        response: { status: 200, body: { id: "1", tier: "pro" } },
      },
      {
        url: "http://localhost:3001/inventory/1",
        response: { status: 200, body: { quantity: 15 } },
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
    ],
  },
  freeUser: {
    mocks: [
      {
        url: "http://localhost:3001/users/current",
        response: { status: 200, body: { id: "2", tier: "free" } },
      },
    ],
  },
  offerEnded: {
    mocks: [
      {
        url: "http://localhost:3001/inventory/1",
        response: { status: 200, body: { quantity: 0 } },
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
};
```

No functions. No imperative logic. Just declarative patterns describing what each scenario returns.

## What's Next: The Killer Scenario

We've turned "hard" into "easy" and made parallel testing possible. But what about that killer scenario - "offer ends during checkout"? The one that was truly impossible?

That requires a feature called **sequences** - where the same endpoint returns different responses over time.

```typescript
// Coming next: Response Sequences
{
  url: "http://localhost:3001/inventory/1",
  sequence: [
    { quantity: 15, reserved: 0 },   // First call: available
    { quantity: 0, reserved: 0 },    // Second call: sold out
  ]
}
```

The test calls the inventory endpoint twice. First call returns "15 spots left". Second call returns "0 spots left". We can finally test what happens when an offer ends during checkout.

That's the next video.

---

_This is the companion blog post for [Video 3: One Server, Unlimited Scenarios](https://github.com/citypaul/scenarist). The video demonstrates live scenario switching with PayFlow._

**Previous:** [Video 2: Meet PayFlow](/blog/02-meet-payflow) - The app and the testing challenges

**Next:** [Video 4: Response Sequences](/blog/04-response-sequences) - Testing state changes over time
