# Next.js Pages Router - Implementation Working Document

**Status**: 📋 Phase 0 - Ready to Start
**Started**: TBD (after document approved)
**Last Updated**: 2025-10-27
**Main Plan**: [nextjs-pages-and-playwright-helpers.md](./nextjs-pages-and-playwright-helpers.md)
**PR**: [#39](https://github.com/citypaul/scenarist/pull/39)

---

## Purpose of This Document

This is a **working document** that tracks our day-to-day implementation progress. It complements the main comprehensive plan:

- **Main plan** ([nextjs-pages-and-playwright-helpers.md](./nextjs-pages-and-playwright-helpers.md)) = Strategy, architecture, complete phase breakdowns
- **This document** = Current status, learnings, decisions, tracking

**Update this document frequently** - Don't wait until a phase is complete. Log learnings, gotchas, and decisions as they happen.

---

## Current Phase

### What We're Working On

**Phase 0: Setup (0.5 day estimate)**

Validating MSW + Scenarist + Next.js integration with absolute minimum setup.

### Progress

- [ ] Create Next.js app (Pages Router + TypeScript)
- [ ] Install dependencies (MSW, Playwright, Vitest, Tailwind)
- [ ] Create playwright-helpers package structure
- [ ] Configure TypeScript strict mode
- [ ] Configure Playwright
- [ ] Configure Vitest
- [ ] Create lib/scenarist.ts (MSW setup)
- [ ] Create pages/api/__scenario__.ts
- [ ] Create default scenario (empty mocks)
- [ ] Create index.tsx (static "Hello E-commerce" page)
- [ ] Write ONE Playwright test (verbose, loads page)
- [ ] Setup fake API (json-server + db.json)
- [ ] Verify builds pass

### Blockers

None currently.

### Next Steps

1. Begin Phase 0 implementation
2. Validate MSW intercepts Next.js API routes
3. Move to Phase 1 if validation succeeds

---

## Fake Backend APIs

### Why We Need This

To demonstrate Scenarist's value clearly, we need to show the comparison:

1. **Without Scenarist**: Tests hitting "real" backend (slow, flaky, requires external service running)
2. **With Scenarist**: Tests using mocked scenarios (fast, reliable, zero external dependencies)

This makes the value proposition obvious: Scenarist eliminates the pain of managing test backends.

### Technology Choice: json-server

**Selected**: json-server
**Why**: Simple, zero-code, automatically generates REST endpoints from JSON
**Installation**: `pnpm add -D json-server`

**Alternatives Considered**:
- **Prism** (OpenAPI mock server): More powerful but overkill for our needs
- **Custom Express server**: More work, not needed for simple demo
- **MSW as standalone server**: Could work but defeats the comparison purpose

**Decision**: json-server is intentionally simple. Its limitations (no sequences, no state, static responses) highlight why Scenarist is better.

### Endpoints to Mock

All external API calls that our Next.js app makes:

1. **Product Catalog API** (`http://localhost:3001/products`)
   - `GET /products` → List of products with pricing (tier-based)

2. **Shopping Cart API** (`http://localhost:3001/cart`)
   - `POST /cart/add` → Add item to cart
   - `GET /cart` → Get current cart items

3. **Shipping API** (`http://localhost:3001/shipping`)
   - `POST /shipping/calculate` → Calculate shipping cost

4. **Payment API** (`http://localhost:3001/payment`)
   - `POST /payment/create` → Create payment intent
   - `GET /payment/:id/status` → Get payment status

### db.json Structure

```json
{
  "products": [
    {
      "id": "1",
      "name": "Premium Widget",
      "description": "High-end widget for premium users",
      "price": 99.99,
      "tier": "premium",
      "stock": 50
    },
    {
      "id": "2",
      "name": "Standard Widget",
      "description": "Standard widget for all users",
      "price": 149.99,
      "tier": "standard",
      "stock": 100
    },
    {
      "id": "3",
      "name": "Premium Gadget",
      "description": "Premium gadget with extra features",
      "price": 199.99,
      "tier": "premium",
      "stock": 25
    }
  ],
  "cart": {
    "items": [],
    "count": 0,
    "total": 0
  },
  "shipping": {
    "rates": {
      "UK": 0,
      "US": 9.99,
      "EU": 7.99,
      "default": 12.99
    }
  },
  "payments": {
    "pay_123": {
      "id": "pay_123",
      "status": "pending",
      "amount": 99.99,
      "currency": "GBP"
    }
  }
}
```

### File Structure

```
apps/nextjs-pages-example/
├── fake-api/
│   ├── db.json              # json-server database
│   ├── routes.json          # Custom route mappings (optional)
│   └── README.md            # How to run fake API
├── package.json             # Script: "fake-api": "json-server fake-api/db.json --port 3001"
└── ...
```

### Usage

```bash
# Terminal 1: Start fake backend
pnpm fake-api
# Runs on http://localhost:3001

# Terminal 2: Start Next.js app
pnpm dev
# Runs on http://localhost:3000

# Terminal 3: Run tests against fake backend
SCENARIST_ENABLED=false pnpm test:e2e

# Or: Run tests with Scenarist (no fake API needed)
pnpm test:e2e
```

### Comparison Demo for README

We'll document this comparison prominently:

**Without Scenarist (using fake API)**:
```bash
# Setup required
npm run fake-api &          # Start json-server on port 3001
npm run dev &               # Start Next.js app
npm test                    # Run tests

# Limitations:
# - Requires running json-server (extra process)
# - Can't test error scenarios easily (json-server returns 404s)
# - Can't test sequences (payment status polling)
# - Can't test stateful behavior (cart state)
# - Slower (real HTTP calls to json-server)
# - Flaky (timing issues, port conflicts)

# Approximate test run time: 10-15 seconds
```

**With Scenarist**:
```bash
# Setup required
npm run dev                 # Start Next.js app (Scenarist built-in)
npm test                    # Run tests

# Benefits:
# ✅ No external dependencies
# ✅ Test error scenarios (payment declined, out of stock)
# ✅ Test sequences (payment status: pending → processing → succeeded)
# ✅ Test stateful behavior (cart accumulates items)
# ✅ Fast (in-memory mocks, no network calls)
# ✅ Reliable (no timing issues, no port conflicts)
# ✅ Parallel tests (isolated via test IDs)

# Approximate test run time: 2-3 seconds
```

**Metrics to track**:
- Test execution time: fake API vs Scenarist
- Setup complexity: 2 processes vs 1 process
- Scenario coverage: limited vs comprehensive

---

## Phase Status Tracking

### Phase 0: Setup ⏳ Not Started

**Goal**: Validate MSW + Scenarist + Next.js integration
**Estimated**: 0.5 day
**Actual**: TBD

**Tasks**:
- [ ] Create Next.js app (Pages Router)
- [ ] Install dependencies (MSW, Playwright, Vitest, Tailwind)
- [ ] Create playwright-helpers package structure
- [ ] Configure TypeScript strict mode
- [ ] Configure Playwright
- [ ] Configure Vitest
- [ ] Create lib/scenarist.ts (MSW setup)
- [ ] Create pages/api/__scenario__.ts
- [ ] Create default scenario (empty mocks)
- [ ] Create index.tsx (static page)
- [ ] Write ONE Playwright test (verbose, loads page)
- [ ] Setup fake API (json-server + db.json)
- [ ] Verify builds pass

**Success Criteria**:
1. `pnpm build` passes for both packages
2. Next.js dev server starts without errors
3. ONE Playwright test passes (verbose, no helpers)
4. Can call `POST /__scenario__` endpoint
5. json-server runs on port 3001
6. Zero TypeScript errors

**Validation Point**: If this takes >1 day, MSW integration has issues. Stop and debug.

**Learnings**: [To be filled in during implementation]

**Gotchas**: [To be filled in during implementation]

---

### Phase 1: First Helper ⏳ Not Started

**Goal**: Extract scenario switching helper from working verbose test
**Estimated**: 1 day
**Actual**: TBD

**RED**:
- [ ] Write verbose Playwright test manually calling `/__scenario__`
- [ ] Test fails (no endpoint implementation yet)

**GREEN**:
- [ ] Implement `/__scenario__` endpoint in Next.js
- [ ] Implement MSW server lifecycle
- [ ] Register `default` scenario
- [ ] Test passes

**REFACTOR**:
- [ ] Extract helper to `packages/playwright-helpers/src/fixtures.ts`
- [ ] Create `ScenaristFixtures` type
- [ ] Implement auto test ID generation
- [ ] Implement `switchScenario()` method
- [ ] Update test to use helper
- [ ] Test still passes (validation)
- [ ] Measure LOC reduction (target: 70%)

**Success Criteria**:
1. `playwright-helpers` exports `test` fixture with `scenarist` context
2. Scenario switching works via helper
3. Test boilerplate reduced by ~70% (measurable)
4. Helper works with Next.js without issues

**Validation Point**: If helper doesn't work after extraction, API design is wrong. Revisit fixture pattern.

**Learnings**: [To be filled in during implementation]

**Gotchas**: [To be filled in during implementation]

**LOC Comparison**:
- Before (verbose): TBD lines
- After (with helper): TBD lines
- Reduction: TBD%

---

### Phase 2: Products - Request Matching ⏳ Not Started

**Goal**: First complete feature demonstrating request matching
**Estimated**: 1 day
**Actual**: TBD

**Why Products First**:
- Simplest Scenarist feature (request matching)
- No dependencies on other features
- Immediate visual feedback
- Natural e-commerce entry point

**RED**:
- [ ] Write test: premium user sees £99.99 pricing
- [ ] Write test: standard user sees £149.99 pricing
- [ ] Tests fail (no API routes, no pages)

**GREEN**:
- [ ] Create `pages/api/products.ts` (fetches from external catalog API)
- [ ] Create `pages/index.tsx` (product listing page)
- [ ] Create `components/ProductCard.tsx` (display product)
- [ ] Add `premiumUserScenario` (match on `headers: { 'x-user-tier': 'premium' }`)
- [ ] Add `standardUserScenario` (match on `headers: { 'x-user-tier': 'standard' }`)
- [ ] Tests pass

**REFACTOR**:
- [ ] Extract product types to `types/product.ts`
- [ ] Clean up component structure
- [ ] Add loading/error states (optional)

**Success Criteria**:
1. Products page shows tier-based pricing
2. 2 scenarios demonstrating request matching
3. 2 Playwright tests passing (premium/standard)
4. Visual confirmation: different prices for different tiers
5. Fake API comparison documented

**Validation Point**: If matching doesn't work, test ID propagation has issues. Debug header flow page → API route.

**Learnings**: [To be filled in during implementation]

**Gotchas**: [To be filled in during implementation]

---

### Phase 3: Cart - Stateful Mocks ⏳ Not Started

**Goal**: Demonstrate state capture and injection
**Estimated**: 1 day
**Actual**: TBD

**Why Cart (not Checkout)**:
- Pure state demonstration (capture + inject)
- No dependencies (standalone feature)
- Clear before/after (empty → items added)

**RED**:
- [ ] Write test: add single item shows in cart
- [ ] Write test: add multiple items accumulates
- [ ] Write test: cart state persists across navigation
- [ ] Tests fail (no API routes, no pages)

**GREEN**:
- [ ] Create `pages/api/cart/add.ts` (POST with state capture)
- [ ] Create `pages/api/cart/index.ts` (GET with state injection)
- [ ] Create `pages/cart.tsx` (cart page with hardcoded "Add Item" buttons)
- [ ] Create `components/CartItem.tsx` (display cart item)
- [ ] Add `cartAccumulationScenario`:
  - `captureState: { 'cartItems[]': 'body.item' }`
  - Response uses `{{state.cartItems}}` and `{{state.cartItems.length}}`
- [ ] Tests pass

**REFACTOR**:
- [ ] Extract cart utilities
- [ ] Add cart summary component (optional)

**Success Criteria**:
1. Cart page with stateful behavior (items accumulate)
2. 1 new scenario demonstrating state capture/injection
3. 3 Playwright tests passing (6 total)
4. Visual confirmation: cart persists across navigation
5. State isolation: different test IDs don't share cart

**Note**: Cart is standalone - doesn't link to products page yet. Focus on demonstrating stateful mocks.

**Learnings**: [To be filled in during implementation]

**Gotchas**: [To be filled in during implementation]

---

### Phase 4: Checkout - Composition ⏳ Not Started

**Goal**: Demonstrate matching + stateful working together
**Estimated**: 0.5 day
**Actual**: TBD

**Why Checkout**:
- First integration between features (reads cart)
- Shows feature composition
- Relatively simple (just shipping calculation)

**RED**:
- [ ] Write test: UK address gets free shipping
- [ ] Write test: US address gets paid shipping
- [ ] Tests fail (no API routes, no pages)

**GREEN**:
- [ ] Create `pages/api/checkout/shipping.ts` (calculate shipping, match on `body.country`)
- [ ] Create `pages/checkout.tsx` (checkout form)
- [ ] Create `components/CheckoutForm.tsx` (form component)
- [ ] Add `freeShippingUKScenario` with `match: { body: { country: 'UK' } }`
- [ ] Tests pass

**REFACTOR**:
- [ ] Extract shipping logic
- [ ] Add form validation (optional)

**Success Criteria**:
1. Checkout page with shipping calculation
2. 1 new scenario demonstrating composition (matching + stateful)
3. 2 Playwright tests passing (8 total)
4. Visual confirmation: UK = free, US = £9.99
5. Integration: reads cart via `GET /api/cart`

**Note**: Checkout reads cart (integration) but can work standalone if cart is mocked.

**Learnings**: [To be filled in during implementation]

**Gotchas**: [To be filled in during implementation]

---

### Phase 5: Payment - Sequences ⏳ Not Started

**Goal**: Demonstrate sequence progression with polling
**Estimated**: 1 day
**Actual**: TBD

**Why Payment**:
- Most complex Scenarist feature (sequences)
- Demonstrates polling UX
- Standalone feature (direct URL navigation)

**RED**:
- [ ] Write test: payment status progresses (pending → processing → succeeded)
- [ ] Write test: payment stays on final status (repeat: 'last')
- [ ] Optional: Write test: payment declined scenario
- [ ] Tests fail (no API routes, no pages)

**GREEN**:
- [ ] Create `pages/api/payment/create.ts` (create payment)
- [ ] Create `pages/api/payment/status/[id].ts` (get status with sequence)
- [ ] Create `pages/payment/[orderId].tsx` (payment status page)
- [ ] Create `hooks/usePaymentPolling.ts` (polling hook)
- [ ] Add `paymentPollingScenario`:
  - Sequence: `[{ status: 'pending' }, { status: 'processing' }, { status: 'succeeded' }]`
  - `repeat: 'last'` (stays on 'succeeded')
- [ ] Optional: Add `paymentDeclinedScenario`
- [ ] Tests pass

**REFACTOR**:
- [ ] Extract polling logic to custom hook
- [ ] Add error handling for polling
- [ ] Add loading states

**Success Criteria**:
1. Payment status page with polling behavior
2. 1-2 new scenarios demonstrating sequences
3. 2-3 Playwright tests passing (11-12 total)
4. Visual confirmation: status progresses automatically
5. Sequence validation: stays on final status (doesn't cycle)

**Note**: Payment is standalone - direct URL navigation (`/payment/pay_123`), doesn't require checkout flow.

**Learnings**: [To be filled in during implementation]

**Gotchas**: [To be filled in during implementation]

---

### Phase 6: Parallel Isolation ⏳ Not Started

**Goal**: Prove test ID isolation with concurrent tests
**Estimated**: 0.5 day
**Actual**: TBD

**Tasks**:
- [ ] Write test: concurrent premium flow (full journey)
- [ ] Write test: concurrent standard flow (full journey)
- [ ] Write test: concurrent declined flow (error case)
- [ ] Configure Playwright for parallel execution (`mode: 'parallel'`)
- [ ] All tests pass without interference
- [ ] Document test ID isolation proof

**Success Criteria**:
1. 3+ tests running in parallel
2. No interference between tests (each uses unique test ID)
3. Visual confirmation: multiple browser windows work independently
4. Validates core Scenarist value: parallel test isolation

**Learnings**: [To be filled in during implementation]

**Gotchas**: [To be filled in during implementation]

---

### Phase 7: Documentation & Polish ⏳ Not Started

**Goal**: Comprehensive documentation for both packages
**Estimated**: 1 day
**Actual**: TBD

**Playwright Helpers README**:
- [ ] Installation instructions
- [ ] Before/After code comparison (70% LOC reduction)
- [ ] API documentation (fixtures, types, utils)
- [ ] Usage examples (Next.js, Express)
- [ ] TypeScript types reference
- [ ] Troubleshooting section

**Next.js Example README**:
- [ ] Project overview
- [ ] Setup instructions (installation, running locally)
- [ ] Architecture explanation (e-commerce flow, MSW setup)
- [ ] Running tests (Playwright, Vitest, Bruno)
- [ ] Scenario demonstrations (all 7 scenarios)
- [ ] How it uses Playwright helpers
- [ ] Fake API vs Scenarist comparison
- [ ] Code walkthrough (key files explained)

**Bruno Collection**:
- [ ] Setup requests (switch scenarios)
- [ ] Product listing requests (premium/standard)
- [ ] Cart requests (add items, view cart)
- [ ] Checkout requests (shipping calculation)
- [ ] Payment requests (create, poll status)
- [ ] 10+ requests total with assertions

**Documentation Updates**:
- [ ] Update `next-stages.md` (mark Pages Router complete)
- [ ] Update root README (add Playwright helpers)
- [ ] Add screenshots (optional but nice)
- [ ] Verify all links work
- [ ] Proofread all documentation

**Package Metadata**:
- [ ] Add package.json metadata (playwright-helpers)
- [ ] Add CHANGELOG.md (initial v0.1.0)

**Success Criteria**:
1. New developer can clone, setup, run tests
2. Clear before/after comparison shows value
3. All links work
4. Documentation is comprehensive and accurate

**Learnings**: [To be filled in during implementation]

**Gotchas**: [To be filled in during implementation]

---

## Decision Log

### Decisions Made

[This section will be filled in as we make decisions during implementation]

**Example format:**
- **Date**: 2025-10-27
- **Decision**: Use json-server for fake API
- **Rationale**: Simple, zero-code, highlights Scenarist's advantages
- **Alternatives**: Prism (too complex), custom Express (too much work)

### Decisions Deferred

[Things we consciously decided NOT to do yet]

**Example format:**
- **Decision**: Don't link products → cart → checkout yet
- **Rationale**: Keep features independent for now, add integration in Phase 6
- **Revisit**: After Phase 5 complete

### Mistakes & Corrections

[What didn't work and how we fixed it]

**Example format:**
- **Issue**: MSW didn't intercept Next.js API routes
- **Cause**: Wrong MSW setup for Node.js
- **Fix**: Used `setupServer` instead of `setupWorker`
- **Learning**: Always test MSW integration in Phase 0

---

## Metrics

### Test Coverage

- **Playwright E2E tests**: 0 / 20 (target)
- **Vitest API tests**: 0 (100% coverage target)
- **Bruno requests**: 0 / 10 (target)

### Code Quality

- **TypeScript errors**: 0 (always, strict mode)
- **Linting warnings**: 0 (always)
- **Test boilerplate reduction**: TBD (70% target after Phase 1)

### Performance

- **Fake API test run**: TBD seconds
- **Scenarist test run**: TBD seconds
- **Speed improvement**: TBD% (target: 5-10x faster)

### Build Times

- **Next.js app build**: TBD seconds
- **Playwright helpers build**: TBD seconds

---

## Files Created

Track all files as we create them.

### Completed Files

[To be filled in as we build]

### In Progress Files

[Current work]

### Planned Files

From main plan, not yet started:

**Next.js App**:
- `apps/nextjs-pages-example/package.json`
- `apps/nextjs-pages-example/next.config.js`
- `apps/nextjs-pages-example/tsconfig.json`
- `apps/nextjs-pages-example/tailwind.config.js`
- `apps/nextjs-pages-example/playwright.config.ts`
- `apps/nextjs-pages-example/vitest.config.ts`
- Pages, API routes, components (see main plan)

**Playwright Helpers**:
- `packages/playwright-helpers/package.json`
- `packages/playwright-helpers/tsconfig.json`
- `packages/playwright-helpers/src/fixtures.ts`
- `packages/playwright-helpers/src/types.ts`
- `packages/playwright-helpers/src/utils.ts`
- `packages/playwright-helpers/src/index.ts`

**Fake API**:
- `apps/nextjs-pages-example/fake-api/db.json`
- `apps/nextjs-pages-example/fake-api/README.md`

---

## Questions & Answers

### Technical Questions That Arose

[Q&A log as we implement]

**Example format:**
- **Q**: Does MSW work with Next.js API routes in Pages Router?
- **A**: Yes, using `setupServer` in Node.js mode
- **Date**: 2025-10-27

### User Questions

[Questions for Paul that came up during implementation]

---

## Risk Tracking

### High Priority Risks

Track risks identified in main plan:

1. **MSW + Next.js integration** - Status: Not yet validated
2. **Playwright fixtures with Next.js** - Status: Not yet validated
3. **Test ID propagation** - Status: Not yet validated
4. **Scope creep in scenarios** - Status: Watching

### Medium Priority Risks

5. **Premature helper extraction** - Status: Will validate in Phase 1
6. **Feature dependencies** - Status: Keeping features independent
7. **Time estimation** - Status: 6-day estimate, will adjust if needed

### Mitigations Applied

[Track what we did to mitigate risks]

---

## Links

- **Main Plan**: [nextjs-pages-and-playwright-helpers.md](./nextjs-pages-and-playwright-helpers.md)
- **PR**: [#38](https://github.com/citypaul/scenarist/pull/38)
- **Express Example**: [apps/express-example](../../apps/express-example) (reference implementation)
- **Next Stages**: [next-stages.md](./next-stages.md)
- **Core Functionality**: [core-functionality.md](../core-functionality.md)

---

## Update Log

Track when this document was updated and why.

| Date | Phase | Update | Author |
|------|-------|--------|--------|
| 2025-10-27 | Setup | Initial document creation | Claude |
| TBD | Phase 0 | TBD | TBD |

---

**Note**: This is a living document. Update it frequently as you implement. Don't wait until a phase is complete - update as you learn. Be honest about what worked, what didn't, and what you'd do differently.

**Remember**: The goal is not perfection. The goal is a working example that demonstrates Scenarist's value clearly and helps future contributors understand the implementation decisions.
