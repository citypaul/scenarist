# Campaign Progress

Last updated: 2025-12-16

## Current Status: Stage 2 Nearly Complete

**Stage 1 (Foundation) is COMPLETE and merged to main (PR #398).**

Stage 2 is nearly complete - all core functionality working, just SendGrid email integration remaining.

---

## Quick Context for New Sessions

### What's Done (Stage 1)

- ✅ PayFlow demo app created at `demo/payflow/`
- ✅ Next.js 16 App Router with shadcn/ui (Maia style)
- ✅ Real `@auth0/nextjs-auth0` v4 SDK integrated (proxy.ts middleware pattern)
- ✅ Real `stripe` + `@stripe/stripe-js` SDK integrated (lazy initialization)
- ✅ Checkout API route (`/api/checkout/route.ts`)
- ✅ Environment variables documented (`.env.example`, README)
- ✅ CI updated to allow sharp/lucide-react licenses

### What's Done (Stage 2)

**Branch:** `feature/payflow-stage-2`

**Completed tasks:**

1. ✅ **Auth0 Login/Logout Flow** - Working via proxy.ts middleware (routes: `/auth/login`, `/auth/logout`, `/auth/callback`)
2. ✅ **User Tier Display** - Shows tier badge in sidebar from Auth0 user metadata
3. ✅ **Tier-Based Pricing** - Discounts applied (free: 0%, basic: 10%, pro: 20%, enterprise: 30%)
4. ✅ **Functional Cart** - Cart context with add/remove/quantity controls, state persists across navigation
5. ✅ **Stripe Checkout** - Ad-hoc pricing (price_data), redirects to Stripe, handles success/cancel
6. ✅ **Stripe Webhooks** - Handler at `/api/webhooks/stripe/route.ts`, creates orders on `checkout.session.completed`
7. ✅ **Orders Page** - Fetches orders from API, displays order history with status badges

**Remaining task:**

8. ⏳ **SendGrid Emails** - Order confirmation emails (optional for demo)

### How Stage 2 Enables the Videos

Stage 2 builds the realistic app that Stage 3 will add Scenarist to. Each feature directly enables specific promotional content:

| Feature            | Enables Video                                               | Blog Post                                    |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------- |
| Full App           | **Video 2**: Meet PayFlow (full demo, no mocks)             | "Building PayFlow: A Real-World Payment App" |
| Auth0 + User Tiers | **Video 4**: Case Study (premium user bug)                  | "How Integrated Testing Catches Bugs"        |
| Tier-Based Pricing | **Video 7**: Request Matching                               | "Content-Based Routing for Test Scenarios"   |
| Functional Cart    | **Video 5**: Server-Side State, **Video 9**: Stateful Mocks | "Capture, Store, and Inject State"           |
| Stripe Checkout    | **Video 8**: Response Sequences (payment polling)           | "Testing Polling, Retries, State Machines"   |
| Webhooks + Orders  | **Video 11**: Feature Composition                           | "Building Complex Scenarios from Primitives" |

**The Key Insight:** Without a working app (login, cart, checkout, orders), there's nothing meaningful to test. Stage 2 creates the "real app" that demonstrates why Scenarist matters.

**Video Flow:**

1. Video 1: "Here's the problem everyone has" (conceptual)
2. Video 2: "Here's a real app that has this problem" (PayFlow demo)
3. Video 3+: "Here's how Scenarist solves it" (you code on camera)

### Key Technical Details

**Auth0 SDK v4 Pattern (Next.js 16):**

- Uses `proxy.ts` middleware pattern, NOT route handlers
- Auth endpoints: `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile`
- Session access: `await auth0.getSession()`

**Stripe Integration:**

- Server client uses `getStripeServer()` function to avoid build-time errors
- Client uses `getStripe()` for Stripe.js
- Uses ad-hoc pricing (`price_data`) instead of predefined Stripe price IDs
- Webhook handler verifies signatures and stores orders

**Cart State:**

- Uses React Context (`CartProvider`) for cart state management
- Navigation uses Next.js `<Link>` components to preserve client-side state
- Calculates tier-based discounts automatically

**File Locations:**

- Auth0 client: `src/lib/auth0.ts`
- Stripe client: `src/lib/stripe.ts`
- Auth context: `src/contexts/auth-context.tsx`
- Cart context: `src/contexts/cart-context.tsx`
- Checkout API: `src/app/api/checkout/route.ts`
- Webhook handler: `src/app/api/webhooks/stripe/route.ts`
- Orders API: `src/app/api/orders/route.ts`
- Orders store: `src/lib/orders.ts`
- Middleware: `src/proxy.ts`

### PR Strategy

| Stage | PR   | Status         | Description                                 |
| ----- | ---- | -------------- | ------------------------------------------- |
| 1     | #398 | ✅ Merged      | Foundation - SDK setup, app structure, docs |
| 2     | TBD  | 🔄 In Progress | Working flows - Login, checkout, emails     |
| 3     | TBD  | ⏳ Pending     | Scenarist integration - Scenarios, tests    |

---

## Workflow: Small Increments with Review

**Every deliverable requires user review before proceeding.**

For each video:

1. Draft video script → **REVIEW CHECKPOINT**
2. Record video → **REVIEW CHECKPOINT**
3. Draft companion blog post → **REVIEW CHECKPOINT**
4. Finalize and commit → Move to next video

For standalone blog posts:

1. Draft blog post → **REVIEW CHECKPOINT**
2. Revise based on feedback → **REVIEW CHECKPOINT**
3. Finalize and commit → Move to next post

**No batch work.** Complete one item, get approval, then proceed.

---

## Implementation Order

### Demo App Stage 1: Foundation ✅ COMPLETE

- [x] Build PayFlow basic structure (Next.js, Tailwind, TypeScript)
- [x] Add Auth0 SDK integration
- [x] Add Stripe SDK integration
- [x] Environment variable configuration
- [x] README with setup instructions
- [x] **REVIEW CHECKPOINT** → PR #398 merged

### Demo App Stage 2: Working Flows 🔄 NEARLY COMPLETE

- [x] Auth0 login/logout working
- [x] User tier displayed in sidebar
- [x] Tier-based pricing discounts applied
- [x] Functional cart (add items, persist state)
- [x] Stripe checkout flow (redirect to Stripe, handle callbacks)
- [x] Stripe webhook handling (`checkout.session.completed`)
- [ ] SendGrid email integration (order confirmations) ← Optional
- [x] Orders page with history
- [ ] **REVIEW CHECKPOINT** → PR #399 ready for review

### Demo App Stage 3: Scenarist Integration ⏳ PENDING

This is where Scenarist actually gets added to demonstrate the promotional value:

- [ ] Install `@scenarist/nextjs-adapter` and `@scenarist/playwright-helpers`
- [ ] Define scenarios for all test cases:
  - `default` - Happy path
  - `premiumUser` / `enterpriseUser` - Tier-based pricing
  - `paymentDeclined` / `payment3DSRequired` - Payment errors
  - `paymentPolling` - Status progression sequence
  - `authError` - Authentication failure
- [ ] Create Playwright test suite using Scenarist fixtures
- [ ] Verify production build (tree-shaking - no test code in bundle)
- [ ] **REVIEW CHECKPOINT** → Tag: `stage-3-complete`

### Phase 1: The Problem & The App (Videos 1-2)

- [ ] Record Video 1: The Testing Gap → Tag: `video-01-testing-gap`
- [ ] Write Video 1 companion blog post
- [ ] Record Video 2: Meet PayFlow (full app demo, no Scenarist) → Tag: `video-02-meet-payflow`
- [ ] Write Video 2 companion blog post

### Phase 2: Introducing Scenarist (Videos 3-4)

- [ ] Record Video 3: One Server, Unlimited Scenarios → Tag: `video-03-scenario-switching`
- [ ] Write Video 3 companion blog post
- [ ] Record Video 4: Case Study (The Bug Your Tests Didn't Catch) → Tag: `video-04-case-study`
- [ ] Write Video 4 companion blog post

### Phase 3: Deep Dives (Videos 5-6)

- [ ] Record Video 5: Server-Side State → Tag: `video-05-server-state`
- [ ] Write Video 5 companion blog post
- [ ] Record Video 6: Test Behavior, Not Implementation → Tag: `video-06-behavior-testing`
- [ ] Write Video 6 companion blog post

### Phase 4: Core Features (Videos 7-10)

- [ ] Record Video 7: Request Matching → Tag: `video-07-request-matching`
- [ ] Write Video 7 companion blog post
- [ ] Record Video 8: Response Sequences → Tag: `video-08-sequences`
- [ ] Write Video 8 companion blog post
- [ ] Record Video 9: Stateful Mocks → Tag: `video-09-stateful-mocks`
- [ ] Write Video 9 companion blog post
- [ ] Record Video 10: Parallel Testing → Tag: `video-10-parallel-testing`
- [ ] Write Video 10 companion blog post

### Phase 5: Advanced Patterns (Videos 11-13)

- [ ] Record Video 11: Feature Composition → Tag: `video-11-composition`
- [ ] Write Video 11 companion blog post
- [ ] Record Video 12: Production Safety → Tag: `video-12-production-safety`
- [ ] Write Video 12 companion blog post
- [ ] Record Video 13: Playwright Integration → Tag: `video-13-playwright`
- [ ] Write Video 13 companion blog post

### Phase 6: Decision Maker Content (Videos 14-15)

- [ ] Record Video 14: For Tech Leads → Tag: `video-14-tech-leads`
- [ ] Write Video 14 companion blog post
- [ ] Record Video 15: Tool Comparison → Tag: `video-15-comparison`
- [ ] Write Video 15 companion blog post

### Standalone Blog Posts

- [ ] Blog: Introduction to Server-Side Integration Testing (foundational)
- [ ] Blog: Getting Started with Scenarist in 10 Minutes
- [ ] Blog: Migrating from MSW to Scenarist
- [ ] Blog: Testing Next.js Server Components (framework example)
- [ ] Blog: Common Pitfalls and How to Avoid Them
- [ ] Blog: Real-World Patterns (E-Commerce, Auth, Payments)

### Pre-Launch

- [ ] Review and edit all videos
- [ ] Create YouTube playlist
- [ ] Decide release cadence
- [ ] Prepare social media content

### Launch

- [ ] Release videos
- [ ] Publish blog posts
- [ ] Monitor engagement

## Notes

- Recording strategy: Record all (or most) videos before releasing any
- Blog posts: Markdown format, hosting TBD (may go on docs site)
- Demo app: Located at `demo/payflow/` in the Scenarist monorepo
  - Excluded from pnpm workspace (installs from npm, not workspace)
  - Validates published packages work correctly
  - Keeps demo code and blog posts in sync (one commit = one state)

### Git Tag Strategy

- **Stage tags** (`stage-1-foundation`, etc.): Mark major milestones, created after review checkpoint
- **Video tags** (`video-01-testing-gap`, etc.): Mark exact code state shown in each video
- Blog posts link to video tags so readers can see the exact code
- Tags are pushed to remote: `git push --tags`
- To view code at any point: `git checkout video-03-case-study`

**Tag names are flexible.** The specific names listed in this document are proposals that will evolve during implementation. What matters is the principle: each reviewable state gets a tag.
