# Video 2: Meet PayFlow - A Real Payment App (5-7 min)

## Purpose

Show the complete, working app with real integrations: Auth0, Inventory Service (json-server), and Stripe. No mocks, no Scenarist yet. Establish the baseline so viewers understand what we're testing and why it's hard.

---

## Pre-Recording Setup

**Three terminals visible:**

1. **Next.js** - `pnpm dev` (localhost:3000)
2. **Inventory Service** - `npx json-server db.json --port 3001` (simulates internal microservice)
3. **Stripe CLI** - `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Browser:** Clear session, logged out state

**Auth0:** Have a "Pro" tier test user ready

---

## Script

### 0:00-0:30 - Hook

**On screen:** Browser at localhost:3000 (PayFlow home page), terminals visible

**Say:**

> "Before we talk about testing, let me show you what we're actually going to test. This is PayFlow - a payment dashboard built with Next.js. And these aren't fake integrations."

_Point to terminals:_

> "That's my Next.js server. That's our Inventory Service - an internal API we call to check promotional offer availability. And that's Stripe CLI forwarding webhooks. Three services. Real HTTP calls."

---

### 0:30-1:30 - App Overview

**Actions:** Slowly walk through the UI (don't click yet)

**Walk through:**

1. **Products page** - "Product catalog with promotional offer badges and pricing."
2. **Point to offer badges** - "Offer availability comes from our inventory service - launch pricing, founding member spots."
3. **Hover over sidebar** - "Cart, checkout, order history."
4. **Point to Sign In** - "Authentication via Auth0."

**Say:**

> "Standard tech stack - Next.js App Router, TypeScript, Tailwind, shadcn/ui. Nothing exotic. The kind of app you'd actually build. And three external services: Auth0 for authentication, our inventory service for promotional offer availability, and Stripe for payments."

---

### 1:30-2:30 - The Real Integrations

**Actions:** Quick code tour (split screen or VS Code)

**Show `src/lib/auth0.ts`:**

> "Real Auth0 SDK. When you log in, it hits Auth0's servers."

**Show `src/lib/stripe.ts`:**

> "Real Stripe SDK. Payments go through Stripe."

**Show inventory fetch in products page:**

> "And we call our Inventory Service to check promotional offer availability. This is an internal API - we don't own it, another team does."

**Say:**

> "The point is: these are real HTTP calls. Real latency. Real external dependencies. In production, they hit real services. The question is - how do we test all this?"

---

### 2:30-4:30 - Live Demo: The Happy Path

**Actions:** Perform complete checkout flow

1. **Click "Sign In"**

   > "Let's log in. Watch - Auth0's Universal Login."

   _Point to Auth0 popup_

   > "Real Auth0. Real authentication."

2. **Log in with Pro tier account**

   _After redirect, point to sidebar:_

   > "I'm logged in as a Pro user - see the tier badge? That comes from Auth0 user metadata."

3. **Point out offer badges and pricing**

   > "Products show promotional offer availability from our inventory service - see the 'limited spots' badge? And because I'm Pro tier, I see a 20% discount."

4. **Add a product to cart**

   > "Add to cart."

   _Point to Inventory Service terminal - show the request logged_

   > "See that? Request to our Inventory Service. Real HTTP call."

5. **Go to Cart**

   > "Cart shows the discount applied."

6. **Click "Proceed to Checkout"**

   > "Now checkout."

7. **Click "Pay"**

   > "This redirects to Stripe."

   _Stripe Checkout appears_

   > "Real Stripe. Real checkout session."

8. **Enter test card:** `4242 4242 4242 4242`

   > "Stripe's test card - four two four two."

   _Fill expiry, CVC, complete payment_

9. **Return to app**

   > "Payment complete."

   _Point to Stripe CLI terminal - show webhook received_

   > "Stripe sent a webhook - see it in the terminal."

10. **Go to Orders**

    > "And here's my order. The webhook created this record."

---

### 4:30-6:00 - The Testing Challenge

**Actions:** Show the Testing Problem Table (slide or screen share)

**Show the table:**

| Scenario                    | Auth0   | Inventory        | Stripe   | Without Scenarist     |
| --------------------------- | ------- | ---------------- | -------- | --------------------- |
| Happy path                  | Pro     | Offer available  | Success  | ✅ Easy               |
| Premium discount            | Pro     | Offer available  | Success  | 🟡 Need Auth0 account |
| Free user pricing           | Free    | Offer available  | Success  | 🟡 Another account    |
| Payment declined            | Any     | Offer available  | Declined | 🟡 Test card works    |
| Offer ended                 | Any     | 0 spots left     | N/A      | 🔴 Edit db.json?      |
| Limited offer urgency       | Any     | 3 spots left     | N/A      | 🔴 Edit manually      |
| **Offer ends mid-checkout** | Any     | Available → Gone | N/A      | 🔴 **Impossible**     |
| Service down                | Any     | 500 error        | N/A      | 🔴 Kill server?       |
| 50 parallel tests           | Various | Various          | Various  | 🔴 **Impossible**     |

**Say:**

> "Here's what I need to test. Green is easy - just run the app. Yellow is annoying - I need different Auth0 accounts, or specific test cards. But look at all the red."

> "Offer ended? I'd have to edit my database file and restart the server. Limited offer urgency? Same problem."

> "But here's the killer: 'offer ends during checkout'. User loads the page, promotional spots available. User goes to checkout. Meanwhile someone else takes the last spot. User clicks pay. What happens?"

> "How do I test that? Edit the database file _while_ the test is running? Time it perfectly? That's not testing, that's praying."

> "And running 50 tests in parallel? They'd all hit the same json-server, the same Auth0 - they'd conflict with each other."

---

### 6:00-6:30 - Tease

**Say:**

> "This is exactly the problem Scenarist solves. Same app. Same code. But we control what Auth0, our inventory service, and Stripe return. Any scenario. Instantly. No restarts. No editing files. No conflicts."

> "And here's the thing - json-server is still running. But Scenarist will intercept the requests before they ever reach it. The real services are right there, but we're in complete control."

> "In the next video, I'll show you how."

---

## Key Visual Moments

- [ ] Three terminals visible (Next.js, Inventory Service, Stripe CLI)
- [ ] Auth0 Universal Login popup
- [ ] Inventory Service terminal showing requests
- [ ] User tier badge in sidebar
- [ ] Offer badges on products (launch pricing, founding spots)
- [ ] Stripe Checkout page
- [ ] Stripe CLI showing webhook
- [ ] The Testing Problem Table

## Before Recording Checklist

- [ ] Auth0 configured with "Pro" tier test user
- [ ] Inventory Service running (`npx json-server db.json --port 3001`)
- [ ] Stripe in test mode
- [ ] Stripe CLI running for webhooks
- [ ] Clean order history
- [ ] Browser cleared of previous sessions
- [ ] Testing Problem Table ready as slide/image
