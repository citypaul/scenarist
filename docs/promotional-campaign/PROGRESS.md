# Campaign Progress

Last updated: 2025-12-28

## Current Status: Videos 1-3 Materials Complete, Ready for Recording

**Stage 1 (Foundation) is COMPLETE and merged to main (PR #398).**
**Stage 2 (Working Flows) is COMPLETE and merged to main (PR #399).**
**Stage 2.5 (Backend Services) is COMPLETE and merged to main (PR #400).**

**Video 1 materials are complete** - script, cue card, visual aids, PowerPoint presentation, and blog post.
**Video 2 materials are complete** - script, cue card, visual aids, PowerPoint presentation, and blog post.
**Video 3 materials are complete** - script, cue card, blog post, PowerPoint presentation, and scenario mapping.

**Next milestone:** Record Videos 1-3, then Stage 3 - Scenarist Integration (user implements code).

---

## Quick Context for New Sessions

### What's Done (Stage 1 + Stage 2 + Stage 2.5)

- ✅ PayFlow demo app at `demo/payflow/`
- ✅ Next.js 16 App Router with shadcn/ui (Maia style)
- ✅ Three backend services (all server-side HTTP calls):
  - **User Service** (`/users/current`) - User tier (pro/free) for pricing decisions
  - **Inventory Service** (`/inventory`) - Promotional offer availability
  - **Shipping Service** (`/shipping`) - Delivery options and rates
- ✅ All services simulated with json-server on port 3001
- ✅ Request logging middleware to show terminal activity
- ✅ User tier display and tier-based pricing (20% for Pro)
- ✅ Functional cart with state persistence
- ✅ Checkout flow with shipping options
- ✅ Orders page with history

### Video Scripts & Visual Aids Created

**Video Scripts** (`docs/promotional-campaign/video-scripts/`):

- ✅ `01-the-testing-gap.md` - Full script for Video 1 (conceptual, no live coding)
- ✅ `01-the-testing-gap-cue-card.md` - Condensed recording guide for Video 1
- ✅ `02-meet-payflow.md` - Full script with json-server, 2 terminals, testing problem table
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

**Two terminals visible:**

1. Next.js (`pnpm dev`) - localhost:3000
2. Backend Services (`pnpm inventory`) - localhost:3001 (json-server with logging)

**The Testing Problem Table (shown in Video 2):**

| Scenario                    | User Service | Inventory        | Shipping    | Without Scenarist |
| --------------------------- | ------------ | ---------------- | ----------- | ----------------- |
| Happy path                  | Pro user     | Offer available  | All options | ✅ Easy           |
| Premium discount            | Pro user     | Offer available  | Any         | 🟡 Edit db.json   |
| Free user pricing           | Free user    | Offer available  | Any         | 🟡 Edit db.json   |
| Offer ended                 | Any          | 0 spots left     | N/A         | 🔴 Edit + restart |
| Express unavailable         | Any          | Offer available  | No express  | 🔴 Edit db.json   |
| Shipping service down       | Any          | Offer available  | 500 error   | 🔴 Kill server?   |
| **Offer ends mid-checkout** | Any          | Available → Gone | Any         | 🔴 **Impossible** |
| 50 parallel tests           | Various      | Various          | Various     | 🔴 **Impossible** |

### Key Architectural Point

**All three services are server-side HTTP calls:**

```
Browser → Next.js Server → User Service (/users/current)
                        ├→ Inventory Service (/inventory)
                        └→ Shipping Service (/shipping)
```

The browser never talks to these services directly. Next.js makes the HTTP calls. This architecture is **100% mockable with Scenarist**.

**Proving interception:** The json-server terminal shows requests. When Scenarist is intercepting, the terminal shows **zero requests**.

### Key Technical Details

**Three Backend Services (all on json-server port 3001):**

| Service           | Endpoint         | Purpose                          |
| ----------------- | ---------------- | -------------------------------- |
| User Service      | `/users/current` | Returns user tier (pro/free)     |
| Inventory Service | `/inventory`     | Returns offer availability       |
| Shipping Service  | `/shipping`      | Returns shipping options & rates |

**db.json structure:**

```json
{
  "users": [
    { "id": "current", "email": "demo@payflow.com", "name": "Demo User", "tier": "pro" }
  ],
  "inventory": [...],
  "shipping": [
    { "id": "standard", "name": "Standard Shipping", "price": 5.99, "estimatedDays": "5-7 business days" },
    { "id": "express", "name": "Express Shipping", "price": 14.99, "estimatedDays": "2-3 business days" },
    { "id": "overnight", "name": "Overnight Shipping", "price": 29.99, "estimatedDays": "Next business day" }
  ]
}
```

**Request Logging:**

- `json-server-logger.js` middleware logs all requests to terminal
- Enables visual proof that Scenarist intercepts (zero requests when mocking)

**File Locations:**

- db.json: `demo/payflow/db.json`
- Logger: `demo/payflow/json-server-logger.js`
- Inventory client: `src/lib/inventory.ts`
- Cart context: `src/contexts/cart-context.tsx`
- Checkout API: `src/app/api/checkout/route.ts`
- Inventory API: `src/app/api/inventory/route.ts`
- Orders API: `src/app/api/orders/route.ts`

### PR Strategy

| Stage | PR   | Status     | Description                                  |
| ----- | ---- | ---------- | -------------------------------------------- |
| 1     | #398 | ✅ Merged  | Foundation - App structure                   |
| 2     | #399 | ✅ Merged  | Working flows - Cart, checkout, orders       |
| 2.5   | #400 | ✅ Merged  | Backend Services - User, Inventory, Shipping |
| 3     | TBD  | ⏳ Pending | Scenarist integration - Scenarios, tests     |

---

## Implementation Order

### Demo App Stage 1: Foundation ✅ COMPLETE

- [x] Build PayFlow basic structure
- [x] Next.js 16 App Router with shadcn/ui
- [x] README with setup instructions
- [x] **REVIEW CHECKPOINT** → PR #398 merged

### Demo App Stage 2: Working Flows ✅ COMPLETE

- [x] User tier displayed in sidebar
- [x] Tier-based pricing discounts applied
- [x] Functional cart
- [x] Checkout flow
- [x] Orders page with history
- [x] **REVIEW CHECKPOINT** → PR #399 merged

### Demo App Stage 2.5: Backend Services ✅ COMPLETE

- [x] Add json-server as dev dependency
- [x] Create `db.json` with users, inventory, and shipping data
- [x] Add npm script for backend services server
- [x] Add request logging middleware
- [x] Products page fetches offer availability
- [x] Offer badges on products (launch pricing, founding spots, offer ended)
- [x] Checkout shows shipping options from Shipping Service
- [x] Update video scripts and visual aids with three-service architecture
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
  - `default` - Happy path: Pro user, offer available, all shipping options
  - `freeUser` - Free tier: No discount
  - `offerEnded` - Promotional offer expired (quantity: 0)
  - `limitedSpots` - Urgency messaging (quantity: 3)
  - `expressUnavailable` - No express shipping option
  - `shippingServiceDown` - Shipping API error (500)
  - `offerEndsDuringCheckout` - **Key demo**: sequence scenario
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
- **Three-service architecture:** User Service + Inventory Service + Shipping Service
- **All server-side:** Browser → Next.js → Services (100% mockable)
- **Request logging:** json-server terminal shows requests (zero when Scenarist intercepts)

### Git Tag Strategy

- **Stage tags** (`stage-1-foundation`, etc.): Major milestones
- **Video tags** (`video-01-testing-gap`, etc.): Exact code state for each video
- Tags are pushed to remote: `git push --tags`
