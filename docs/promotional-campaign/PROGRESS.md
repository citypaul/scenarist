# Campaign Progress

Last updated: 2025-12-16

## Current Status: Stage 2 Complete, Preparing Stage 2.5

**Stage 1 (Foundation) is COMPLETE and merged to main (PR #398).**
**Stage 2 (Working Flows) is COMPLETE and merged to main (PR #399).**

Now preparing Stage 2.5: Adding Inventory Service (json-server) to enable the killer demo scenarios.

---

## Quick Context for New Sessions

### What's Done (Stage 1 + Stage 2)

- ✅ PayFlow demo app at `demo/payflow/`
- ✅ Next.js 16 App Router with shadcn/ui (Maia style)
- ✅ Real `@auth0/nextjs-auth0` v4 SDK integrated
- ✅ Real `stripe` + `@stripe/stripe-js` SDK integrated
- ✅ Auth0 login/logout working
- ✅ User tier display and tier-based pricing
- ✅ Functional cart with state persistence
- ✅ Stripe checkout with webhooks
- ✅ Orders page with history

### What's Next (Stage 2.5: Inventory Service)

**Branch:** `feature/payflow-stage-3`

Adding an Inventory Service - an internal microservice that our team consumes but doesn't own (simulated with json-server for the demo):

1. Represents internal microservices with NO test mode
2. Enables the killer demo: "sold out during checkout" sequence
3. Shows stock badges on products
4. Verifies stock before checkout

This is critical for demonstrating Scenarist's value - "works with ANY HTTP service, not just services with test tooling."

### Video Scripts & Visual Aids Created

**Video Scripts** (`docs/promotional-campaign/video-scripts/`):

- ✅ `02-meet-payflow.md` - Full script with json-server, 3 terminals, testing problem table
- ✅ `02-meet-payflow-cue-card.md` - Condensed recording guide

**Visual Aids** (`docs/promotional-campaign/visual-aids/`):

- ✅ `01-payflow-architecture.md` - App architecture diagram
- ✅ `02-user-flow.md` - Happy path user journey
- ✅ `03-testing-problem-table.md` - **Key visual**: What's hard without Scenarist
- ✅ `04-scenarist-interception.md` - How interception works
- ✅ `05-parallel-isolation.md` - Test ID isolation
- ✅ `06-sequence-sold-out.md` - "Sold out during checkout" sequence
- ✅ `07-speed-comparison.md` - Performance comparison
- ✅ `08-value-summary.md` - Key value propositions

### The Demo Flow

**Three services visible in terminals:**

1. Next.js (`pnpm dev`) - localhost:3000
2. json-server (Inventory) - localhost:3001
3. Stripe CLI (webhooks) - forwarding

**The Testing Problem Table (shown in Video 2):**

| Scenario                  | Auth0   | Inventory      | Stripe  | Without Scenarist     |
| ------------------------- | ------- | -------------- | ------- | --------------------- |
| Happy path                | Pro     | In stock       | Success | ✅ Easy               |
| Premium discount          | Pro     | In stock       | Success | 🟡 Need Auth0 account |
| Out of stock              | Any     | 0 left         | N/A     | 🔴 Edit db.json?      |
| **Sold out mid-checkout** | Any     | In stock → Out | N/A     | 🔴 **Impossible**     |
| 50 parallel tests         | Various | Various        | Various | 🔴 **Impossible**     |

### Key Technical Details

**Auth0 SDK v4 Pattern (Next.js 16):**

- Uses `proxy.ts` middleware pattern
- Auth endpoints: `/auth/login`, `/auth/logout`, `/auth/callback`
- Session access: `await auth0.getSession()`

**Stripe Integration:**

- Server client uses `getStripeServer()` function
- Uses ad-hoc pricing (`price_data`)
- Webhook handler at `/api/webhooks/stripe/route.ts`

**Inventory Service (NEW):**

- Internal microservice we consume but don't own
- Simulated with json-server on port 3001 for demo
- Products page fetches stock, shows badges
- Checkout verifies stock before payment
- Has NO test mode - proves "any HTTP service" value

**File Locations:**

- Auth0 client: `src/lib/auth0.ts`
- Stripe client: `src/lib/stripe.ts`
- Cart context: `src/contexts/cart-context.tsx`
- Checkout API: `src/app/api/checkout/route.ts`
- Webhook handler: `src/app/api/webhooks/stripe/route.ts`
- Orders API: `src/app/api/orders/route.ts`

### PR Strategy

| Stage | PR   | Status      | Description                              |
| ----- | ---- | ----------- | ---------------------------------------- |
| 1     | #398 | ✅ Merged   | Foundation - SDK setup, app structure    |
| 2     | #399 | ✅ Merged   | Working flows - Login, checkout, orders  |
| 2.5   | TBD  | 🔄 Planning | Inventory Service - json-server, stock   |
| 3     | TBD  | ⏳ Pending  | Scenarist integration - Scenarios, tests |

---

## Implementation Order

### Demo App Stage 1: Foundation ✅ COMPLETE

- [x] Build PayFlow basic structure
- [x] Add Auth0 SDK integration
- [x] Add Stripe SDK integration
- [x] README with setup instructions
- [x] **REVIEW CHECKPOINT** → PR #398 merged

### Demo App Stage 2: Working Flows ✅ COMPLETE

- [x] Auth0 login/logout working
- [x] User tier displayed in sidebar
- [x] Tier-based pricing discounts applied
- [x] Functional cart
- [x] Stripe checkout flow
- [x] Stripe webhook handling
- [x] Orders page with history
- [x] **REVIEW CHECKPOINT** → PR #399 merged

### Demo App Stage 2.5: Inventory Service 🔄 IN PROGRESS

- [ ] Add json-server as dev dependency
- [ ] Create `db.json` with inventory data
- [ ] Add npm script for inventory server
- [ ] Products page fetches stock levels
- [ ] Stock badges on products ("In Stock", "Low Stock: 3 left", "Out of Stock")
- [ ] Checkout verifies stock before Stripe
- [ ] Handle out-of-stock gracefully
- [ ] Update README with json-server instructions
- [ ] **REVIEW CHECKPOINT** → PR for Stage 2.5

### Demo App Stage 3: Scenarist Integration ⏳ PENDING

- [ ] Install `@scenarist/nextjs-adapter` and `@scenarist/playwright-helpers`
- [ ] Define scenarios:
  - `default` - Happy path, in stock
  - `premiumUser` / `freeUser` - Tier-based pricing
  - `outOfStock` / `lowStock` - Stock scenarios
  - `soldOutDuringCheckout` - **Key demo**: sequence scenario
  - `paymentDeclined` - Payment errors
  - `inventoryServiceDown` - Error handling
- [ ] Create Playwright test suite
- [ ] Show json-server NOT being hit (interception proof)
- [ ] Verify production build (tree-shaking)
- [ ] **REVIEW CHECKPOINT** → Tag: `stage-3-complete`

### Phase 1: The Problem & The App (Videos 1-2)

- [ ] Record Video 1: The Testing Gap → Tag: `video-01-testing-gap`
- [ ] Write Video 1 companion blog post
- [x] **Video 2 script created** (`video-scripts/02-meet-payflow.md`)
- [ ] Record Video 2: Meet PayFlow → Tag: `video-02-meet-payflow`
- [ ] Write Video 2 companion blog post

### Phase 2: Introducing Scenarist (Videos 3-4)

- [ ] Record Video 3: One Server, Unlimited Scenarios → Tag: `video-03-scenario-switching`
- [ ] Write Video 3 companion blog post
- [ ] Record Video 4: Case Study → Tag: `video-04-case-study`
- [ ] Write Video 4 companion blog post

### Phase 3-6: Remaining Videos

See PLAN.md for full video list (Videos 5-15).

### Standalone Blog Posts

- [ ] Introduction to Server-Side Integration Testing
- [ ] Getting Started with Scenarist in 10 Minutes
- [ ] Migrating from MSW to Scenarist
- [ ] Testing Next.js Server Components
- [ ] Common Pitfalls and How to Avoid Them
- [ ] Real-World Patterns (E-Commerce, Auth, Payments)

---

## Notes

- **Recording strategy:** Record all videos before releasing any
- **Demo app:** Located at `demo/payflow/` (excluded from pnpm workspace)
- **Visual aids:** Mermaid diagrams in `visual-aids/` - render for slides
- **json-server:** Represents "your internal microservices" - the key differentiator

### Git Tag Strategy

- **Stage tags** (`stage-1-foundation`, etc.): Major milestones
- **Video tags** (`video-01-testing-gap`, etc.): Exact code state for each video
- Tags are pushed to remote: `git push --tags`
