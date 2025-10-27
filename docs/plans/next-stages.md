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
- Consumer-facing documentation site
- Next.js example application
- Package metadata and licensing
- Security vulnerability fixes

---

## Pre-Release Requirements

These items MUST be complete before v1.0 release.

### 1. Documentation Site (REQUIRED)

**Goal:** Professional, searchable documentation for users

**Technology Choice:** Nextra (Next.js + MDX)
- Fast, modern
- MDX support (interactive examples)
- Built-in search
- Easy deployment (Vercel)
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
│   │   ├── scenario-definitions.mdx     # ScenarioDefinition type
│   │   └── mock-definitions.mdx         # MockDefinition type
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
1. ✅ Create Nextra site (scaffold)
2. ✅ Migrate existing docs to MDX
3. ✅ Add navigation and search
4. ✅ Add code examples (syntax highlighting)
5. ✅ Add interactive examples (embedded CodeSandbox?)
6. ✅ Deploy to Vercel (scenarist.dev domain?)
7. ✅ Add Open Graph images
8. ✅ Add Google Analytics (optional)

**Estimated Time:** 5-7 days
**Priority:** CRITICAL - Must have before v1.0

---

### 2. Next.js Example Application (REQUIRED)

**Goal:** Demonstrate Scenarist works with Next.js (most popular framework)

**Scope:**
- **App Router** (modern, recommended)
- Server Components
- Server Actions
- Route Handlers (API routes)
- Integration tests with Scenarist

**Example App:** E-commerce checkout flow
```
apps/nextjs-example/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                         # Product listing
│   ├── cart/
│   │   └── page.tsx                     # Shopping cart
│   ├── checkout/
│   │   ├── page.tsx                     # Checkout form
│   │   └── actions.ts                   # Server Actions (submit payment)
│   └── api/
│       ├── products/route.ts            # GET /api/products
│       ├── cart/route.ts                # GET/POST /api/cart
│       └── payment/route.ts             # POST /api/payment
├── src/
│   ├── scenarios.ts                     # Scenario definitions
│   └── scenarist.ts                     # Scenarist setup
├── tests/
│   ├── cart.test.ts                     # Cart flows (stateful)
│   ├── checkout.test.ts                 # Payment flows (sequences)
│   └── products.test.ts                 # Product listing (matching)
└── README.md
```

**External API Mocks:**
- Stripe API (payment processing)
- Product catalog API
- Inventory API
- Tax calculation API

**Test Scenarios:**
1. **Success Flow:** Add items → checkout → payment succeeds
2. **Payment Declined:** Card declined scenario
3. **Out of Stock:** Inventory check fails
4. **Premium User:** Different pricing tiers (match criteria)
5. **Payment Retry:** Polling for async payment status (sequences)

**Tasks:**
1. ✅ Create Next.js app (App Router)
2. ✅ Build e-commerce UI (product list, cart, checkout)
3. ✅ Add Server Actions for mutations
4. ✅ Define scenarios (success, error, edge cases)
5. ✅ Write integration tests
6. ✅ Add Bruno collection for manual testing
7. ✅ Document Next.js setup in README
8. ✅ Add to documentation site

**Estimated Time:** 3-5 days
**Priority:** CRITICAL - Must have before v1.0

---

### 3. Package Metadata & Licensing (REQUIRED)

**Goal:** Prepare packages for npm publishing

**Tasks:**

**Licensing:**
- ✅ Add LICENSE file (MIT) to repo root
- ✅ Add LICENSE to each package
- ✅ Update package.json license field

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
- ✅ @scenarist/core - Core functionality overview
- ✅ @scenarist/msw-adapter - MSW integration
- ✅ @scenarist/express-adapter - Express setup
- ✅ (future) @scenarist/nextjs-adapter - Next.js setup

**Tasks:**
1. ✅ Create LICENSE files
2. ✅ Update all package.json files
3. ✅ Write package READMEs
4. ✅ Verify exports and entry points
5. ✅ Test package builds locally
6. ✅ Create .npmignore files if needed

**Estimated Time:** 1-2 days
**Priority:** CRITICAL - Must have before v1.0

---

### 4. Security & Quality (REQUIRED)

**Goal:** Fix known issues, ensure production readiness

**Known Issues:**
- 1 high severity Dependabot alert
- 1 moderate severity Dependabot alert

**Tasks:**
1. ✅ Run `npm audit` across all packages
2. ✅ Fix Dependabot vulnerabilities
3. ✅ Review all dependencies (remove unused)
4. ✅ Add CI checks for vulnerabilities
5. ✅ Run final test suite (all 281 tests)
6. ✅ Run type checking (strict mode)
7. ✅ Run linting (no warnings)

**Estimated Time:** 4-8 hours
**Priority:** CRITICAL - Must have before v1.0

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

**Week 1-2: Documentation Site**
- Days 1-2: Nextra setup, structure
- Days 3-5: Migrate existing docs to MDX
- Days 6-7: Cookbook recipes, polish
- Days 8-10: Review, test, deploy

**Week 3: Next.js Example**
- Days 1-2: App setup, UI building
- Day 3: Scenarist integration
- Day 4: Scenarios and tests
- Day 5: Documentation and polish

**Week 4: Security & Metadata**
- Days 1-2: Fix vulnerabilities
- Day 3: Package metadata
- Days 4-5: Package READMEs
- Day 6-7: Final review and testing

**Total Time:** ~4 weeks

### v1.0 Release

**Release Checklist:**
- ✅ All 281 tests passing
- ✅ Documentation site live
- ✅ Express example complete
- ✅ Next.js example complete
- ✅ Security issues resolved
- ✅ Package metadata complete
- ✅ READMEs written
- ✅ CHANGELOG created
- ✅ Changesets configured

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

## Next Actions (Immediate)

1. **Merge PR #36** (documentation cleanup)
2. **Create Nextra site** (scaffold, basic structure)
3. **Start migrating docs** to MDX format
4. **Fix Dependabot issues** (security first)
5. **Create Next.js example** (parallel with docs)

**Estimated time to v1.0:** 4 weeks of focused work

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
