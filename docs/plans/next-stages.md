# Scenarist: Next Development Stages

**Status:** Planning
**Created:** 2025-10-27
**Last Updated:** 2025-10-27

## Current Status

✅ **Core Features Complete:**
- Phase 1: Request Content Matching (specificity-based selection)
- Phase 2: Response Sequences (repeat modes, idempotency)
- Phase 3: Stateful Mocks (capture, templates, reset)
- Phase 4: Composition (guaranteed by architecture, no implementation needed)

✅ **Test Coverage:** 281 tests across all packages, 100% coverage maintained
✅ **Documentation:** Complete (core-functionality.md, stateful-mocks.md, 5 ADRs, CLAUDE.md)
✅ **Example App:** Express adapter with comprehensive scenarios and Bruno tests

**What's Missing for v1.0 Release:**
- Next.js adapter package + example applications (PRIORITY 1)
- Playwright helpers package (PRIORITY 1)
- Consumer-facing documentation site (PRIORITY 2)
- Package metadata and licensing (PRIORITY 3)
- Security vulnerability fixes (PRIORITY 3)

---

## Pre-Release Requirements

These items MUST be complete before v1.0 release.

### 1. Next.js Adapter + Examples (REQUIRED - PRIORITY 1)

**Goal:** Full Next.js support with adapter package + example applications demonstrating all Scenarist features

**Why First:** Next.js is the most popular framework. Examples validate architecture and provide concrete demos for future documentation.

**Three Deliverables:**

#### 1a. Next.js Adapter Package (`packages/nextjs-adapter`)

**Status:** ⏳ Not Started - CRITICAL dependency for examples

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
- [ ] Create package structure
- [ ] Implement Pages Router middleware
- [ ] Implement App Router middleware
- [ ] Implement RequestContext for Next.js
- [ ] Add scenario endpoints
- [ ] Write unit tests (100% coverage)
- [ ] Write integration tests
- [ ] Document API

**Estimated Time:** 2-3 days
**Priority:** CRITICAL - Must complete BEFORE example apps

---

#### 1b. Playwright Helpers Package (`packages/playwright-helpers`)

**Status:** ⏳ Not Started - Developed alongside Pages Router example

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
- [ ] Create package structure
- [ ] Implement ScenaristFixtures type
- [ ] Implement auto test ID generation
- [ ] Implement scenario switching helper
- [ ] Write unit tests
- [ ] Document API
- [ ] Verify works with multiple frameworks

**Estimated Time:** Developed in parallel with Pages Router (included in 5-6 day estimate)
**Priority:** HIGH - Needed for Pages Router example

---

#### 1c. Pages Router Example (`apps/nextjs-pages-example`)

**Status:** ⏳ Not Started - Depends on Next.js adapter + Playwright helpers

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
- [ ] Phase 0: Setup (Next.js app + adapter integration)
- [ ] Phase 1: Scenarist integration + first helper
- [ ] Phase 2: Products page (request matching demo)
- [ ] Phase 3: Shopping cart (stateful mocks demo)
- [ ] Phase 4: Checkout (composition demo)
- [ ] Phase 5: Payment (sequences demo)
- [ ] Phase 6: Parallel test isolation proof
- [ ] Phase 7: Documentation & polish

**Deliverables:**
- [ ] Full e-commerce app using @scenarist/nextjs-adapter
- [ ] 20+ Playwright E2E tests using @scenarist/playwright-helpers
- [ ] 100% API route coverage (Vitest)
- [ ] Bruno collection (10+ requests)
- [ ] Comprehensive README with setup instructions

**Detailed Plan:** [nextjs-pages-and-playwright-helpers.md](./nextjs-pages-and-playwright-helpers.md)
**Estimated Time:** 5-6 days (includes Playwright helpers development)
**Priority:** CRITICAL - Primary v1.0 deliverable

---

#### 1d. App Router Example (`apps/nextjs-app-example`)

**Status:** ⏳ Not Started (after Pages Router complete)

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
- [ ] Create Next.js app (App Router with `app/` directory)
- [ ] Adapt e-commerce flow to Server Components
- [ ] Use Server Actions for mutations
- [ ] Integrate @scenarist/nextjs-adapter/app
- [ ] Reuse Playwright helpers package
- [ ] Write tests (Playwright + Vitest)
- [ ] Bruno collection
- [ ] Comprehensive README

**Estimated Time:** 3-4 days (faster due to Pages Router learnings + adapter exists)
**Priority:** CRITICAL - Must have before v1.0

**Combined Time for Next.js Work (1a-1d):** 10-13 days
- Next.js adapter: 2-3 days
- Pages Router example + Playwright helpers: 5-6 days
- App Router example: 3-4 days

---

### 2. Documentation Site (REQUIRED - PRIORITY 2)

**Goal:** Professional, searchable documentation for users

**Why After Next.js Examples:** Documentation can reference real working examples, making it more concrete and useful.

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
6. [ ] Deploy to **Cloudflare Pages** (scenarist.dev domain?)
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
  "homepage": "https://scenarist.dev",
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

**CORRECTED Approach:** Next.js adapter + examples FIRST, then documentation site, then polish

**Weeks 1-3: Next.js Adapter + Examples + Playwright Helpers**
- **Days 1-3:** Next.js adapter package (2-3 days)
  - Implement Pages Router middleware
  - Implement App Router middleware
  - RequestContext, scenario endpoints
  - Tests + documentation
- **Days 4-9:** Pages Router example + Playwright helpers (5-6 days)
  - Phases 0-7 of implementation plan
  - E-commerce flow with all Scenarist features
  - Playwright helpers developed alongside (70% boilerplate reduction)
  - 20+ E2E tests, Bruno collection
- **Days 10-13:** App Router example (3-4 days)
  - Adapt e-commerce flow to Server Components
  - Reuse Playwright helpers and scenarios
  - Tests + documentation

**Weeks 4-5: Documentation Site**
- Days 1-2: Nextra setup, structure
- Days 3-5: Migrate existing docs to MDX
- Days 6-7: Add Next.js adapter/examples documentation
- Days 8-10: Cookbook recipes, polish, deploy to **Cloudflare Pages**

**Week 6: Polish & Release Prep**
- Days 1-2: Fix security vulnerabilities
- Day 3: Package metadata & licensing
- Days 4-5: Package READMEs
- Days 6-7: Final review, testing, release prep

**Total Time:** ~6 weeks

**Why This Order:**
1. **Next.js adapter first** - Required dependency for examples
2. **Pages Router + Playwright helpers** - Battle-tested patterns for docs
3. **App Router** - Reuses adapter, helpers, and patterns
4. **Documentation** - Can reference real working examples with adapter
5. **Polish** - Final pass before release

### v1.0 Release

**Release Checklist:**
- [x] All 281 tests passing (core features complete)
- [x] Express adapter complete (with example app + Bruno tests)
- [ ] **Next.js adapter package complete** ← NEW
- [ ] Playwright helpers package complete
- [ ] Next.js Pages Router example complete
- [ ] Next.js App Router example complete
- [ ] Documentation site live (deployed to Cloudflare Pages)
- [ ] Security issues resolved
- [ ] Package metadata complete
- [ ] Package READMEs written
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

Options:
- scenarist.dev (recommended)
- scenarist.io
- getscenarist.com
- scenarist-testing.dev

**Decision needed:** Which domain to buy?

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
- ✅ PR #36 merged (documentation cleanup, ADRs)
- ✅ PR #39 updated (consolidated living plan for Next.js implementation)
- ✅ Implementation plan document consolidated

**In Progress:**
- 🚧 Planning Next.js adapter + examples ([Plan](./nextjs-pages-and-playwright-helpers.md) | [PR #39](https://github.com/citypaul/scenarist/pull/39))
  - Status: Ready to start implementation
  - **CRITICAL**: Plan needs update to include Next.js adapter package

**Up Next (CORRECTED ORDER):**
1. **Update implementation plan** - Add Next.js adapter package (~1 hour)
2. **Build Next.js adapter package** (~2-3 days)
   - Pages Router middleware
   - App Router middleware
   - Tests + documentation
3. **Build Pages Router example + Playwright helpers** (~5-6 days)
   - Phases 0-7 of implementation plan
   - E-commerce flow demonstrating all features
4. **Build App Router example** (~3-4 days)
   - Reuse adapter, helpers, and patterns
5. **Build documentation site** (Nextra + Cloudflare Pages, ~5-7 days)
   - Reference real working examples
6. **Fix security vulnerabilities** (~4-8 hours)
7. **Package metadata & licensing** (~1-2 days)
8. **Final polish & release** (~1-2 days)

**Estimated time to v1.0:** ~6 weeks of focused work

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
