# Video 1: The Testing Gap Nobody Talks About (5 min)

## Purpose

Establish the core problem that Scenarist solves. This is a conceptual video - no live coding, no demo app yet. Pure pain-first storytelling that resonates with anyone who's tried to test server-side code that calls external APIs.

**Key message:** You can test your server. You can test your frontend. But can you prove they work _together_?

---

## Pre-Recording Setup

**Visual assets needed:**

- Slide/diagram: "The Real Testing Gap" (see `visual-aids/00-the-real-testing-gap.md`)
- Slide/diagram: "Testing Pyramid with Gap" (see `visual-aids/00-testing-pyramid-gap.md`)
- Code snippets (shown as slides, not live coding)

**No terminals needed** - this is a conceptual video.

---

## Script

### 0:00-0:30 - Hook

**On screen:** You, face to camera (or face + simple background)

**Say:**

> "Your server tests pass. Your frontend tests pass. Your CI is green. You ship to production. And then users report a bug."

_Brief pause_

> "How? You tested everything. What went wrong?"

_Lean in slightly_

> "Here's the uncomfortable truth: you tested both sides _separately_. You never proved they work _together_."

---

### 0:30-1:15 - The Isolated Server Test Lie

**On screen:** Show code snippet (as slide)

```typescript
// server.test.ts
it("returns premium pricing for pro users", async () => {
  vi.mock("./session", () => ({
    getSession: () => ({ userId: "123", tier: "pro" }),
  }));

  const response = await request(app).get("/api/pricing");

  expect(response.body.discount).toBe(20);
  // ✅ Test passes!
});
```

**Say:**

> "Here's a typical server test. We mock the session, call the endpoint, check the response. Test passes. Green checkmark. Confidence achieved, right?"

_Pause_

> "But what did we actually prove? We proved that _if_ a pro user's session exists, _and_ our code reads it correctly, _then_ we return the discount."

> "What we did NOT prove: that a real user, logging in through a real browser, actually sees that discount on their screen."

---

### 1:15-2:00 - The Isolated Frontend Test Lie

**On screen:** Show code snippet (as slide)

```typescript
// pricing.test.tsx
it('displays discount for premium users', () => {
  render(<PricingPage pricing={{ discount: 20 }} />);

  expect(screen.getByText('20% off')).toBeInTheDocument();
  // ✅ Test passes!
});
```

**Say:**

> "Same story on the frontend. We render the component with mock data. It displays correctly. Test passes."

> "But we hardcoded that discount. We _assumed_ the server returns it. What if our assumption is wrong? What if there's a bug in how the session is stored after login? What if the frontend calls the wrong endpoint?"

> "The component test can't catch that. It's testing our _assumption_, not _reality_."

---

### 2:00-2:30 - The Gap

**On screen:** Show "The Real Testing Gap" diagram

**Say:**

> "This is the gap nobody talks about."

_Point to diagram_

> "On one side: isolated server tests. Supertest, Jest, Vitest. They prove your API returns the right JSON. But there's no browser. No real UI."

> "On the other side: isolated frontend tests. React Testing Library, jsdom. They prove your components render. But there's no server. No real data."

> "In the middle? The gap. Where you need a real browser, talking to a real server, with controlled external API responses."

> "That's where the bugs hide."

---

### 2:30-3:15 - Why It's Hard

**On screen:** Show flow diagram or bullet points

```
Login → Session created → Cookie set → Cart loaded → Checkout initiated → Payment processed
```

**Say:**

> "Why is this gap so hard to fill? Because server-side state builds up over multiple requests."

> "Think about a checkout flow. The user logs in - that creates a session. They browse products - the session tracks their tier for pricing. They add items to cart - state accumulates. They checkout - payment depends on everything before it."

> "Each step depends on the previous one. Order matters. State matters."

> "Now imagine testing 'payment declined for premium user.' You need:"

_Count on fingers or show bullet points_

> "One: A real browser making real requests. Two: A real server executing your actual code. Three: Auth0 returning a premium user. Four: Stripe returning a declined payment."

> "How do you control what Auth0 returns? How do you control what Stripe returns? You can't just _ask_ Stripe to decline the card for your test."

---

### 3:15-4:00 - What You Actually Need

**On screen:** Show "Testing Pyramid with Gap" diagram, then transition to solution summary

**Say:**

> "The testing pyramid has a gap. Unit tests at the bottom - fast, isolated, but shallow. E2E tests at the top - realistic, but you can't control the external APIs."

> "What you need is something in between:"

_Tick off each point_

> "A real browser - not jsdom, actual Playwright or Cypress - so you're testing what users actually see."

> "A real server - your actual Next.js or Express app - so your code actually executes."

> "Controlled external APIs - you define what Auth0 returns, what Stripe returns, what your internal services return."

> "That's the formula. Real browser. Real server. Controlled responses."

---

### 4:00-4:30 - The Solution (Tease)

**On screen:** Simple scenario switching concept

```typescript
// What if you could do this?
test("premium user sees discount", async ({ page, switchScenario }) => {
  await switchScenario("premiumUser"); // Auth0 returns pro tier
  await page.goto("/pricing");
  await expect(page.getByText("20% off")).toBeVisible();
});

test("payment declined", async ({ page, switchScenario }) => {
  await switchScenario("paymentDeclined"); // Stripe returns decline
  await page.goto("/checkout");
  await page.click("Pay Now");
  await expect(page.getByText("Card declined")).toBeVisible();
});
```

**Say:**

> "What if you could define scenarios - 'premium user', 'payment declined', 'service timeout' - and switch between them instantly? No server restarts. No editing config files. No juggling test accounts."

> "What if each test could run with its own scenario, in parallel, without conflicts?"

> "That's exactly what scenario-based testing does. And that's what we're going to build."

---

### 4:30-5:00 - Tease Next Video

**On screen:** You, face to camera

**Say:**

> "In the next video, I'll show you a real app - a payment dashboard with Auth0, Stripe, and an internal inventory service. Real SDKs. Real HTTP calls. The kind of app you'd actually build."

> "And I'll show you exactly why testing it is so hard - before we fix it."

> "I'll see you there."

---

## Key Visual Moments

- [ ] Code snippet: Server test with mock (the lie)
- [ ] Code snippet: Frontend test with mock (the lie)
- [ ] Diagram: The Real Testing Gap
- [ ] Flow: Login → Session → Cart → Checkout
- [ ] Diagram: Testing Pyramid with Gap
- [ ] Code snippet: Scenario switching concept (the tease)

## Key Phrases to Hit

- "Your server tests pass. Your frontend tests pass. But can you prove they work together?"
- "You tested your assumptions, not reality"
- "That's where the bugs hide"
- "Real browser. Real server. Controlled responses."
- "No server restarts. No editing config files. No juggling test accounts."

## Tone Notes

- Empathetic, not preachy - we've all been here
- Factual, not hyperbolic - describe the real problem
- Build tension through the "lies" section, release with the solution tease
- End with anticipation, not a hard sell

## Before Recording Checklist

- [ ] "The Real Testing Gap" diagram rendered and ready
- [ ] "Testing Pyramid with Gap" diagram rendered and ready
- [ ] Code snippets formatted as slides (readable font, syntax highlighting)
- [ ] Practice the finger-counting section (3:15) for smooth delivery
- [ ] Quiet recording environment (no live coding = no typing sounds to mask)
