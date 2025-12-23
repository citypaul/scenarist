# Video 2: Meet PayFlow - Cue Card

Print this or keep it visible while recording.

---

## SETUP

Two terminals: Next.js (`pnpm dev`) | Backend Services (`pnpm inventory`)

Backend Services = json-server with users, inventory, and shipping on port 3001

---

## 0:00 - HOOK

**Show:** PayFlow + two terminals

**Say:** "Let me show you what we're testing. PayFlow - built with Next.js. And these aren't fake integrations - that's Next.js, and that's our backend services: User Service, Inventory Service, Shipping Service. Real HTTP calls."

---

## 0:30 - APP OVERVIEW

**Do:** Walk through UI (Products → Cart → Checkout → Orders)

**Say:** "Next.js, TypeScript, shadcn/ui. Three backend services we don't control."

---

## 1:30 - SHOW CODE

1. `fetch("/users/current")` → "Server calls User Service for tier"
2. `fetch("/inventory/1")` → "Server calls Inventory Service for offer availability"
3. `fetch("/shipping")` → "Server calls Shipping Service for delivery rates"

**Key point:** "All server-side HTTP calls. Browser talks to Next.js. Next.js talks to these services."

---

## 2:30 - LIVE DEMO

| Step | Action         | Say                                           |
| ---- | -------------- | --------------------------------------------- |
| 1    | Show products  | "Offer badges - from Inventory Service"       |
| 2    | Point to tier  | "Pro tier - from User Service" (terminal log) |
| 3    | Add to Cart    | _Point to json-server logs_                   |
| 4    | Go to Checkout | "Discount applied - 20% for Pro users"        |
| 5    | Show shipping  | "Options from Shipping Service" (terminal)    |

**Key line:** "See the terminal? Real requests to our backend services."

---

## 4:00 - THE PROBLEM TABLE

**Show the table slide**

| Scenario                    | User Service | Inventory     | Shipping   | Difficulty     |
| --------------------------- | ------------ | ------------- | ---------- | -------------- |
| Happy path                  | Pro user     | Available     | All        | Easy           |
| Premium discount            | Pro user     | Available     | Any        | Annoying       |
| Free user pricing           | Free user    | Available     | Any        | Annoying       |
| Offer ended                 | Any          | 0 spots       | N/A        | Hard           |
| Express unavailable         | Any          | Available     | No express | Hard           |
| Shipping service down       | Any          | Available     | 500 error  | Hard           |
| **Offer ends mid-checkout** | Any          | Available → 0 | Any        | **Impossible** |
| 50 parallel tests           | Various      | Various       | Various    | **Impossible** |

**Say:**

- "Happy path = easy. Different tiers = annoying. Service states = hard."
- "**Offer ends during checkout?** Edit db.json WHILE the test runs? That's not testing, that's praying."
- "50 parallel tests? They'd all hit the same json-server. Conflicts everywhere."

---

## 5:30 - TEASE

**Say:**

- "Scenarist solves this. Same app, but we control what User Service, Inventory Service, and Shipping Service return."
- "json-server is still running - but Scenarist intercepts before requests ever reach it."
- "Next video: I'll show you how."

---

## Pre-Recording Checklist

- [ ] Two terminals visible (Next.js + json-server with logging)
- [ ] json-server logging middleware enabled (`pnpm inventory`)
- [ ] Pro user in db.json
- [ ] Testing Problem Table slide ready
