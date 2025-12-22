# Video 3: One Server, Unlimited Scenarios (5 min)

## Purpose

Introduce Scenarist and show how it makes the "hard" and "impossible" scenarios from Video 2 trivially testable. This is the "solution reveal" video - we've established the problem (the testing gap, the Testing Problem Table), now we show how Scenarist solves it.

---

## Pre-Recording Setup

**PayFlow with Scenarist installed:**

1. **Next.js** - `pnpm dev` (localhost:3000)
2. **Inventory Service** - `npm run inventory` (localhost:3001) - KEEP VISIBLE to show it's NOT being called
3. **Playwright tests ready** - Have a few tests prepared to run

**Browser:** DevTools Network tab visible (optional - to show no real requests)

**Key scenarios defined:**

- `default` - Happy path
- `premiumUser` - Pro tier with 20% discount
- `freeUser` - Free tier, full price
- `offerEnded` - Promotional offer expired
- `paymentDeclined` - Stripe returns decline

---

## Script

### 0:00-0:30 - Hook (Pick Up From Video 2)

**On screen:** The Testing Problem Table from Video 2

**Say:**

> "In the last video, we saw the Testing Problem Table. Happy path - easy. Different user tiers - annoying. Offer states - hard. 'Offer ends during checkout' - impossible. Parallel tests - impossible. Let's fix that."

---

### 0:30-1:30 - The Core Insight

**Show:** PayFlow app with terminals

**Say:**

> "Here's the key insight. When we're testing, we don't need Auth0 or our Inventory Service to actually do anything. We just need them to return the responses we want for each test."

> "Right now, if I want to test 'offer ended', I'd have to edit db.json manually. If I want to test a premium user, I need a real Auth0 account. And testing 'offer ends during checkout'? I'd have to somehow change the database while the test is running."

**Key phrase:**

> "What if we could control what these services return - without touching them at all?"

---

### 1:30-2:30 - Introduce Scenarist

**Show:** Framework Adapter Architecture diagram

**Say:**

> "This is where Scenarist comes in. Scenarist intercepts HTTP requests before they reach the actual services and returns whatever you specify."

_Point to diagram:_

> "At the core, Scenarist is framework-agnostic. It doesn't care if you're using Express, Next.js, Fastify, or Hono. The core handles scenario management and response generation."

> "Adapters connect the core to your framework. Today we have adapters for Express and Next.js. The patterns you learn work everywhere."

**Key phrase:**

> "Whether you're using Express today or migrating to Next.js tomorrow, the concepts are identical. Only the adapter changes."

---

### 2:30-4:00 - Live Demo: Scenario Switching

**Actions:** Show PayFlow with Scenarist integrated

**Terminal layout:**

- Terminal 1: Next.js running
- Terminal 2: json-server running (Inventory Service)
- Browser: PayFlow app

**Say:**

> "Let me show you PayFlow with Scenarist. Same app. Same code. But now I can test any scenario from that table."

**Demo sequence:**

1. **Run first test - default scenario**

   > "Default scenario - happy path. Premium user, offer available, payment succeeds."

   _Show test passing_

2. **Run second test - paymentDeclined scenario**

   > "Now payment declined. I didn't change anything in Stripe. Scenarist just returns a 'card declined' response."

   _Show test passing, error message visible_

3. **Run third test - offerEnded scenario**

   > "Offer ended. I didn't edit db.json. Scenarist returns 'zero spots left'."

   _Show test passing_

4. **Point to json-server terminal**

   > "Look at the Inventory Service terminal. Zero requests. Scenarist intercepted everything. The real service is running, but we never hit it."

**Say:**

> "Three scenarios that were 'hard' or 'impossible' on our table. Now they're just... tests."

---

### 4:00-4:30 - Parallel Test Isolation

**Show:** Test ID Isolation diagram

**Say:**

> "But what about parallel tests? The table said that was impossible too."

_Point to diagram:_

> "Every request includes a header - x-scenarist-test-id. Scenarist uses this to look up which scenario that specific test is using. Test A gets premium user responses. Test B gets free tier responses. Test C gets offer-ended responses. Same server. Same endpoint. Different responses. Completely isolated."

> "This is how you run 50 tests in parallel without a single conflict."

---

### 4:30-5:00 - Tease the Killer Scenario

**Say:**

> "We've turned 'hard' into 'easy' and made parallel testing possible. But what about that killer scenario - 'offer ends during checkout'? The one that was truly impossible?"

> "That requires a feature called sequences - where the same endpoint returns different responses over time."

_Show code teaser:_

```typescript
// Coming next: Response Sequences
sequence: [
  { quantity: 15, reserved: 0 }, // First call: available
  { quantity: 0, reserved: 0 }, // Second call: offer ended
];
```

> "That's the next video."

---

## Key Visual Moments

- [ ] Testing Problem Table (from Video 2)
- [ ] Framework adapter architecture diagram
- [ ] Live scenario switching demo (3 scenarios)
- [ ] json-server terminal showing ZERO requests
- [ ] Test ID isolation diagram
- [ ] Sequence code teaser

## Before Recording Checklist

- [ ] PayFlow with Scenarist installed and configured
- [ ] Multiple scenarios defined (default, premiumUser, freeUser, offerEnded, paymentDeclined)
- [ ] Playwright tests ready to run
- [ ] json-server running (to show it's NOT being called)
- [ ] Architecture diagram ready
- [ ] Test ID isolation diagram ready

## Code Samples to Show

**Scenario Definition (brief glimpse):**

```typescript
// scenarios.ts
export const scenarios = {
  default: {
    // Happy path
  },
  premiumUser: {
    // Pro tier, 20% discount
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

**Test with switchScenario:**

```typescript
test("payment declined shows error", async ({ page, switchScenario }) => {
  await switchScenario("paymentDeclined");
  await page.goto("/checkout");
  await page.click("text=Pay");
  await expect(page.getByText("Card declined")).toBeVisible();
});
```

## Key Phrases

- "What if we could control what these services return - without touching them at all?"
- "Whether you're using Express today or migrating to Next.js tomorrow"
- "The patterns are the same - only the adapter changes"
- "Zero requests. Scenarist intercepted everything."
- "Same server. Same endpoint. Different responses. Completely isolated."
- "Three scenarios that were 'hard' or 'impossible'. Now they're just... tests."
