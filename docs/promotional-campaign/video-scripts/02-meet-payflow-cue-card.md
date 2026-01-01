# Video 2: Meet PayFlow - Cue Card

Print this or keep it visible while recording.

---

## SETUP

Two terminals: Next.js (`pnpm dev`) | Backend Services (`pnpm inventory`)

Backend Services = json-server with users, inventory, shipping, and payments on port 3001

---

## 0:00 - HOOK

**Show:** PayFlow + two terminals

**Say:** "Let me show you what we're testing. PayFlow - a developer merchandise store built with Next.js. And these aren't fake integrations - that's Next.js, and that's our backend services: User Service, Inventory Service, Shipping Service, Payment Service. Real HTTP calls."

---

## 0:30 - APP OVERVIEW

**Do:** Walk through UI (Products → Cart → Checkout → Orders)

**Say:** "Next.js, TypeScript, shadcn/ui. Four backend services we don't control."

---

## 1:30 - SHOW CODE

1. `fetch("/users/current")` → "Server calls User Service for membership tier"
2. `fetch("/inventory")` → "Server calls Inventory Service for stock levels"
3. `fetch("/shipping")` → "Server calls Shipping Service for delivery rates"
4. `fetch("/payments")` → "Server calls Payment Service to process orders"

**Key point:** "All server-side HTTP calls. Browser talks to Next.js. Next.js talks to these services."

---

## 2:30 - LIVE DEMO

| Step | Action         | Say                                             |
| ---- | -------------- | ----------------------------------------------- |
| 1    | Show products  | "Stock badges - from Inventory Service"         |
| 2    | Point to tier  | "Pro member - from User Service" (terminal log) |
| 3    | Add to Cart    | _Point to json-server logs_                     |
| 4    | Go to Checkout | "Member discount applied - 20% for Pro members" |
| 5    | Show shipping  | "Options from Shipping Service" (terminal)      |

**Key line:** "See the terminal? Real requests to our backend services."

---

## 4:00 - THE PROBLEM TABLE

**Show the table slide**

| Scenario                   | User Service | Inventory       | Shipping   | Payment  | Difficulty     |
| -------------------------- | ------------ | --------------- | ---------- | -------- | -------------- |
| Happy path                 | Pro member   | In stock        | All        | Success  | Easy           |
| Member discount            | Pro member   | In stock        | Any        | Success  | Annoying       |
| Non-member pricing         | Free user    | In stock        | Any        | Success  | Annoying       |
| Sold out                   | Any          | Out of stock    | N/A        | N/A      | Hard           |
| Express unavailable        | Any          | In stock        | No express | N/A      | Hard           |
| Shipping service down      | Any          | In stock        | 500 error  | N/A      | Hard           |
| Payment declined           | Any          | In stock        | Any        | Declined | Hard           |
| **Sells out mid-checkout** | Any          | In stock → Gone | Any        | N/A      | **Impossible** |
| 50 parallel tests          | Various      | Various         | Various    | Various  | **Impossible** |

**Say:**

- "Happy path = easy. Different tiers = annoying. Service states = hard."
- "**Sells out during checkout?** Edit db.json WHILE the test runs? That's not testing, that's praying."
- "50 parallel tests? They'd all hit the same json-server. Conflicts everywhere."

---

## 5:30 - TEASE

**Say:**

- "Scenarist solves this. Same app, but we control what all four services return."
- "json-server is still running - but Scenarist intercepts before requests ever reach it."
- "Next video: I'll show you how."

---

## Pre-Recording Checklist

- [ ] Two terminals visible (Next.js + json-server with logging)
- [ ] json-server logging middleware enabled (`pnpm inventory`)
- [ ] Pro member in db.json
- [ ] Testing Problem Table slide ready
