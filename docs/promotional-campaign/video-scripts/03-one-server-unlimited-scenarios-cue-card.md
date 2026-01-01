# Video 3: One Server, Unlimited Scenarios - Cue Card

Condensed recording guide. See `03-one-server-unlimited-scenarios.md` for full script.

---

## Setup

- Two terminals: Next.js | json-server (backend services)
- PayFlow with Scenarist installed and configured
- Testing Problem Table slide from Video 2 ready
- Diagrams ready: PayFlow Architecture, Framework Adapter, Test ID Isolation

**Key architecture point:** PayFlow's server calls four services:

1. **User Service** → membership tier (pro/free)
2. **Inventory Service** → stock levels
3. **Shipping Service** → delivery rates
4. **Payment Service** → process transactions

All server-side. All mockable.

**Interception note:** Scenarist intercepts server-side (Next.js → services). Browser DevTools still shows browser → Next.js requests. Proof = json-server terminal showing zero requests.

---

## Flow (5 min)

### 0:00 - HOOK (Pick Up From Video 2)

_Show Testing Problem Table from Video 2_

> "In the last video, we saw the Testing Problem Table. Happy path - easy. Membership tiers - annoying. Stock states - hard. Service errors - hard. Payment failures - hard. 'Sells out during checkout' - impossible. Let's fix that."

---

### 0:30 - THE CORE INSIGHT

_Show PayFlow architecture - four backend services_

> "PayFlow's server talks to four backend services. User Service for membership tier. Inventory Service for stock levels. Shipping Service for rates. Payment Service for transactions."

> "These are all server-side HTTP calls. Your browser never talks to these services directly."

**Key line:** "If we can intercept those server-side calls, we can return whatever we want."

---

### 1:30 - INTRODUCE SCENARIST

_Show Framework Adapter Architecture diagram_

> "Scenarist intercepts HTTP requests at the server level."

**Point to diagram:**

> "Core is framework-agnostic. Adapters for Express and Next.js. The patterns work everywhere."

**Key line:** "Whether you're using Express today or migrating to Next.js tomorrow - only the adapter changes."

---

### 2:30 - LIVE DEMO

_Two terminals visible: Next.js | json-server_

| Step | Scenario             | Say                                                           |
| ---- | -------------------- | ------------------------------------------------------------- |
| 1    | default (Pro member) | "Pro member - 20% discount applied"                           |
| 2    | freeUser             | "Free user - no discount. Didn't create a different account." |
| 3    | soldOut              | "Sold out. Didn't edit db.json."                              |
| 4    | shippingServiceDown  | "Shipping service down. 500 error. Graceful handling."        |
| 5    | paymentDeclined      | "Payment declined. Card rejected. Error message shown."       |
| 6    | json-server logs     | "Zero requests. Scenarist intercepted everything."            |

**Key line:** "Five scenarios that were 'hard' or 'impossible'. Now they're just... tests."

---

### 4:00 - PARALLEL TEST ISOLATION

_Show Test ID Isolation diagram_

> "What about parallel tests? The table said that was impossible too."

> "Every request includes x-scenarist-test-id header. Test A gets Pro member responses. Test B gets free tier. Test C gets shipping errors. Test D gets payment declines. Same server. Different responses. Isolated."

**Key line:** "This is how you run 50 tests in parallel without a single conflict."

---

### 4:30 - TEASE

_Show sequence code teaser_

> "We've turned 'hard' into 'easy'. But what about 'sells out during checkout'? That requires sequences - the same endpoint returning different responses over time."

```typescript
sequence: [
  { quantity: 15, reserved: 0 }, // First call: in stock
  { quantity: 0, reserved: 0 }, // Second call: sold out
];
```

> "That's the next video."

---

## Key Phrases Cheat Sheet

1. "These are all server-side HTTP calls. Your browser never talks to these services directly."
2. "If we can intercept those server-side calls, we can return whatever we want."
3. "Only the adapter changes"
4. "Zero requests. Scenarist intercepted everything."
5. "Same server. Same endpoints. Different responses. Completely isolated."
6. "Five scenarios that were 'hard' or 'impossible'. Now they're just... tests."

---

## Timing Checkpoints

| Time | Section            | Visual                    |
| ---- | ------------------ | ------------------------- |
| 0:00 | Hook               | Testing Problem Table     |
| 0:30 | Core insight       | PayFlow architecture      |
| 1:30 | Scenarist intro    | Framework adapter diagram |
| 2:30 | Live demo          | 2 terminals + 5 tests     |
| 4:00 | Parallel isolation | Test ID isolation diagram |
| 4:30 | Tease              | Sequence code snippet     |

---

## Pre-Recording Checklist

- [ ] PayFlow with Scenarist installed
- [ ] Scenarios defined: default, freeUser, soldOut, expressUnavailable, shippingServiceDown, paymentDeclined
- [ ] Playwright tests ready to run
- [ ] json-server running with logging middleware (shows zero requests)
- [ ] Testing Problem Table slide ready
- [ ] PayFlow architecture diagram ready (4 services)
- [ ] Framework adapter architecture diagram ready
- [ ] Test ID isolation diagram ready
