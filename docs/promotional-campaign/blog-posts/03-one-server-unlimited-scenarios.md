# One Server, Unlimited Scenarios

_Video 3 Companion Post_

In the [previous post](/blog/02-meet-payflow), we looked at PayFlow - a real payment app with Auth0, Stripe, and an Inventory Service. We saw the Testing Problem Table: some scenarios are easy, some are annoying, and some are outright impossible.

Today, I'll show you how Scenarist makes all of those scenarios trivially testable.

## The Testing Problem Table (Recap)

| Scenario                       | Auth0     | Inventory        | Stripe   | Without Scenarist |
| ------------------------------ | --------- | ---------------- | -------- | ----------------- |
| Happy path                     | Pro user  | Offer available  | Success  | Easy              |
| Premium user discount          | Pro user  | Offer available  | Success  | Annoying          |
| Free user sees full price      | Free user | Offer available  | Success  | Annoying          |
| Payment declined               | Any       | Offer available  | Declined | Annoying          |
| Offer ended                    | Any       | 0 spots left     | N/A      | Hard              |
| Limited offer urgency          | Any       | 3 spots left     | N/A      | Hard              |
| **Offer ends during checkout** | Any       | Available → Gone | N/A      | **Impossible**    |
| Inventory service down         | Any       | 500 error        | N/A      | Hard              |
| 50 tests in parallel           | Various   | Various          | Various  | **Impossible**    |

The "annoying" scenarios require setting up multiple Auth0 accounts or remembering specific test card numbers. The "hard" scenarios require manually editing database files. And the "impossible" scenarios? Those require changing state mid-test or running tests in parallel without conflicts.

## The Core Insight

Here's the key realization: **when we're testing, we don't need these services to actually do anything**. We just need them to return the responses we want for each test.

Right now, if I want to test "offer ended", I'd have to edit db.json manually. If I want to test a premium user, I need a real Auth0 account. And testing "offer ends during checkout"? I'd have to somehow change the database while the test is running.

What if we could control what these services return - without touching them at all?

## How Scenarist Works

Scenarist intercepts HTTP requests before they reach the actual services and returns whatever you specify.

```
┌─────────────────────────────────────────────────────┐
│                Your Test                            │
│                   │                                 │
│                   ▼                                 │
│     ┌───────────────────────────┐                   │
│     │   switchScenario("...")   │                   │
│     └───────────────────────────┘                   │
│                   │                                 │
│                   ▼                                 │
│     ┌───────────────────────────┐                   │
│     │   Scenarist Core          │ ◄─ Framework-    │
│     │   (Scenario Management)   │    agnostic      │
│     └───────────────────────────┘                   │
│                   │                                 │
│                   ▼                                 │
│     ┌───────────────────────────┐                   │
│     │   Framework Adapter       │ ◄─ Express,      │
│     │   (Express/Next.js/etc)   │    Next.js, etc  │
│     └───────────────────────────┘                   │
│                   │                                 │
│                   ▼                                 │
│     ┌───────────────────────────┐                   │
│     │   MSW (Interception)      │                   │
│     └───────────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

**Important:** This interception happens **server-side**. When your Next.js server makes an HTTP request to an external service (like Auth0 or your Inventory API), MSW intercepts that request before it leaves the server. The browser still makes real requests to your Next.js server - those aren't mocked. Only the server-to-external-service calls are intercepted.

At its core, Scenarist is framework-agnostic. It doesn't care if you're using Express, Next.js, Fastify, or Hono. Adapters connect your framework to the core.

Whether you're using Express today or migrating to Next.js tomorrow, the patterns are the same. Only the adapter changes.

## Scenario Switching in Action

Let me show you PayFlow with Scenarist integrated. Same app. Same code. But now I can test any scenario from that table.

**Test 1: Happy Path**

```typescript
test("happy path checkout", async ({ page, switchScenario }) => {
  await switchScenario("default");
  await page.goto("/products");
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');
  await page.click('[data-testid="pay"]');
  await expect(page.getByText("Order confirmed")).toBeVisible();
});
```

Passes. Premium user, offer available, payment succeeds.

**Test 2: Payment Declined**

```typescript
test("payment declined shows error", async ({ page, switchScenario }) => {
  await switchScenario("paymentDeclined");
  await page.goto("/checkout");
  await page.click('[data-testid="pay"]');
  await expect(page.getByText("Card declined")).toBeVisible();
});
```

Passes. I didn't change anything in Stripe. Scenarist just returns a "card declined" response.

**Test 3: Offer Ended**

```typescript
test("offer ended prevents purchase", async ({ page, switchScenario }) => {
  await switchScenario("offerEnded");
  await page.goto("/products");
  await expect(page.getByText("Offer Ended")).toBeVisible();
});
```

Passes. I didn't edit db.json. Scenarist returns "zero spots left".

**Now look at the Inventory Service terminal.**

Zero requests. Scenarist intercepted everything. The real service is running, but we never hit it.

Three scenarios that were "hard" or "impossible" on our table. Now they're just... tests.

## Parallel Test Isolation

But what about parallel tests? The table said that was impossible too.

Every test gets a unique test ID. Every request includes an `x-scenarist-test-id` header. Scenarist uses this to look up which scenario that specific test is using.

```
Test A (test-id: abc123) → premiumUser scenario → 20% discount
Test B (test-id: def456) → freeUser scenario   → Full price
Test C (test-id: ghi789) → offerEnded scenario → "Offer ended"
```

Same server. Same endpoint. Different responses based on the test ID.

This is how you run 50 tests in parallel without a single conflict.

## Defining Scenarios

Scenarios are defined declaratively:

```typescript
// scenarios.ts
export const scenarios = {
  default: {
    // Happy path - Pro user, offer available, payment succeeds
  },
  premiumUser: {
    // Pro tier with 20% discount
  },
  freeUser: {
    // Free tier, full price
  },
  offerEnded: {
    // Promotional offer expired
  },
  paymentDeclined: {
    // Stripe returns decline
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
  sequence: [
    { quantity: 15, reserved: 0 }, // First call: available
    { quantity: 0, reserved: 0 }, // Second call: offer ended
  ];
}
```

The test calls the inventory endpoint twice. First call returns "15 spots left". Second call returns "0 spots left". We can finally test what happens when an offer ends during checkout.

That's the next video.

---

_This is the companion blog post for [Video 3: One Server, Unlimited Scenarios](https://github.com/citypaul/scenarist). The video demonstrates live scenario switching with PayFlow._

**Previous:** [Video 2: Meet PayFlow](/blog/02-meet-payflow) - The app and the testing challenges

**Next:** [Video 4: Response Sequences](/blog/04-response-sequences) - Testing state changes over time
