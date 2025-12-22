# Video 3: One Server, Unlimited Scenarios - Cue Card

Condensed recording guide. See `03-one-server-unlimited-scenarios.md` for full script.

---

## Setup

- Three terminals: Next.js | Inventory Service | Playwright ready
- PayFlow with Scenarist installed and configured
- Testing Problem Table slide from Video 2 ready
- Diagrams ready: Framework Architecture, Test ID Isolation

**Interception note:** Scenarist intercepts server-side (Next.js → external services). Browser DevTools still shows browser → Next.js requests. Proof of interception = json-server terminal showing zero requests.

---

## Flow (5 min)

### 0:00 - HOOK (Pick Up From Video 2)

_Show Testing Problem Table from Video 2_

> "In the last video, we saw the Testing Problem Table. Happy path - easy. User tiers - annoying. Offer states - hard. 'Offer ends during checkout' - impossible. Let's fix that."

---

### 0:30 - THE CORE INSIGHT

_Show PayFlow with terminals_

> "Here's the key insight. We don't need these services to actually do anything. We just need them to return the responses we want."

> "Right now, to test 'offer ended' I'd have to edit db.json. To test a premium user, I need a real Auth0 account."

**Key line:** "What if we could control what these services return - without touching them at all?"

---

### 1:30 - INTRODUCE SCENARIST

_Show Framework Adapter Architecture diagram_

> "Scenarist intercepts HTTP requests before they reach the actual services."

**Point to diagram:**

> "Core is framework-agnostic. Adapters for Express and Next.js. The patterns work everywhere."

**Key line:** "Whether you're using Express today or migrating to Next.js tomorrow - only the adapter changes."

---

### 2:30 - LIVE DEMO

_Three terminals visible: Next.js | json-server | Playwright_

| Step | Action                        | Say                                                |
| ---- | ----------------------------- | -------------------------------------------------- |
| 1    | Run test - default scenario   | "Default scenario - happy path"                    |
| 2    | Run test - paymentDeclined    | "Payment declined. Didn't change Stripe."          |
| 3    | Run test - offerEnded         | "Offer ended. Didn't edit db.json."                |
| 4    | Point to json-server terminal | "Zero requests. Scenarist intercepted everything." |

**Key line:** "Three scenarios that were 'hard' or 'impossible'. Now they're just... tests."

---

### 4:00 - PARALLEL TEST ISOLATION

_Show Test ID Isolation diagram_

> "What about parallel tests? The table said that was impossible too."

> "Every request includes x-scenarist-test-id header. Test A gets premium responses. Test B gets free tier. Test C gets offer-ended. Same server. Different responses. Isolated."

**Key line:** "This is how you run 50 tests in parallel without a single conflict."

---

### 4:30 - TEASE

_Show sequence code teaser_

> "We've turned 'hard' into 'easy'. But what about 'offer ends during checkout'? That requires sequences - the same endpoint returning different responses over time."

```typescript
sequence: [
  { quantity: 15, reserved: 0 }, // First call: available
  { quantity: 0, reserved: 0 }, // Second call: offer ended
];
```

> "That's the next video."

---

## Key Phrases Cheat Sheet

1. "What if we could control what these services return - without touching them at all?"
2. "Only the adapter changes"
3. "Zero requests. Scenarist intercepted everything."
4. "Same server. Same endpoint. Different responses. Completely isolated."
5. "Three scenarios that were 'hard' or 'impossible'. Now they're just... tests."

---

## Timing Checkpoints

| Time | Section            | Visual                |
| ---- | ------------------ | --------------------- |
| 0:00 | Hook               | Testing Problem Table |
| 0:30 | Core insight       | PayFlow + terminals   |
| 1:30 | Scenarist intro    | Architecture diagram  |
| 2:30 | Live demo          | 3 terminals + tests   |
| 4:00 | Parallel isolation | Isolation diagram     |
| 4:30 | Tease              | Sequence code snippet |

---

## Pre-Recording Checklist

- [ ] PayFlow with Scenarist installed
- [ ] Scenarios defined: default, premiumUser, freeUser, offerEnded, paymentDeclined
- [ ] Playwright tests ready to run
- [ ] json-server running (to show zero requests)
- [ ] Testing Problem Table slide ready
- [ ] Framework adapter architecture diagram ready
- [ ] Test ID isolation diagram ready
