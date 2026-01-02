# Campaign Progress

Last updated: 2026-01-02

## Current Status: Stage 4 - Videos 3 & 4 Complete

**Stage 1 (Foundation) is COMPLETE and merged to main (PR #398).**
**Stage 2 (Working Flows) is COMPLETE and merged to main (PR #399).**
**Stage 2.5 (Backend Services) is COMPLETE and merged to main (PR #400).**
**Stage 3 (Narrative Simplification) is COMPLETE - PR #421 merged.**
**Stage 4 (Scenarist Integration) is COMPLETE** - Videos 3 & 4 implementation done.

**Video 1 materials are complete** - script, cue card, visual aids, PowerPoint presentation, and blog post.
**Video 2 materials are complete** - script, cue card, visual aids, PowerPoint presentation, and blog post.
**Video 3 materials are complete** - script, cue card, blog post, PowerPoint presentation, scenario mapping, and working tests.
**Video 4 materials are complete** - script, cue card, blog post, PowerPoint presentation, and sequence test.

**Next milestone:** Record Videos 1-4. Cleanup PR for remaining scenarios is optional.

---

## Quick Context for New Sessions

### What's Done (Stage 1 + Stage 2 + Stage 2.5 + Stage 3)

- ✅ PayFlow demo app at `demo/payflow/`
- ✅ Next.js 16 App Router with shadcn/ui (Maia style)
- ✅ **Developer Merchandise Store** narrative (not subscriptions)
- ✅ Four backend services (all server-side HTTP calls):
  - **User Service** (`/users/current`) - Membership tier (pro/free) for pricing
  - **Inventory Service** (`/inventory`) - Stock levels for products
  - **Shipping Service** (`/shipping`) - Delivery options and rates
  - **Payment Service** (`/payments`) - Transaction processing
- ✅ All services simulated with json-server on port 3001
- ✅ Request logging middleware to show terminal activity
- ✅ User tier display and tier-based pricing (20% for Pro members)
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
- ✅ `01-payflow-architecture.md` - App architecture diagram (4 services)
- ✅ `02-user-flow.md` - Happy path user journey
- ✅ `03-testing-problem-table.md` - **Key visual**: What's hard without Scenarist
- ✅ `04-scenarist-interception.md` - How interception works
- ✅ `05-parallel-isolation.md` - Test ID isolation
- ✅ `06-sequence-sold-out.md` - "Sells out during checkout" sequence
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

| Scenario                      | User Service | Inventory       | Shipping    | Payment  | Without Scenarist |
| ----------------------------- | ------------ | --------------- | ----------- | -------- | ----------------- |
| Happy path                    | Pro member   | In stock        | All options | Success  | ✅ Easy           |
| Pro member discount           | Pro member   | In stock        | Any         | Success  | 🟡 Edit db.json   |
| Free user pricing             | Free user    | In stock        | Any         | Success  | 🟡 Edit db.json   |
| Sold out                      | Any          | 0 units left    | N/A         | N/A      | 🔴 Edit + restart |
| Express unavailable           | Any          | In stock        | No express  | N/A      | 🔴 Edit db.json   |
| Shipping service down         | Any          | In stock        | 500 error   | N/A      | 🔴 Kill server?   |
| Payment declined              | Any          | In stock        | Any         | Declined | 🔴 How?           |
| **Sells out during checkout** | Any          | In stock → Gone | Any         | N/A      | 🔴 **Impossible** |
| 50 parallel tests             | Various      | Various         | Various     | Various  | 🔴 **Impossible** |

### Key Architectural Point

**All four services are server-side HTTP calls:**

```
Browser → Next.js Server → User Service (/users/current)
                        ├→ Inventory Service (/inventory)
                        ├→ Shipping Service (/shipping)
                        └→ Payment Service (/payments)
```

The browser never talks to these services directly. Next.js makes the HTTP calls. This architecture is **100% mockable with Scenarist**.

**Proving interception:** The json-server terminal shows requests. When Scenarist is intercepting, the terminal shows **zero requests**.

### Key Technical Details

**Four Backend Services (all on json-server port 3001):**

| Service           | Endpoint         | Purpose                            |
| ----------------- | ---------------- | ---------------------------------- |
| User Service      | `/users/current` | Returns membership tier (pro/free) |
| Inventory Service | `/inventory`     | Returns stock levels               |
| Shipping Service  | `/shipping`      | Returns shipping options & rates   |
| Payment Service   | `/payments`      | Processes transactions             |

**db.json structure:**

```json
{
  "users": [
    {
      "id": "current",
      "email": "demo@payflow.com",
      "name": "Demo User",
      "tier": "pro"
    }
  ],
  "inventory": [
    { "id": "1", "productId": "1", "quantity": 50, "reserved": 0 },
    { "id": "2", "productId": "2", "quantity": 15, "reserved": 0 },
    { "id": "3", "productId": "3", "quantity": 3, "reserved": 0 }
  ],
  "shipping": [
    {
      "id": "standard",
      "name": "Standard Shipping",
      "price": 5.99,
      "estimatedDays": "5-7 business days"
    },
    {
      "id": "express",
      "name": "Express Shipping",
      "price": 14.99,
      "estimatedDays": "2-3 business days"
    },
    {
      "id": "overnight",
      "name": "Overnight Shipping",
      "price": 29.99,
      "estimatedDays": "Next business day"
    }
  ],
  "payments": []
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

### PR Strategy (Video-Aligned)

**Important:** We use squash merges, so each PR = 1 commit = 1 tag point. PRs are structured to align with videos.

| Video/Stage | PR   | Status      | Description                                    | Tag After Merge               |
| ----------- | ---- | ----------- | ---------------------------------------------- | ----------------------------- |
| Stage 1     | #398 | ✅ Merged   | Foundation - App structure                     | -                             |
| Stage 2     | #399 | ✅ Merged   | Working flows - Cart, checkout, orders         | -                             |
| Stage 2.5   | #400 | ✅ Merged   | Backend Services - User, Inventory, Shipping   | -                             |
| Stage 3     | #421 | ✅ Merged   | Narrative Simplification - Merchandise+Payment | `video-02-meet-payflow` ✅    |
| **Video 3** | #422 | ✅ Merged   | Complete Scenarist integration + 5 demo tests  | `video-03-scenario-switch` ✅ |
| **Video 4** | #423 | ⏳ PR       | Sequence test (sellsOutDuringCheckout)         | `video-04-sequences`          |
| Cleanup     | TBD  | ⏳ Optional | Remaining scenarios + documentation            | `stage-4-complete`            |

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
- [x] Products page fetches stock availability
- [x] Stock badges on products (in stock, limited, sold out)
- [x] Checkout shows shipping options from Shipping Service
- [x] Update video scripts and visual aids with three-service architecture
- [x] **REVIEW CHECKPOINT** → PR #400

### Demo App Stage 3: Narrative Simplification ✅ COMPLETE

- [x] Change from subscription plans to merchandise store
- [x] Add Payment Service (fourth backend service)
- [x] Update terminology: "spots" → "units", "offer ended" → "sold out"
- [x] Update all video scripts for four-service architecture
- [x] Update all visual aids for merchandise narrative
- [x] Update scenario-mapping.md with new scenario names
- [x] **REVIEW CHECKPOINT** → PR #421

### Demo App Stage 4: Scenarist Integration 🔄 IN PROGRESS

**Approach:** Create a complete reference implementation (`demo/payflow-with-scenarist/`) that:

1. Validates everything works before the presentation
2. Serves as a fallback if live coding fails during recording
3. Proves the published npm packages work correctly (installs from npm, not workspace)

The original `demo/payflow/` remains unchanged for Video 2 demonstrations (app without Scenarist).

**Planning materials ready:**

- [x] Video 3 script (`video-scripts/03-one-server-unlimited-scenarios.md`)
- [x] Video 3 cue card (`video-scripts/03-one-server-unlimited-scenarios-cue-card.md`)
- [x] Video 3 blog post (`blog-posts/03-one-server-unlimited-scenarios.md`)
- [x] Video 3 slides (`presentations/video-03-one-server-unlimited-scenarios.pptx`)
- [x] Scenario mapping (`planning/scenario-mapping.md`)

---

#### Video 3 PR (#422) ✅ COMPLETE

**Merged and tagged `video-03-scenario-switch`.**

**What was delivered:**

- [x] `demo/payflow-with-scenarist/` reference implementation
- [x] 9 scenarios defined in `src/scenarios.ts`
- [x] 5 Playwright tests (default, freeUser, soldOut, shippingServiceDown, paymentDeclined)
- [x] MSW server-side interception verified (zero requests to json-server)
- [x] Header propagation for test isolation

---

#### Video 4 PR (#423) 🔄 IN PROGRESS

**This PR adds the sequence test for Video 4.** After merge, tag `video-04-sequences`.

The killer demo - `sellsOutDuringCheckout`:

- First inventory call: 15 units in stock
- Second inventory call: 0 units (sold out)
- Test shows "promotional offers are no longer available" on checkout attempt

- [x] Add Playwright test for `sellsOutDuringCheckout` sequence
- [x] Verify sequence behavior works correctly (6/6 tests passing)
- [ ] **REVIEW CHECKPOINT** → Merge, then tag `video-04-sequences`

---

#### Cleanup PR (TBD) ⏳ PENDING

**Remaining scenarios and documentation.** After merge, tag `stage-4-complete`.

- [ ] Add tests for remaining scenarios:
  - `lowStock` - Shows "Only 3 left!" urgency
  - `expressUnavailable` - Only standard shipping visible
  - `paymentServiceDown` - Payment error handling
- [ ] Verify production build (tree-shaking)
- [ ] Update this PROGRESS.md with Stage 4 complete
- [ ] **REVIEW CHECKPOINT** → Merge, then tag `stage-4-complete`

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
- **Demo apps:** Both excluded from pnpm workspace (install from npm, not workspace links)
  - `demo/payflow/` - App without Scenarist (Video 2)
  - `demo/payflow-with-scenarist/` - Reference implementation with full Scenarist (Videos 3-4)
- **Visual aids:** Mermaid diagrams in `visual-aids/` - render for slides
- **Four-service architecture:** User + Inventory + Shipping + Payment Services
- **All server-side:** Browser → Next.js → Services (100% mockable)
- **Request logging:** json-server terminal shows requests (zero when Scenarist intercepts)
- **Merchandise narrative:** Developer gear, not subscriptions (Pro member buys merchandise, gets 20% discount)

### Git Tag Strategy

**Video tags** mark exact code state for each video recording. Tags are created on main after each PR is merged.

| Tag                        | Status | Demo App                      | What to Show                                 |
| -------------------------- | ------ | ----------------------------- | -------------------------------------------- |
| `video-01-testing-gap`     | ⏳     | N/A (conceptual video)        | Slides only, no live coding                  |
| `video-02-meet-payflow`    | ✅     | `demo/payflow`                | App without Scenarist, Testing Problem Table |
| `video-03-scenario-switch` | ✅     | `demo/payflow-with-scenarist` | 5 scenarios, json-server shows zero requests |
| `video-04-sequences`       | ⏳     | `demo/payflow-with-scenarist` | sellsOutDuringCheckout sequence              |

**Tagging workflow (per-PR):**

```bash
# After merging Video 3 PR (#422):
git checkout main && git pull
git tag -a video-03-scenario-switch -m "Video 3: Scenario switching demo"
git push --tags

# After merging Video 4 PR:
git checkout main && git pull
git tag -a video-04-sequences -m "Video 4: Response sequences demo"
git push --tags
```

**Before recording each video:**

```bash
# Reset to the exact code state for that video
git checkout video-02-meet-payflow  # For Video 2
git checkout video-03-scenario-switch  # For Video 3
```
