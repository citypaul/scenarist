# Video 2: Meet PayFlow - Cue Card

Print this or keep it visible while recording.

---

## SETUP

Three terminals: Next.js | Inventory Service | Stripe CLI

---

## 0:00 - HOOK

**Show:** PayFlow + terminals

**Say:** "Let me show you what we're testing. PayFlow - built with Next.js. Three services: our Inventory Service, Auth0 for auth, Stripe for payments. Real HTTP calls."

---

## 0:30 - APP OVERVIEW

**Do:** Walk through UI (Products → Cart → Checkout → Orders)

**Say:** "Next.js, TypeScript, shadcn/ui. Three external services."

---

## 1:30 - SHOW CODE

1. `src/lib/auth0.ts` → "Real Auth0 SDK"
2. `src/lib/stripe.ts` → "Real Stripe SDK"
3. Inventory fetch → "Calls our Inventory Service - internal API we don't own"

**Say:** "Real HTTP calls. Real latency. How do we test this?"

---

## 2:30 - LIVE DEMO

| Step | Action                | Say                            |
| ---- | --------------------- | ------------------------------ |
| 1    | Sign In               | "Auth0 Universal Login"        |
| 2    | Log in (Pro user)     | —                              |
| 3    | Point to tier badge   | "Pro tier from Auth0 metadata" |
| 4    | Point to stock badges | "Stock from inventory service" |
| 5    | Add to Cart           | _Point to json-server logs_    |
| 6    | Go to Cart            | "Discount applied"             |
| 7    | Checkout → Pay        | "Redirects to Stripe"          |
| 8    | `4242 4242 4242 4242` | "Test card"                    |
| 9    | Complete              | _Point to Stripe CLI webhook_  |
| 10   | Orders page           | "Webhook created this"         |

---

## 4:30 - THE PROBLEM TABLE

**Show the table slide**

**Say:**

- "Green = easy. Yellow = annoying. Red = hard or impossible."
- "Out of stock? Edit db.json, restart?"
- "**Sold out during checkout?** Edit the file WHILE the test runs? That's not testing, that's praying."
- "50 parallel tests? They'd all conflict."

---

## 6:00 - TEASE

**Say:**

- "Scenarist solves this. Same app, but we control responses."
- "json-server is still running - but Scenarist intercepts before requests reach it."
- "Next video: I'll show you how."

---

## Pre-Recording Checklist

- [ ] Three terminals visible
- [ ] Pro tier Auth0 user
- [ ] Inventory Service running (`npx json-server db.json --port 3001`)
- [ ] Stripe CLI running
- [ ] Testing Problem Table slide ready
