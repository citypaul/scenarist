# Campaign Progress

Last updated: 2025-12-22

## Current Status: Videos 1-3 Materials Complete, Ready for Recording

**Stage 1 (Foundation) is COMPLETE and merged to main (PR #398).**
**Stage 2 (Working Flows) is COMPLETE and merged to main (PR #399).**
**Stage 2.5 (Promotional Offers Service) is COMPLETE and merged to main (PR #400).**

**Video 1 materials are complete** - script, cue card, visual aids, PowerPoint presentation, and blog post.
**Video 2 materials are complete** - script, cue card, visual aids, PowerPoint presentation, and blog post.
**Video 3 materials are complete** - script, cue card, blog post, PowerPoint presentation, and scenario mapping.

**Next milestone:** Record Videos 1-3, then Stage 3 - Scenarist Integration (user implements code).

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

### What's Complete (Stage 2.5: Promotional Offers Service)

**Branch:** `feature/payflow-stage-2`
**PR:** #400

Added the Inventory Service as a **Promotional Offers** system - an internal microservice that our team consumes but doesn't own (simulated with json-server for the demo):

1. Represents internal microservices with NO test mode
2. Enables the killer demo: "offer ends during checkout" sequence
3. Shows **offer badges** on products (launch pricing, founding member spots)
4. Verifies offer availability before checkout

**Key terminology update:** Changed from "stock" to "promotional offers" to better fit SaaS products:

- `OfferStatus`: `"available" | "limited_offer" | "offer_ended"`
- "15 left at this price" (launch pricing)
- "3 founding spots" (founding member)
- "Offer Ended" (promotional slots exhausted)

This is critical for demonstrating Scenarist's value - "works with ANY HTTP service, not just services with test tooling."

### Video Scripts & Visual Aids Created

**Video Scripts** (`docs/promotional-campaign/video-scripts/`):

- ✅ `01-the-testing-gap.md` - Full script for Video 1 (conceptual, no live coding)
- ✅ `01-the-testing-gap-cue-card.md` - Condensed recording guide for Video 1
- ✅ `02-meet-payflow.md` - Full script with json-server, 3 terminals, testing problem table
- ✅ `02-meet-payflow-cue-card.md` - Condensed recording guide
- ✅ `03-one-server-unlimited-scenarios.md` - Full script for Video 3 (Scenarist introduction)
- ✅ `03-one-server-unlimited-scenarios-cue-card.md` - Condensed recording guide for Video 3

**Visual Aids** (`docs/promotional-campaign/visual-aids/`):

- ✅ `00-the-real-testing-gap.md` - **Key visual for Video 1**: Isolated tests vs the gap
- ✅ `00-testing-pyramid-gap.md` - Testing pyramid showing where Scenarist fits
- ✅ `01-payflow-architecture.md` - App architecture diagram
- ✅ `02-user-flow.md` - Happy path user journey
- ✅ `03-testing-problem-table.md` - **Key visual**: What's hard without Scenarist
- ✅ `04-scenarist-interception.md` - How interception works
- ✅ `05-parallel-isolation.md` - Test ID isolation
- ✅ `06-sequence-sold-out.md` - "Sold out during checkout" sequence
- ✅ `07-speed-comparison.md` - Performance comparison
- ✅ `08-value-summary.md` - Key value propositions

**Presentations** (`docs/promotional-campaign/presentations/`):

- ✅ `video-01-the-testing-gap.pptx` - PowerPoint/Keynote slides for Video 1
- ✅ `video-02-meet-payflow.pptx` - PowerPoint/Keynote slides for Video 2
- ✅ `video-03-one-server-unlimited-scenarios.pptx` - PowerPoint/Keynote slides for Video 3

**Blog Posts** (`docs/promotional-campaign/blog-posts/`):

- ✅ `02-meet-payflow.md` - Companion blog post for Video 2
- ✅ `03-one-server-unlimited-scenarios.md` - Companion blog post for Video 3

**Planning** (`docs/promotional-campaign/planning/`):

- ✅ `scenario-mapping.md` - How Testing Problem Table maps to Scenarist scenarios

### The Demo Flow

**Three services visible in terminals:**

1. Next.js (`pnpm dev`) - localhost:3000
2. json-server (Inventory) - localhost:3001
3. Stripe CLI (webhooks) - forwarding

**The Testing Problem Table (shown in Video 2):**

| Scenario                    | Auth0   | Inventory        | Stripe  | Without Scenarist     |
| --------------------------- | ------- | ---------------- | ------- | --------------------- |
| Happy path                  | Pro     | Offer available  | Success | ✅ Easy               |
| Premium discount            | Pro     | Offer available  | Success | 🟡 Need Auth0 account |
| Offer ended                 | Any     | 0 spots left     | N/A     | 🔴 Edit db.json?      |
| **Offer ends mid-checkout** | Any     | Available → Gone | N/A     | 🔴 **Impossible**     |
| 50 parallel tests           | Various | Various          | Various | 🔴 **Impossible**     |

### Key Technical Details

**Auth0 SDK v4 Pattern (Next.js 16):**

- Uses `proxy.ts` middleware pattern
- Auth endpoints: `/auth/login`, `/auth/logout`, `/auth/callback`
- Session access: `await auth0.getSession()`

**Stripe Integration:**

- Server client uses `getStripeServer()` function
- Uses ad-hoc pricing (`price_data`)
- Webhook handler at `/api/webhooks/stripe/route.ts`

**Inventory Service (Promotional Offers):**

- Internal microservice we consume but don't own
- Simulated with json-server on port 3001 for demo
- Products page fetches offer availability, shows badges:
  - Launch pricing: "15 left at this price"
  - Founding spots: "3 founding spots"
  - Offer ended: "Offer Ended"
- Checkout verifies offer availability before payment
- Has NO test mode - proves "any HTTP service" value

**File Locations:**

- Auth0 client: `src/lib/auth0.ts`
- Stripe client: `src/lib/stripe.ts`
- Inventory client: `src/lib/inventory.ts`
- Cart context: `src/contexts/cart-context.tsx`
- Checkout API: `src/app/api/checkout/route.ts`
- Inventory API: `src/app/api/inventory/route.ts`
- Webhook handler: `src/app/api/webhooks/stripe/route.ts`
- Orders API: `src/app/api/orders/route.ts`

### PR Strategy

| Stage | PR   | Status     | Description                                    |
| ----- | ---- | ---------- | ---------------------------------------------- |
| 1     | #398 | ✅ Merged  | Foundation - SDK setup, app structure          |
| 2     | #399 | ✅ Merged  | Working flows - Login, checkout, orders        |
| 2.5   | #400 | 🔄 Review  | Promotional Offers - json-server, offer badges |
| 3     | TBD  | ⏳ Pending | Scenarist integration - Scenarios, tests       |

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

### Demo App Stage 2.5: Promotional Offers Service ✅ COMPLETE

- [x] Add json-server as dev dependency
- [x] Create `db.json` with offer availability data
- [x] Add npm script for inventory server
- [x] Products page fetches offer availability
- [x] Offer badges on products (launch pricing, founding spots, offer ended)
- [x] Checkout verifies offer availability before Stripe
- [x] Handle offer-ended gracefully
- [x] Update README with json-server instructions
- [x] Update terminology from "stock" to "promotional offers"
- [x] Update video scripts and visual aids with offer framing
- [x] **REVIEW CHECKPOINT** → PR #400

### Demo App Stage 3: Scenarist Integration ⏳ PENDING (User Implements)

**Note:** Stage 3 planning materials are complete. The actual implementation (installing packages, writing scenarios, creating tests) will be done by the user following the scenario mapping document.

**Planning materials ready:**

- [x] Video 3 script (`video-scripts/03-one-server-unlimited-scenarios.md`)
- [x] Video 3 cue card (`video-scripts/03-one-server-unlimited-scenarios-cue-card.md`)
- [x] Video 3 blog post (`blog-posts/03-one-server-unlimited-scenarios.md`)
- [x] Video 3 slides (`presentations/video-03-one-server-unlimited-scenarios.pptx`)
- [x] Scenario mapping (`planning/scenario-mapping.md`)

**Implementation tasks (user to complete):**

- [ ] Install `@scenarist/nextjs-adapter` and `@scenarist/playwright-helpers`
- [ ] Define scenarios:
  - `default` - Happy path, offer available
  - `premiumUser` / `freeUser` - Tier-based pricing
  - `offerEnded` / `limitedOffer` - Promotional offer scenarios
  - `offerEndsDuringCheckout` - **Key demo**: sequence scenario
  - `paymentDeclined` - Payment errors
  - `inventoryServiceDown` - Error handling
- [ ] Create Playwright test suite
- [ ] Show json-server NOT being hit (interception proof)
- [ ] Verify production build (tree-shaking)
- [ ] **REVIEW CHECKPOINT** → Tag: `stage-3-complete`

### Phase 1: The Problem & The App (Videos 1-2)

- [x] **Video 1 script created** (`video-scripts/01-the-testing-gap.md`)
- [x] **Video 1 cue card created** (`video-scripts/01-the-testing-gap-cue-card.md`)
- [x] **Video 1 visual aids created** (`visual-aids/00-*.md`)
- [x] **Video 1 slides created** (`presentations/video-01-the-testing-gap.pptx`)
- [ ] Record Video 1: The Testing Gap → Tag: `video-01-testing-gap`
- [ ] Write Video 1 companion blog post
- [x] **Video 2 script created** (`video-scripts/02-meet-payflow.md`)
- [x] **Video 2 cue card created** (`video-scripts/02-meet-payflow-cue-card.md`)
- [x] **Video 2 slides created** (`presentations/video-02-meet-payflow.pptx`)
- [x] **Video 2 blog post created** (`blog-posts/02-meet-payflow.md`)
- [ ] Record Video 2: Meet PayFlow → Tag: `video-02-meet-payflow`

### Phase 2: Introducing Scenarist (Videos 3-4)

- [x] **Video 3 script created** (`video-scripts/03-one-server-unlimited-scenarios.md`)
- [x] **Video 3 cue card created** (`video-scripts/03-one-server-unlimited-scenarios-cue-card.md`)
- [x] **Video 3 slides created** (`presentations/video-03-one-server-unlimited-scenarios.pptx`)
- [x] **Video 3 blog post created** (`blog-posts/03-one-server-unlimited-scenarios.md`)
- [x] **Scenario mapping created** (`planning/scenario-mapping.md`)
- [ ] Record Video 3: One Server, Unlimited Scenarios → Tag: `video-03-scenario-switching`
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
- **Offer terminology:** SaaS products use "promotional offers" (launch pricing, founding spots) not "stock"

### Git Tag Strategy

- **Stage tags** (`stage-1-foundation`, etc.): Major milestones
- **Video tags** (`video-01-testing-gap`, etc.): Exact code state for each video
- Tags are pushed to remote: `git push --tags`
