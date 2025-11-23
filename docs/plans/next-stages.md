# Scenarist: Next Development Stages

**Status:** Active - Documentation Phase
**Created:** 2025-10-27
**Last Updated:** 2025-11-13

## Current Status

✅ **Core Features Complete:**
- Phase 1: Request Content Matching (specificity-based selection)
- Phase 2: Response Sequences (repeat modes, idempotency)
- Phase 3: Stateful Mocks (capture, templates, reset)
- Phase 4: Composition (guaranteed by architecture, no implementation needed)

✅ **Adapters & Examples Complete:**
- Express adapter + example app with comprehensive E2E tests
- Next.js adapter (Pages Router + App Router with singleton pattern)
- Playwright helpers package (70% boilerplate reduction)
- Next.js Pages Router example (e-commerce flow)
- Next.js App Router example (Server Components + stateful mocks)

✅ **Test Coverage:** 300+ tests across all packages, 100% coverage maintained
✅ **Documentation:** Complete (core-functionality.md, stateful-mocks.md, 12 ADRs, CLAUDE.md)

**What's Missing for v1.0 Release:**
- Consumer-facing documentation site (PRIORITY 1 - Next Up)
- Package metadata and licensing (PRIORITY 2)
- Security vulnerability fixes (PRIORITY 2)

---

## Pre-Release Requirements

These items MUST be complete before v1.0 release.

### 1. Next.js Adapter + Examples ✅ COMPLETE

**Goal:** Full Next.js support with adapter package + example applications demonstrating all Scenarist features

**Status:** ✅ COMPLETE (Nov 2025) - All deliverables shipped

**Three Deliverables:**

#### 1a. Next.js Adapter Package (`packages/nextjs-adapter`) ✅ COMPLETE

**Status:** ✅ COMPLETE - Shipped with singleton pattern for HMR compatibility

**What it provides:**
- Middleware for Pages Router API routes
- Middleware for App Router Route Handlers
- Test ID extraction from Next.js requests
- Scenario switching endpoints (`/__scenario__`)
- Next.js-specific RequestContext implementation
- Integration with Next.js request/response objects

**Similar to:** `@scenarist/express-adapter` (follow same patterns)

**API Design:**
```typescript
// For Pages Router
import { createScenarist } from '@scenarist/nextjs-adapter/pages';
import { scenarios } from './scenarios';

export const scenarist = createScenarist({
  scenarios,
  config: {
    enabled: process.env.NODE_ENV === 'development'
  }
});

// Use in API routes
export default async function handler(req, res) {
  const context = scenarist.getContext(req);
  // Make requests that use active scenario
}

// For App Router
import { createScenarist } from '@scenarist/nextjs-adapter/app';
// Similar pattern but for Route Handlers
```

**Tasks:**
- [x] Create package structure
- [x] Implement Pages Router middleware
- [x] Implement App Router middleware
- [x] Implement RequestContext for Next.js
- [x] Add scenario endpoints
- [x] Write unit tests (100% coverage)
- [x] Write integration tests
- [x] Document API
- [x] Implement singleton pattern for HMR compatibility

**Completed:** Nov 2025
**Key Learning:** Singleton pattern required to prevent module duplication in Next.js HMR

---

#### 1b. Playwright Helpers Package (`packages/playwright-helpers`) ✅ COMPLETE

**Status:** ✅ COMPLETE - Shipped with auto test ID generation and scenario switching

**What it provides:**
- Reusable Playwright test utilities
- Auto test ID generation and injection
- Scenario switching helper (`scenarist.switchScenario()`)
- Playwright fixtures extending base `test`
- Framework-agnostic (works with any HTTP server - Express, Next.js, Fastify, etc.)

**Value Proposition:** 70% reduction in test boilerplate

**Before (without helpers):**
```typescript
test('my test', async ({ page }) => {
  const testId = `test-${Date.now()}-${Math.random()}`;
  await page.request.post('http://localhost:3000/__scenario__', {
    headers: { 'x-test-id': testId },
    data: { scenarioId: 'premium' }
  });
  await page.setExtraHTTPHeaders({ 'x-test-id': testId });
  await page.goto('/');
  // 6 lines of boilerplate
});
```

**After (with helpers):**
```typescript
import { test } from '@scenarist/playwright-helpers';

test('my test', async ({ page, scenarist }) => {
  await scenarist.switchScenario('premium');
  await page.goto('/');
  // 2 lines, focused on intent
});
```

**Tasks:**
- [x] Create package structure
- [x] Implement ScenaristFixtures type
- [x] Implement auto test ID generation
- [x] Implement scenario switching helper
- [x] Write unit tests
- [x] Document API
- [x] Verify works with multiple frameworks

**Completed:** Nov 2025
**Achievement:** 70% reduction in test boilerplate validated across Express and Next.js

---

#### 1c. Pages Router Example (`apps/nextjs-pages-router-example`) ✅ COMPLETE

**Status:** ✅ COMPLETE - Full e-commerce flow with comprehensive E2E tests

**What it demonstrates:**
- Full Next.js Pages Router integration
- All three Scenarist features (matching, sequences, stateful)
- Playwright E2E testing with helpers
- Real-world e-commerce flow

**Example App:** E-commerce checkout flow (products → cart → checkout → payment)

**Test Scenarios:**
1. **Premium/Standard User:** Different pricing tiers (request matching)
2. **Shopping Cart:** Item accumulation (stateful mocks)
3. **Free Shipping:** UK vs US shipping (matching + stateful)
4. **Payment Polling:** Status progression (sequences)
5. **Payment Declined:** Error handling
6. **Parallel Isolation:** Multiple tests with different scenarios concurrently

**Implementation Phases:**
- [x] Phase 0: Setup (Next.js app + adapter integration)
- [x] Phase 1: Scenarist integration + first helper
- [x] Phase 2: Products page (request matching demo)
- [x] Phase 3: Shopping cart (stateful mocks demo)
- [x] Phase 4: Checkout (composition demo)
- [x] Phase 5: Payment (sequences demo)
- [x] Phase 6: Parallel test isolation proof
- [x] Phase 7: Documentation & polish

**Deliverables:**
- [x] Full e-commerce app using @scenarist/nextjs-adapter
- [x] 20+ Playwright E2E tests using @scenarist/playwright-helpers
- [x] 100% API route coverage (Vitest)
- [x] Bruno collection (10+ requests)
- [x] Comprehensive README with setup instructions

**Completed:** Nov 2025
**Key Achievement:** First complete proof of Scenarist value with Next.js Pages Router

---

#### 1d. App Router Example (`apps/nextjs-app-router-example`) ✅ COMPLETE

**Status:** ✅ COMPLETE - Server Components with stateful mocks and sequences

**What it demonstrates:**
- Next.js App Router integration (modern, recommended approach)
- Server Components + Server Actions
- Route Handlers
- Same e-commerce flow, different architecture
- Reuses @scenarist/nextjs-adapter (App Router mode)

**Why After Pages Router:**
- Pages Router is simpler, better for initial demonstration
- App Router can reuse scenarios and patterns from Pages Router
- Shows migration path (Pages → App Router)
- Playwright helpers package already exists and works with both

**Tasks:**
- [x] Create Next.js app (App Router with `app/` directory)
- [x] Adapt e-commerce flow to Server Components
- [x] Use Server Actions for mutations (where applicable)
- [x] Integrate @scenarist/nextjs-adapter/app
- [x] Reuse Playwright helpers package
- [x] Write tests (Playwright + Vitest)
- [x] Bruno collection
- [x] Comprehensive README
- [x] Add RSC examples (products, polling, cart-server pages)

**Completed:** Nov 2025
**Key Achievement:** Proves Scenarist handles React Server Components without Jest issues

**Combined Time for Next.js Work (1a-1d):** COMPLETE
- Next.js adapter: ✅ Done
- Playwright helpers: ✅ Done
- Pages Router example: ✅ Done
- App Router example: ✅ Done

---

### 2. Documentation Site (REQUIRED - PRIORITY 1 - NEXT UP)

**Goal:** Professional, searchable documentation for users

**Status:** ⏳ Not Started - Ready to begin now that all examples are complete

**Why Now:** All adapters and examples are complete. Documentation can reference real working code.

**Technology Choice:** Nextra (Next.js + MDX)
- Fast, modern
- MDX support (interactive examples)
- Built-in search
- Easy deployment to **Cloudflare Pages**
- Good TypeScript support

**Content Structure:**
```
docs-site/
├── pages/
│   ├── index.mdx                        # Home page
│   ├── getting-started/
│   │   ├── introduction.mdx             # What is Scenarist?
│   │   ├── installation.mdx             # npm install instructions
│   │   ├── quick-start-express.mdx      # 5-minute Express tutorial
│   │   ├── quick-start-nextjs.mdx       # 5-minute Next.js tutorial
│   │   └── core-concepts.mdx            # Scenarios, test IDs, mocks
│   ├── guides/
│   │   ├── request-matching.mdx         # Match criteria, specificity
│   │   ├── sequences.mdx                # Polling, repeat modes
│   │   ├── stateful-mocks.mdx           # Capture, templates
│   │   ├── test-isolation.mdx           # Test IDs, parallel tests
│   │   └── bruno-testing.mdx            # Manual testing workflows
│   ├── adapters/
│   │   ├── express.mdx                  # Express setup & usage
│   │   ├── nextjs.mdx                   # Next.js setup & usage
│   │   └── custom-adapters.mdx          # Build your own
│   ├── api/
│   │   ├── core.mdx                     # @scenarist/core types
│   │   ├── express-adapter.mdx          # Express API
│   │   ├── nextjs-adapter.mdx           # Next.js API
│   │   ├── scenario-definitions.mdx     # ScenaristScenario type
│   │   └── mock-definitions.mdx         # ScenaristMock type
│   ├── cookbook/
│   │   ├── stripe-integration.mdx       # Testing Stripe payments
│   │   ├── auth-flows.mdx               # Login, logout, sessions
│   │   ├── shopping-cart.mdx            # Stateful cart example
│   │   ├── multi-step-forms.mdx         # Form wizards
│   │   └── polling-scenarios.mdx        # Job status, webhooks
│   └── architecture/
│       ├── hexagonal.mdx                # Ports & adapters
│       ├── three-phase-model.mdx        # Match → Select → Transform
│       ├── serialization.mdx            # Why no functions
│       └── decisions/                   # Link to ADRs
│           ├── adr-0001.mdx
│           ├── adr-0002.mdx
│           ├── adr-0004.mdx
│           └── adr-0005.mdx
```

**Tasks:**
1. [ ] Create Nextra site (scaffold)
2. [ ] Migrate existing docs to MDX
3. [ ] Add navigation and search
4. [ ] Add code examples (syntax highlighting)
5. [ ] Add interactive examples (embedded CodeSandbox?)
6. [ ] Deploy to **Cloudflare Pages** (scenarist.io domain)
7. [ ] Add Open Graph images
8. [ ] Add Google Analytics (optional)

**Estimated Time:** 5-7 days
**Priority:** CRITICAL - Must have before v1.0
**Status:** ⏳ Not Started (planned for AFTER Next.js examples complete)

---

### 3. Package Metadata & Licensing (REQUIRED - PRIORITY 3)

**Goal:** Prepare packages for npm publishing

**Tasks:**

**Licensing:**
- [ ] Add LICENSE file (MIT) to repo root
- [ ] Add LICENSE to each package
- [ ] Update package.json license field

**Package.json Updates:**
```json
{
  "name": "@scenarist/core",
  "version": "1.0.0",
  "description": "Framework-agnostic mock scenario management for E2E testing",
  "keywords": [
    "testing",
    "mocking",
    "msw",
    "e2e",
    "integration-testing",
    "test-isolation",
    "mock-service-worker",
    "scenarios"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/citypaul/scenarist.git",
    "directory": "packages/core"
  },
  "homepage": "https://scenarist.io",
  "bugs": "https://github.com/citypaul/scenarist/issues",
  "author": "Paul Hammond",
  "license": "MIT",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

**README.md Per Package:**
- [ ] @scenarist/core - Core functionality overview
- [ ] @scenarist/msw-adapter - MSW integration
- [ ] @scenarist/express-adapter - Express setup
- [ ] @scenarist/playwright-helpers - Playwright test utilities

**Tasks:**
1. [ ] Create LICENSE files
2. [ ] Update all package.json files
3. [ ] Write package READMEs
4. [ ] Verify exports and entry points
5. [ ] Test package builds locally
6. [ ] Create .npmignore files if needed

**Estimated Time:** 1-2 days
**Priority:** CRITICAL - Must have before v1.0
**Status:** ⏳ Not Started (after documentation site)

---

### 4. Security & Quality (REQUIRED - PRIORITY 3)

**Goal:** Fix known issues, ensure production readiness

**Known Issues:**
- 1 high severity Dependabot alert
- 1 moderate severity Dependabot alert

**Tasks:**
1. [ ] Run `npm audit` across all packages
2. [ ] Fix Dependabot vulnerabilities (1 high, 1 moderate)
3. [ ] Review all dependencies (remove unused)
4. [ ] Add CI checks for vulnerabilities
5. [ ] Run final test suite (all 281 tests)
6. [ ] Run type checking (strict mode)
7. [ ] Run linting (no warnings)

**Estimated Time:** 4-8 hours
**Priority:** CRITICAL - Must have before v1.0
**Status:** ⏳ Not Started (can be done in parallel with other work)

---

## Pre-Release Requirements

These items MUST be complete before v1.0 release.

### 0. Simplify Test ID Header Configuration (NEXT UP - BEFORE v1.0)

**Goal:** Remove custom test ID header configuration, standardize on `x-scenarist-test-id`

**Status:** 📋 Planned for v1.0 - **NEXT UP** - Tracked in [Issue #123](https://github.com/citypaul/scenarist/issues/123)

**Why This Change:**

Currently, users can configure a custom test ID header name via `headers.testId` configuration. This creates complexity and limitations:

1. **Helper Function Limitations**: `getScenaristTestId()` and `getScenaristTestIdFromReadonlyHeaders()` helpers cannot respect custom configurations without accessing the full scenarist instance. They hardcode the default `'x-test-id'` header name.

2. **Inconsistent API**: Users can configure a custom header, but convenience helpers won't work with it. This creates confusion.

3. **Unnecessary Complexity**: No compelling use case for customizing the test ID header name. It's internal infrastructure for test isolation.

**Proposed Changes:**

1. Remove `headers.testId` configuration option from all adapters
2. Standardize on `'x-scenarist-test-id'` header name (more specific, clearly identifies Scenarist infrastructure)
3. Simplify helper implementations (remove JSDoc "Important Limitation" warnings)
4. Update all documentation and examples

**Breaking Changes:**
- Applications using default `'x-test-id'` must update to `'x-scenarist-test-id'`
- Custom `headers.testId` configuration option removed
- All documentation examples require updates

**Benefits:**
- Simpler API (one less configuration option)
- Consistent behavior across all helpers
- Clearer intent (`'x-scenarist-test-id'` makes Scenarist ownership obvious)
- Reduced code complexity

**Why Now (Before v1.0):**
- No real users yet - perfect time for breaking changes
- Cleaner API for v1.0 launch
- Avoids migration burden later
- Helpers work consistently from day one

**Estimated Time:** 1-2 days
**Priority:** HIGH - Do this NEXT, before v1.0 release
**Status:** 📋 Ready to start - Issue #123 created

---

## Post-Release Enhancements

These items can be added after v1.0 release based on user feedback.

### 5. Phase 5 - Developer Experience & Debugging (OPTIONAL)

**Goal:** Add inspection API for debugging complex scenarios

**Feature:** `/__scenario_debug__` endpoint

```typescript
GET /__scenario_debug__
Headers: { 'x-test-id': 'my-test' }

Response:
{
  testId: "my-test",
  activeScenario: { id: "checkout", name: "Checkout Flow" },
  sequenceState: [
    {
      mockIndex: 0,
      url: "/api/payment/status",
      currentPosition: 3,
      totalResponses: 5,
      nextResponse: { status: 200, body: {...} }
    }
  ],
  capturedState: {
    cartItems: [...],
    userId: "user-123"
  },
  requestHistory: [
    {
      timestamp: "2025-10-27T12:34:56.789Z",
      method: "POST",
      url: "/api/cart/items",
      matchedMockIndex: 2,
      responseStatus: 200
    }
  ]
}
```

**Use Cases:**
- Playwright/Cypress debugging
- Bruno collection inspection
- Development mode visibility

**Tasks:**
1. Create `ScenarioInspection` types
2. Add `inspect(testId)` to ScenarioManager port
3. Implement inspection logic
4. Add `/__scenario_debug__` endpoint to Express adapter
5. Add to Next.js adapter
6. Write tests (unit + integration)
7. Create Bruno debugging collection
8. Document Playwright/Cypress usage

**Estimated Time:** 2-3 days
**Priority:** NICE TO HAVE - Can defer to v1.1

---

### 6. Additional Framework Adapters

**Goal:** Support more Node.js frameworks

**Priority Order:**

**6.1 Fastify Adapter** (v1.1)
- High demand after Express
- Similar middleware pattern
- Estimated: 1-2 days

**6.2 Hono Adapter** (v1.2)
- Edge runtime compatible (CloudFlare Workers, Deno, Bun)
- Growing popularity
- Estimated: 1-2 days

**6.3 Koa Adapter** (v1.3)
- Middleware pattern
- Less popular but requested
- Estimated: 1 day

**6.4 Remix Adapter** (v2.0?)
- Different architecture (loaders, actions)
- May require adapter pattern changes
- Estimated: 2-3 days

**Each Adapter Requires:**
- Adapter package creation
- Example application
- Integration tests
- Documentation
- Bruno collection

---

### 7. Community & Growth

**Tasks:**

**Content:**
- Blog posts on common patterns
- Video tutorials (YouTube)
- Conference talks?
- Podcast appearances?

**Community Platforms:**
- GitHub Discussions (free, integrated)
- Discord server (if demand warrants)
- Twitter/X presence
- Dev.to articles

**Examples Repository:**
- Real-world applications
- Different frameworks
- Complex scenarios
- Performance benchmarks

**Contributor Guide:**
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- Issue templates
- PR templates
- Good first issues

---

## Release Timeline

### Pre-v1.0 (Required Work)

**Current Status:** ✅ All technical work COMPLETE. Ready for documentation + polish.

**✅ COMPLETED: Weeks 1-3 - Next.js Adapter + Examples + Playwright Helpers**
- ✅ Next.js adapter package (Pages Router + App Router)
- ✅ Playwright helpers (70% boilerplate reduction)
- ✅ Pages Router example (e-commerce with all features)
- ✅ App Router example (Server Components + RSC examples)
- ✅ Singleton pattern for HMR compatibility
- ✅ 300+ tests passing, 100% coverage maintained

**🚧 IN PROGRESS: Weeks 4-5 - Documentation Site**
- [ ] Days 1-2: Nextra setup, structure
- [ ] Days 3-5: Migrate existing docs to MDX
- [ ] Days 6-7: Add Next.js adapter/examples documentation
- [ ] Days 8-10: Cookbook recipes, polish, deploy to **Cloudflare Pages**

**⏳ REMAINING: Week 6 - Polish & Release Prep**
- [ ] Days 1-2: Fix security vulnerabilities (2 Dependabot alerts)
- [ ] Day 3: Package metadata & licensing (MIT)
- [ ] Days 4-5: Package READMEs verification
- [ ] Days 6-7: Final review, testing, release prep

**Remaining Time to v1.0:** ~3 weeks (documentation + polish)

### v1.0 Release

**Release Checklist:**
- [x] All 300+ tests passing (core features complete)
- [x] Express adapter complete (with example app + Bruno tests)
- [x] Next.js adapter package complete (Pages Router + App Router)
- [x] Playwright helpers package complete
- [x] Next.js Pages Router example complete
- [x] Next.js App Router example complete (with RSC examples)
- [ ] Documentation site live (deployed to Cloudflare Pages)
- [ ] Security issues resolved (2 Dependabot alerts)
- [ ] Package metadata complete (MIT license, keywords)
- [ ] Package READMEs verified
- [ ] CHANGELOG created
- [ ] Changesets configured

**Release Process:**
1. Create v1.0.0 changeset
2. Version bump all packages
3. Build all packages
4. Publish to npm
5. Create GitHub release
6. Announcement (Twitter, Dev.to, Reddit r/typescript, r/testing)

### Post-v1.0 Releases

**v1.1 (4-6 weeks after v1.0):**
- Phase 5 debugging features
- Fastify adapter
- Community feedback items

**v1.2 (8-12 weeks after v1.0):**
- Hono adapter
- Additional examples
- Performance optimizations

**v2.0 (6-12 months after v1.0):**
- Breaking changes (if needed)
- Remix adapter
- Advanced features based on usage

---

## Success Metrics

**v1.0 Goals:**
- 📦 Published to npm
- 📚 Documentation site live
- ⭐ 100+ GitHub stars (organic)
- 📥 50+ weekly npm downloads
- 🐛 < 5 open bugs
- 💬 Active GitHub Discussions

**v1.1 Goals:**
- 📥 500+ weekly npm downloads
- ⭐ 500+ GitHub stars
- 🎯 2+ framework adapters
- 📝 5+ community blog posts
- 🤝 10+ contributors

**Long-term Goals:**
- 📥 5,000+ weekly npm downloads
- ⭐ 2,000+ GitHub stars
- 🎯 5+ framework adapters
- 🏢 Production usage in 50+ companies
- 📖 Conference talks
- 🌟 Industry recognition

---

## Decision Points

### Should we bundle adapters or separate packages?

**Current:** Separate packages (`@scenarist/express-adapter`, etc.)

**Pros:**
- ✅ Install only what you need
- ✅ Independent versioning
- ✅ Clear boundaries

**Cons:**
- ❌ More packages to maintain
- ❌ Version coordination

**Decision:** Keep separate packages (current approach is correct)

### Should we support browser-based testing?

**Future consideration:** Playwright/Cypress plugins

**Not for v1.0** - Focus on Node.js integration testing first
**Maybe v2.0** - After proving core value proposition

### Should we build visual scenario editor?

**Future consideration:** Web UI for creating scenarios

**Not for v1.0** - Code-first approach validates first
**Maybe v2.0** - If demand emerges from non-technical users

---

## Risk Mitigation

**Risk 1: Documentation site takes too long**
- *Mitigation:* Use Nextra (fast), migrate existing content (already written)
- *Fallback:* Use GitHub Pages with minimal styling if needed

**Risk 2: Next.js integration is complex**
- *Mitigation:* Start simple (API routes only), expand to App Router
- *Fallback:* Ship v1.0 with Express only, add Next.js in v1.1

**Risk 3: Security issues are complex**
- *Mitigation:* Upgrade dependencies, use automated tools
- *Fallback:* Document known issues, plan fixes for v1.0.1

**Risk 4: Low adoption**
- *Mitigation:* Strong documentation, clear value proposition, examples
- *Fallback:* Gather feedback, iterate based on real needs

---

## Questions to Resolve

### Domain Name

**Decision:** scenarist.io (scenarist.dev was taken, scenarist.io is available)

### npm Organization

Options:
- @scenarist/* (recommended - clean, short)
- @scenarist-testing/*
- @paul-hammond/scenarist-*

**Decision needed:** Create @scenarist org on npm?

### Logo/Branding

Do we need:
- Logo?
- Color scheme?
- Mascot?

**Decision needed:** Invest in branding or keep minimal?

---

## Next Actions (Current State)

**Recently Completed:**
- ✅ Next.js adapter package (Pages Router + App Router with singleton pattern)
- ✅ Playwright helpers package (70% boilerplate reduction achieved)
- ✅ Next.js Pages Router example (full e-commerce flow)
- ✅ Next.js App Router example (Server Components + RSC examples)
- ✅ Automatic default fallback feature
- ✅ Parallel test execution with singleton fix
- ✅ Documentation cleanup (PR #80)

**Current Priority: Documentation Site**
- Status: ⏳ Not Started - Ready to begin
- Timeline: 5-7 days
- Technology: Nextra + Cloudflare Pages
- Content: Migrate existing docs, add API references, cookbook recipes

**Up Next (Final v1.0 Steps):**
1. **Build documentation site** (Nextra + Cloudflare Pages, ~5-7 days)
   - Setup Nextra
   - Migrate existing markdown docs to MDX
   - Add navigation and search
   - Deploy to scenarist.io on Cloudflare Pages
2. **Fix security vulnerabilities** (~4-8 hours)
   - Resolve 2 Dependabot alerts (1 high, 1 moderate)
3. **Package metadata & licensing** (~1-2 days)
   - Add MIT LICENSE files
   - Update package.json metadata
   - Verify exports and entry points
4. **Final polish & release** (~1-2 days)
   - CHANGELOG
   - Changesets configuration
   - npm publishing

**Estimated time to v1.0:** ~3 weeks (documentation + polish)

---

## Appendix: What's NOT in Scope for v1.0

- ❌ Visual scenario editor
- ❌ Browser-based testing
- ❌ Playwright/Cypress plugins
- ❌ Performance benchmarking suite
- ❌ GraphQL support (MSW already handles it)
- ❌ WebSocket mocking
- ❌ gRPC support
- ❌ Database mocking
- ❌ File system mocking
- ❌ Time travel / snapshot testing
- ❌ Load testing features
- ❌ Cloud-hosted scenario management

**Philosophy:** Ship a focused, excellent solution for Node.js integration testing with HTTP mocks. Add features based on real user demand, not speculation.
