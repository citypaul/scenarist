# Video 2: Meet PayFlow - A Real Payment App (5-7 min)

## Purpose

Show the complete, working app with real integrations: User Service, Inventory Service, Shipping Service, and Stripe. No mocks, no Scenarist yet. Establish the baseline so viewers understand what we're testing and why it's hard.

---

## Pre-Recording Setup

**Two terminals visible:**

1. **Next.js** - `pnpm dev` (localhost:3000)
2. **Backend Services** - `pnpm inventory` (localhost:3001) - json-server with users, inventory, and shipping

**Browser:** Fresh session

---

## Script

### 0:00-0:30 - Hook

**On screen:** Browser at localhost:3000 (PayFlow home page), terminals visible

**Say:**

> "Before we talk about testing, let me show you what we're actually going to test. This is PayFlow - a payment dashboard built with Next.js. And these aren't fake integrations."

_Point to terminals:_

> "That's my Next.js server. And that's our backend services - User Service for tiers, Inventory Service for offer availability, and Shipping Service for delivery rates. Real HTTP calls."

---

### 0:30-1:30 - App Overview

**Actions:** Slowly walk through the UI (don't click yet)

**Walk through:**

1. **Products page** - "Product catalog with promotional offer badges and pricing."
2. **Point to offer badges** - "Offer availability comes from our Inventory Service - launch pricing, founding member spots."
3. **Point to user tier** - "User tier comes from the User Service - pro users get 20% off."
4. **Hover over sidebar** - "Cart, checkout, order history."

**Say:**

> "Standard tech stack - Next.js App Router, TypeScript, Tailwind, shadcn/ui. Nothing exotic. The kind of app you'd actually build. And three backend services: User Service for tier and discounts, Inventory Service for promotional offer availability, and Shipping Service for delivery rates."

---

### 1:30-2:30 - The Real Integrations

**Actions:** Quick code tour (split screen or VS Code)

**Show API route calling User Service:**

```typescript
// Server-side - Next.js calls User Service
const user = await fetch("http://localhost:3001/users/current");
```

> "Server-side call to the User Service. Returns user tier for discount calculation."

**Show API route calling Inventory Service:**

```typescript
// Server-side - Next.js calls Inventory Service
const inventory = await fetch("http://localhost:3001/inventory/1");
```

> "Server-side call to the Inventory Service. Returns how many spots are left in each promotional offer."

**Show API route calling Shipping Service:**

```typescript
// Server-side - Next.js calls Shipping Service
const shipping = await fetch("http://localhost:3001/shipping");
```

> "Server-side call to the Shipping Service. Returns available delivery options and rates."

**Say:**

> "The key point: these are all server-side HTTP calls. Your browser talks to Next.js. Next.js talks to these backend services. Real HTTP. Real external dependencies. The question is - how do we test all this?"

---

### 2:30-4:00 - Live Demo: The Happy Path

**Actions:** Perform browsing flow

1. **Show products page**

   > "Here's our product catalog. See the promotional badges? 'Launch Pricing', 'Limited Spots'. This data comes from the Inventory Service."

   _Point to json-server terminal - show requests logged_

   > "See that? Request to our Inventory Service. Real HTTP call."

2. **Point to discount badge**

   > "And because I'm logged in as a Pro user, I see a 20% discount. That tier comes from the User Service."

3. **Add a product to cart**

   > "Add to cart."

4. **Go to Checkout**

   > "Checkout page shows my discount applied. And here are the shipping options..."

   _Point to json-server terminal_

   > "Another request - this time to the Shipping Service. Standard, Express, Overnight."

5. **Show shipping options**

   > "Real shipping rates from a real API call."

---

### 4:00-5:30 - The Testing Challenge

**Actions:** Show the Testing Problem Table (slide or screen share)

**Show the table:**

| Scenario                    | User Service | Inventory        | Shipping    | Without Scenarist |
| --------------------------- | ------------ | ---------------- | ----------- | ----------------- |
| Happy path                  | Pro user     | Offer available  | All options | Easy              |
| Premium discount            | Pro user     | Offer available  | Any         | Annoying          |
| Free user pricing           | Free user    | Offer available  | Any         | Annoying          |
| Express unavailable         | Any          | Offer available  | No express  | Hard              |
| Offer ended                 | Any          | 0 spots left     | N/A         | Hard              |
| Limited offer urgency       | Any          | 3 spots left     | N/A         | Hard              |
| Shipping service down       | Any          | Offer available  | 500 error   | Hard              |
| **Offer ends mid-checkout** | Any          | Available → Gone | Any         | **Impossible**    |
| 50 parallel tests           | Various      | Various          | Various     | **Impossible**    |

**Say:**

> "Here's what I need to test. Happy path is easy - just run the app. Premium discount? I need to set up a pro user in my database. Free user? Different user. Already getting annoying."

> "But look at the hard ones. Offer ended? I'd have to edit db.json and restart json-server. Express shipping unavailable? Edit again. Shipping service down? Kill the server mid-test?"

> "And here's the killer: 'offer ends during checkout'. User loads the page, spots available. User goes to pay. Meanwhile someone else takes the last spot. What happens?"

> "How do I test that? Edit the database file _while_ the test is running? Time it perfectly? That's not testing, that's praying."

> "And running 50 tests in parallel? They'd all hit the same json-server, same database. Test A wants pro user, Test B wants free user. They'd conflict constantly."

---

### 5:30-6:00 - Tease

**Say:**

> "This is exactly the problem Scenarist solves. Same app. Same code. But we control what the User Service, Inventory Service, and Shipping Service return. Any scenario. Instantly. No restarts. No editing files. No conflicts."

> "And here's the thing - json-server is still running. But Scenarist will intercept the requests before they ever reach it. The real services are right there, but we're in complete control."

> "In the next video, I'll show you how."

---

## Key Visual Moments

- [ ] Two terminals visible (Next.js, json-server)
- [ ] json-server terminal showing requests (with logging)
- [ ] User tier badge showing "Pro"
- [ ] Offer badges on products (launch pricing, founding spots)
- [ ] Shipping options on checkout page
- [ ] The Testing Problem Table

## Before Recording Checklist

- [ ] json-server running with logging middleware (`pnpm inventory`)
- [ ] db.json has pro user, inventory, and shipping data
- [ ] Browser showing pro user tier
- [ ] Clean order history
- [ ] Testing Problem Table ready as slide/image
