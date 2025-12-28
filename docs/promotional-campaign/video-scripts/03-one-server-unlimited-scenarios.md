# Video 3: One Server, Unlimited Scenarios (5 min)

## Purpose

Introduce Scenarist and show how it makes the "hard" and "impossible" scenarios from Video 2 trivially testable. This is the "solution reveal" video - we've established the problem, now we show how Scenarist solves it.

---

## Key Architectural Point

**Scenarist mocks server-side HTTP calls.** When your Next.js server calls an external API, Scenarist intercepts that request and returns a controlled response.

PayFlow's server calls three services:

1. **User Service** (`/users/current`) - Returns user tier (pro/free) for pricing
2. **Inventory Service** (`/inventory`) - Returns offer availability
3. **Shipping Service** (`/shipping`) - Returns available shipping options and rates

All three are server-to-service calls. All three are 100% mockable.

---

## Pre-Recording Setup

**PayFlow running:**

1. **Next.js** - `pnpm dev` (localhost:3000)
2. **Backend Services** - `pnpm inventory` (localhost:3001) - json-server with users, inventory, and shipping endpoints
3. **Playwright tests ready** - Have tests prepared to run

**Interception note:** Scenarist intercepts server-side (Next.js → backend services). Browser DevTools still shows browser → Next.js requests. Proof of interception = json-server terminal showing zero requests.

**Key scenarios defined:**

- `default` - Happy path (pro user, offer available, all shipping options)
- `freeUser` - Free tier, no discount
- `offerEnded` - Promotional offer expired (0 spots)
- `expressUnavailable` - Express shipping not available
- `shippingServiceDown` - Shipping API returns 500 error

---

## Script

### 0:00-0:30 - Hook (Pick Up From Video 2)

**On screen:** The Testing Problem Table from Video 2

**Say:**

> "In the last video, we saw the Testing Problem Table. Happy path - easy. Different user tiers - annoying. Offer states - hard. Service errors - hard. 'Offer ends during checkout' - impossible. Let's fix that."

---

### 0:30-1:30 - The Core Insight

**Show:** PayFlow architecture diagram - three backend services

**Say:**

> "Here's PayFlow's architecture. Your Next.js server talks to three backend services."

_Point to each service:_

> "The User Service returns user tier - pro users get 20% off. The Inventory Service returns offer availability - how many spots are left. The Shipping Service returns delivery options and rates."

> "These are all server-side HTTP calls. Your browser never talks to these services directly - the Next.js server does."

**Key phrase:**

> "And here's the key insight: if we can intercept those server-side calls, we can return whatever we want. Pro user? Done. Offer ended? Done. Shipping service down? Done."

---

### 1:30-2:30 - Introduce Scenarist

**Show:** Framework Adapter Architecture diagram

**Say:**

> "This is where Scenarist comes in. Scenarist intercepts HTTP requests at the server level - before they reach the actual services."

_Point to diagram:_

> "At the core, Scenarist is framework-agnostic. It doesn't care if you're using Express, Next.js, Fastify, or Hono. The core handles scenario management and response generation."

> "Adapters connect the core to your framework. Today we have adapters for Express and Next.js. The patterns you learn work everywhere."

**Key phrase:**

> "Whether you're using Express today or migrating to Next.js tomorrow, the concepts are identical. Only the adapter changes."

---

### 2:30-4:00 - Live Demo: Three Services, Three Scenarios

**Terminal layout:**

- Terminal 1: Next.js running
- Terminal 2: json-server running (backend services)
- Terminal 3: Playwright tests

**Say:**

> "Let me show you PayFlow with Scenarist. Same app. Same code. But now I can test any scenario from that table."

**Demo sequence:**

1. **Run first test - default scenario (pro user)**

   > "Default scenario - pro user. 20% discount applied, all shipping options available."

   _Show test passing, discount visible_

2. **Run second test - freeUser scenario**

   > "Free user scenario. I didn't change any database. I didn't create a different user account. Scenarist just returns 'tier: free' from the User Service."

   _Show test passing, full price visible_

3. **Run third test - offerEnded scenario**

   > "Offer ended. Zero spots left. I didn't edit db.json. Scenarist returns 'quantity: 0' from the Inventory Service."

   _Show test passing, "Sold Out" message visible_

4. **Run fourth test - shippingServiceDown scenario**

   > "Shipping service is down. 500 error. Watch how the app handles it gracefully."

   _Show test passing, error handling visible_

5. **Point to json-server terminal**

   > "Now look at the backend services terminal. Zero requests. Scenarist intercepted everything. The real services are running, but we never hit them."

**Say:**

> "Four scenarios that were 'annoying', 'hard', or 'impossible' on our table. Now they're just... tests."

---

### 4:00-4:30 - Parallel Test Isolation

**Show:** Test ID Isolation diagram

**Say:**

> "But what about parallel tests? The table said that was impossible too."

_Point to diagram:_

> "Every request includes a header - x-scenarist-test-id. Scenarist uses this to look up which scenario that specific test is using. Test A gets pro user responses. Test B gets free tier responses. Test C gets shipping errors. Same server. Same endpoints. Different responses. Completely isolated."

> "This is how you run 50 tests in parallel without a single conflict."

---

### 4:30-5:00 - Tease the Killer Scenario

**Say:**

> "We've turned 'hard' into 'easy' and made parallel testing possible. But what about that killer scenario - 'offer ends during checkout'? The one that was truly impossible?"

> "That requires a feature called sequences - where the same endpoint returns different responses over time."

_Show code teaser:_

```typescript
// Coming next: Response Sequences
{
  sequence: [
    { quantity: 15, reserved: 0 }, // First call: available
    { quantity: 0, reserved: 0 }, // Second call: sold out
  ];
}
```

> "The test calls the inventory endpoint twice. First call returns '15 spots left'. Second call returns '0 spots left'. We can finally test what happens when an offer ends during checkout."

> "That's the next video."

---

## Key Visual Moments

- [ ] Testing Problem Table (from Video 2)
- [ ] PayFlow architecture diagram (three backend services)
- [ ] Framework adapter architecture diagram
- [ ] Live scenario switching demo (4 scenarios)
- [ ] json-server terminal showing ZERO requests
- [ ] Test ID isolation diagram
- [ ] Sequence code teaser

## Before Recording Checklist

- [ ] PayFlow with Scenarist installed and configured
- [ ] Multiple scenarios defined (default, freeUser, offerEnded, expressUnavailable, shippingServiceDown)
- [ ] Playwright tests ready to run
- [ ] json-server running with logging enabled (to show zero requests)
- [ ] Architecture diagrams ready
- [ ] Test ID isolation diagram ready

## Code Samples to Show

**Scenario Definition (brief glimpse):**

```typescript
// scenarios.ts
export const scenarios = {
  default: {
    // Pro user, offer available, all shipping options
    mocks: [
      { url: "/users/current", response: { tier: "pro" } },
      {
        url: "/inventory",
        response: [{ quantity: 50 }, { quantity: 15 }, { quantity: 3 }],
      },
      { url: "/shipping", response: [...allOptions] },
    ],
  },
  freeUser: {
    mocks: [
      { url: "/users/current", response: { tier: "free" } },
      // ... inventory and shipping unchanged
    ],
  },
  offerEnded: {
    mocks: [
      {
        url: "/inventory",
        response: [{ quantity: 0 }, { quantity: 0 }, { quantity: 0 }],
      },
    ],
  },
  shippingServiceDown: {
    mocks: [
      {
        url: "/shipping",
        response: { status: 500, body: { error: "Service unavailable" } },
      },
    ],
  },
};
```

**Test with switchScenario:**

```typescript
test("free user sees full price", async ({ page, switchScenario }) => {
  await switchScenario("freeUser");
  await page.goto("/products/1");
  await expect(page.getByText("$99.99")).toBeVisible(); // No discount
  await expect(page.getByText("20% off")).not.toBeVisible();
});

test("handles shipping service errors gracefully", async ({
  page,
  switchScenario,
}) => {
  await switchScenario("shippingServiceDown");
  await page.goto("/checkout");
  await expect(page.getByText("Unable to load shipping options")).toBeVisible();
});
```

## Key Phrases

- "These are all server-side HTTP calls. Your browser never talks to these services directly."
- "If we can intercept those server-side calls, we can return whatever we want."
- "Whether you're using Express today or migrating to Next.js tomorrow"
- "The patterns are the same - only the adapter changes"
- "Zero requests. Scenarist intercepted everything."
- "Same server. Same endpoints. Different responses. Completely isolated."
- "Four scenarios that were 'hard' or 'impossible'. Now they're just... tests."
