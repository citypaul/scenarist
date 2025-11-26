# Scenarist Documentation Plan: World-Class Astro + Starlight Site

## Executive Summary

This plan creates a gold-standard documentation site for Scenarist using Astro + Starlight. The documentation **leads with real developer pain** from testing modern frameworks (Next.js, Remix, TanStack), then shows how Scenarist fixes it. Architecture documentation is reserved for contributors; consumer docs focus on solving problems.

**Key Insight:** Modern frameworks (Next.js App Router, Remix, TanStack Router) treat testing as an afterthought. Developers face test pollution, sequential execution, scattered mocks, and restart hell. Scenarist fixes all of this. **Our docs must lead with this pain, not with hexagonal architecture.**

---

## Why Testing Modern Frameworks Is Broken (Research Findings)

### Next.js App Router

> "Since async Server Components are new to the React ecosystem, some tools do not fully support them. In the meantime, we recommend using End-to-End Testing over Unit Testing for async components."
> — Next.js Official Docs

**Translation:** Jest doesn't support RSC. Spawn a new Next.js instance per test. Hope it works.

**Additional Pain:**
- MSW beta setup required with `remote.enabled: true`
- Aggressive caching defaults cause confusion
- High internal knowledge requirement

**Developer Quote:**
> "It's not just you, Next.js is getting harder to use... There are many ways to shoot yourself in the foot that are opt-out instead of opt-in."
> — PropelAuth Blog, March 2025

### Remix

> "At the time of this writing, there aren't standard ways of testing components that have Remix code."
> — Remix Testing Documentation

**Translation:** Test loaders separately from components. Hope they integrate correctly. Rely on slow E2E tests.

### TanStack Router

> "The official docs don't mention testing at all"
> — GitHub Discussion #655

**Translation:** You're on your own. Create custom helpers. Reinvent the wheel for every project.

### The Universal E2E Crisis

**Across ALL frameworks:**
1. **Test Pollution** - Shared MSW handlers cause flaky tests
2. **Scattered Mocks** - Copy-paste across 50 test files
3. **Sequential Execution** - Can't parallelize (slow suites)
4. **App Restart Hell** - No runtime scenario switching

**Scenarist fixes all of this.**

---

## 1. Site Structure & Navigation

### Navigation Hierarchy

```
Scenarist Documentation
│
├── Introduction
│   ├── Overview (/) - "Testing Next.js, Remix, and TanStack Is Broken. Scenarist fixes it."
│   ├── Why Scenarist? - Framework-specific pain points
│   ├── Quick Start (Framework Selector: Next.js / Remix / Express)
│   ├── Installation
│   ├── Scenario Format - Complete structure and all features
│   ├── Default Mocks - Override behavior and fallback patterns
│   ├── Ephemeral Endpoints - Test-only activation and isolation
│   └── Endpoint APIs - GET/POST /__scenario__ reference
│
├── Framework Guides (PROMOTED - Consumer Priority)
│   ├── Next.js
│   │   ├── Why Testing Next.js Is Broken (Landing page with pain points)
│   │   ├── Pages Router
│   │   │   ├── Getting Started
│   │   │   ├── Configuration
│   │   │   ├── Testing Patterns
│   │   │   └── Examples
│   │   └── App Router
│   │       ├── Getting Started
│   │       ├── Configuration
│   │       ├── Testing Patterns
│   │       └── Examples
│   ├── Remix (Future)
│   │   ├── Why Testing Remix Is Broken
│   │   ├── Getting Started
│   │   ├── Configuration
│   │   └── Examples
│   ├── Express
│   │   ├── Getting Started
│   │   ├── Configuration
│   │   ├── Testing Patterns
│   │   └── Examples
│   └── TanStack Router (Future)
│       ├── Why Testing TanStack Is Broken
│       └── Getting Started
│
├── Core Concepts
│   ├── Scenarios & Variants
│   ├── Test Isolation (Test IDs)
│   ├── Mock Definitions
│   └── Runtime Scenario Switching
│
├── Features (Every page leads with pain → solution → how it works)
│   ├── Request Matching
│   │   ├── Overview ("The Problem: One Endpoint, Multiple Scenarios")
│   │   ├── Body Matching
│   │   ├── Header Matching
│   │   └── Query Parameter Matching
│   ├── Response Sequences
│   │   ├── Overview ("The Problem: Polling and Multi-Step Flows")
│   │   ├── Repeat Modes
│   │   └── Sequence Exhaustion
│   ├── Stateful Mocks
│   │   ├── Overview ("The Problem: Dynamic Backend State")
│   │   ├── State Capture
│   │   ├── State Injection
│   │   └── State Reset
│   └── Dynamic Responses
│       └── Feature Composition
│
├── Recipes
│   ├── Testing Patterns
│   │   ├── Parallel Test Execution ("10x Faster Test Suites")
│   │   ├── Isolated Test Suites ("Zero Flaky Tests")
│   │   ├── E2E Test Organization
│   │   └── Playwright Integration
│   ├── Common Use Cases
│   │   ├── Authentication Flows
│   │   ├── Payment Processing
│   │   ├── Polling/Long-Running Operations
│   │   ├── Error Scenarios ("No More App Restarts")
│   │   ├── Rate Limiting
│   │   └── Multi-Step Workflows
│   └── Advanced Patterns
│       ├── Scenario Chaining
│       ├── Conditional Mocks
│       ├── State Management Strategies
│       └── Performance Optimization
│
├── API Reference
│   ├── Core
│   │   ├── Types
│   │   ├── Ports
│   │   ├── ScenarioManager
│   │   ├── ResponseSelector
│   │   ├── StateManager
│   │   └── SequenceTracker
│   ├── MSW Adapter
│   │   ├── createScenaristHandler
│   │   ├── URL Matching
│   │   └── Handler Conversion
│   ├── Express Adapter
│   │   ├── createScenarist
│   │   ├── Middleware
│   │   ├── Endpoints
│   │   └── Configuration
│   ├── Next.js Adapters
│   │   ├── Pages Router API
│   │   ├── App Router API
│   │   └── Configuration
│   └── Schemas
│       ├── ScenarioDefinition
│       ├── MockDefinition
│       ├── ResponseDefinition
│       └── Validation
│
├── Contributing (DEMOTED - Architecture moved here)
│   ├── Development Setup
│   ├── Architecture Overview
│   │   ├── Hexagonal Design
│   │   ├── Ports & Adapters
│   │   ├── Dependency Injection
│   │   ├── Serialization Principle
│   │   └── Testing Strategy
│   ├── Architecture Decisions (ADRs)
│   ├── Testing Standards
│   ├── Code Style Guide
│   ├── Building Custom Adapters
│   └── Pull Request Process
│
└── Resources
    ├── Examples Repository
    ├── Video Tutorials (future)
    ├── Blog Posts (future)
    ├── FAQ
    ├── Troubleshooting
    ├── Migration Guides
    └── Changelog
```

### Navigation Strategy

**Primary Navigation (Sidebar):**
- **Pain-first ordering**: Framework Guides BEFORE Core Concepts
- Progressive disclosure: Quick Start → Framework Guide → Features → Recipes → Reference
- Framework selector widget on homepage
- Architecture hidden in Contributing section

**Quick Navigation:**
- Hero section CTAs: "Fix Next.js Testing →", "Fix Remix Testing →", "Try Quick Start →"
- Problem-oriented search: "How do I test authentication?"
- Framework-specific landing pages for SEO

**Cross-References:**
- Bidirectional links between related concepts
- "See also" sections at page bottoms
- Breadcrumbs for context

---

## 2. Content Strategy

### Homepage: Lead With Pain

**Hero Section:**

```markdown
# Testing Next.js, Remix, and TanStack Is Broken.

**Scenarist fixes it.**

Modern frameworks make building features easy but testing them painful:
- ❌ Flaky tests from shared MSW handlers (test pollution)
- ❌ Sequential execution (tests can't run in parallel)
- ❌ Scattered mocks across 50 test files
- ❌ Restarting your app to test different scenarios

**Scenarist eliminates E2E testing's biggest pain points in any framework.**

[Fix Next.js Testing →] [Fix Remix Testing →] [Try Quick Start →]
```

**The Pain Section (Before/After):**

```markdown
## What Framework Docs Won't Tell You

### Next.js App Router

> "Since async Server Components are new to the React ecosystem, some tools do not fully support them. In the meantime, we recommend using End-to-End Testing over Unit Testing for async components."
> — Next.js Official Docs

**Translation:** Jest doesn't work. Spawn a new Next.js instance per test. Hope it works.

### Remix

> "At the time of this writing, there aren't standard ways of testing components that have Remix code."
> — Remix Testing Docs

**Translation:** Test loaders separately from components. Hope they integrate correctly.

### TanStack Router

> "The official docs don't mention testing at all"
> — TanStack Router Developers

**Translation:** You're on your own. Create custom helpers. Reinvent the wheel.

---

**Without Scenarist:**
```typescript
// ❌ Global MSW handlers - shared state
beforeAll(() => {
  server.use(http.get('/api/user', () => HttpResponse.json({ role: 'admin' })));
});

// Tests interfere with each other
it('test 1: admin view', () => {/* passes */});
it('test 2: guest view', () => {/* FAILS - sees admin! */});

// Must run sequentially (slow)
// Must restart app to test errors (painful)
// Mocks duplicated across 50 files (brittle)
```

**With Scenarist:**
```typescript
// ✅ Isolated scenarios - no shared state
it('test 1: admin view', async () => {
  await setScenario('admin-user', { testId: 'test-1' });
  // Test with admin scenario
});

it('test 2: guest view', async () => {
  await setScenario('guest-user', { testId: 'test-2' });
  // Test with guest scenario - no interference!
});

// Tests run in parallel (10x faster)
// Switch scenarios at runtime (no restarts)
// Scenarios reusable (define once, use everywhere)
```

**Impact:**
- ✅ Tests run in parallel: **10x faster**
- ✅ Zero flaky tests: **test isolation**
- ✅ Clear scenarios: **self-documenting**
- ✅ Runtime switching: **no app restarts**
```

**Framework Support Section:**

```markdown
## Works With Your Framework

Scenarist is built on MSW but adds the test isolation and scenario management your framework forgot.

**Next.js** (Pages Router, App Router)
- Test Route Handlers without spawning new Next.js instances
- Parallel tests work out of the box
- No beta MSW setup required
- [Fix Next.js Testing →]

**Remix** (Coming Soon)
- Test loaders/actions with reusable scenarios
- Integration tests without complex client/server mocking
- Fast unit tests + targeted E2E tests
- [Fix Remix Testing →]

**Express**
- Test middleware and routes with declarative scenarios
- Parallel test execution
- Runtime scenario switching for manual testing
- [Get Started →]

**TanStack Router** (Coming Soon)
- Standard router testing setup
- Reusable router scenarios
- Fast parallel execution

**Build Your Own Adapter**
- Framework-agnostic core
- Hexagonal architecture
- Swap frameworks, swap storage (in-memory → Redis)
- [Contributing Guide →]
```

### Content Migration Plan

**From Existing Docs:**

| Source | Destination | Action |
|--------|-------------|--------|
| `core-functionality.md` | Core Concepts section | Split into Scenarios, Test Isolation, Mock Definitions |
| `stateful-mocks.md` | Features → Stateful Mocks | Migrate with pain-first intro |
| `api-reference-state.md` | API Reference → StateManager | Migrate, add interactive examples |
| `testing-guidelines.md` | Recipes → Testing Patterns | Reorganize by use case |
| Package READMEs (quick starts) | Framework Guides | Extract getting started sections |
| `docs/adrs/` | Contributing → ADRs | Direct migration, add navigation |
| `templates/ADAPTER_README_TEMPLATE.md` | Contributing → Custom Adapters | Adapt for docs site |

**New Content to Create:**

1. **Framework Landing Pages (SEO Priority):**
   - `/docs/nextjs` - "Why Testing Next.js Is Broken" + Quick Start
   - `/docs/remix` - "Why Testing Remix Is Broken" + Quick Start
   - `/docs/express` - Express testing pain + Quick Start

2. **Pain-First Feature Pages:**
   - Every page follows: Problem → Solution → How It Works
   - Real quotes from developers (GitHub, Stack Overflow)
   - Before/after code examples

3. **Recipes (Copy-Paste Ready):**
   - 15-20 common use case recipes
   - Start with "The Problem" section
   - Show Scenarist solution
   - Include full working code

4. **Interactive Elements:**
   - Live code examples (Stackblitz/CodeSandbox)
   - Scenario visualizer (diagram showing state/sequences)
   - Configuration builder (interactive form)

### Content Priorities (Writing Order)

**Phase 1: Essential (Week 1)**
- Homepage (pain-first with framework quotes)
- Why Scenarist? (framework-specific pain sections)
- Quick Start with framework selector
- Installation (all frameworks)
- Framework Guide: Next.js Pages Router → Getting Started
- Framework Guide: Express → Getting Started

**Phase 2: Framework Coverage (Week 2)**
- Framework Guide: Next.js App Router → Getting Started
- Landing Page: Why Testing Next.js Is Broken
- Landing Page: Why Testing Express/Node Is Broken
- Core Concepts: Scenarios & Variants
- Core Concepts: Test Isolation

**Phase 3: Features (Week 3)**
- Core Concepts: Mock Definitions
- Features: Request Matching (all subpages, pain-first)
- Features: Response Sequences (all subpages, pain-first)
- Features: Stateful Mocks (all subpages, pain-first)
- Recipes: 5 most common use cases

**Phase 4: API Reference (Week 4)**
- API Reference: Core (all subpages)
- API Reference: Adapters (all subpages)
- API Reference: Schemas

**Phase 5: Recipes & Advanced (Week 5)**
- Recipes: Remaining 10-15 use cases
- Framework Guides: Configuration pages
- Framework Guides: Testing Patterns pages
- Troubleshooting guide
- FAQ

**Phase 6: Contributing (Week 6)**
- Architecture documentation (hexagonal design)
- Contributing guides
- ADR migration with context
- Custom Adapter building guide
- Testing standards

**Phase 7: Polish & Launch (Week 7)**
- Advanced recipes
- Migration guides
- Performance optimization
- Video tutorials (if applicable)
- Final accessibility audit
- SEO optimization

---

## 3. Documentation Testing & Quality Standards

### TDD for Documentation Sites: A Different Standard

**IMPORTANT:** Documentation sites have different testing requirements than library code. While library code follows strict "every line has a test" TDD, documentation sites require a more pragmatic approach.

#### What Makes Documentation Different

Documentation sites generate static HTML at build time. Their "behavior" is fundamentally different from application code:

| Library Code | Documentation Site |
|--------------|-------------------|
| Has complex runtime behavior | Generates static HTML |
| User tests depend on correctness | User reads content |
| Bugs cascade to user codebases | Bugs cause confusion, not failures |
| 100% coverage required | Build validation required |

#### Testing Requirements for Documentation

Documentation sites **require** the following quality gates:

**✅ REQUIRED: Build Validation**
- Build must succeed on every commit
- CI enforces build success
- Manual verification of build output
- Catches syntax errors, broken imports, invalid frontmatter

**✅ REQUIRED: Link Integrity**
- No broken internal links (404s)
- External links should be monitored (but can break over time)
- Can use simple link checker script (doesn't require Vitest)

**✅ REQUIRED: Content Quality**
- Code examples must be accurate and copy-paste ready
- Examples must include all required fields
- Examples should match real type signatures
- Manual review of examples before merge

**❌ NOT REQUIRED: Comprehensive Test Suites**
- No need to test "page contains text"
- No need to test navigation structure
- No need to test Astro/Starlight internals
- No need for Vitest setup unless adding dynamic features

#### What This Means for PRs

**PR must demonstrate:**
1. ✅ Build succeeds (`pnpm build` passes)
2. ✅ Pages render correctly (manual QA or screenshots)
3. ✅ Code examples are complete and accurate
4. ✅ No broken internal links (manual check or link checker script)

**PR does NOT need:**
1. ❌ Vitest test suite for static content
2. ❌ Tests for "page contains expected text"
3. ❌ Tests for sidebar navigation structure
4. ❌ Tests for Astro configuration

#### When Documentation DOES Need Tests

Add automated tests (Vitest/Playwright) when documentation includes:

- **Interactive components** (live code editors, interactive examples)
- **Search functionality** (if custom, not Starlight default)
- **Dynamic content** (API-driven content, user preferences)
- **Complex client-side logic** (calculators, configurators)

For static content (MDX files, navigation, examples), build validation and manual QA are sufficient.

#### Code Example Quality

All code examples in documentation must be:

1. **Complete** - Include all required fields from types
2. **Accurate** - Match actual type signatures from library
3. **Copy-paste ready** - Should work if user copies directly
4. **Commented** - Explain what's happening when not obvious

**❌ Bad Example:**
```typescript
const scenarios = {
  premium: {
    mocks: [...]  // Missing required fields, undefined variables
  }
};
```

**✅ Good Example:**
```typescript
import type { ScenarioDefinition } from '@scenarist/core';

const products = [{ id: 1, name: 'Premium Product' }];

export const scenarios: Record<string, ScenarioDefinition> = {
  premium: {
    id: 'premium',           // Required field
    name: 'Premium Scenario', // Required field
    mocks: [
      {
        method: 'GET',
        url: '/api/products',
        response: { status: 200, body: { products } }
      }
    ]
  }
};
```

#### AI PR Review Guidance

When reviewing documentation PRs, AI agents should:

**✅ DO check:**
- Build succeeds
- Code examples are complete
- Code examples match real types
- No obvious broken links in new content
- Content addresses stated goals

**❌ DON'T require:**
- Comprehensive test suites for static content
- Tests that verify text presence
- Tests that verify navigation structure
- Vitest setup for static MDX files

**Remember:** Documentation is about communicating effectively with humans. The quality bar is "does this help developers solve their problems?" not "does every line have a test?"

---

## 4. Implementation Plan

### Phase 1: Astro + Starlight Setup (Week 0)

**Tasks:**

1. **Initialize Astro + Starlight Project**
   ```bash
   cd apps/
   pnpm create astro@latest docs -- --template starlight
   ```

2. **Configure Starlight**
   ```typescript
   // astro.config.mjs
   import { defineConfig } from 'astro/config';
   import starlight from '@astrojs/starlight';

   export default defineConfig({
     integrations: [
       starlight({
         title: 'Scenarist',
         description: 'Fix E2E testing for Next.js, Remix, and TanStack',
         logo: {
           src: './src/assets/logo.svg',
         },
         social: {
           github: 'https://github.com/username/scenarist',
         },
         sidebar: [
           // Navigation structure from Section 1
         ],
         customCss: [
           './src/styles/custom.css',
         ],
       }),
     ],
   });
   ```

3. **Set Up Custom Styling**
   - Brand colors
   - Typography
   - Code block styling
   - Dark mode

4. **Configure Search**
   - Starlight includes built-in search (Pagefind)
   - Verify search indexing works

5. **Set Up Deployment**
   - Netlify or Vercel
   - Auto-deploy from `main` branch
   - Custom domain (scenarist.io)

**Deliverable:** Empty Starlight site deployed with navigation structure

---

### Phase 2: Essential Content (Week 1)

**Priority:** Get developers productive immediately

**Tasks:**

1. **Homepage (Pain-First)**
   - "Testing Next.js, Remix, and TanStack Is Broken" hero
   - Framework quotes (Next.js, Remix, TanStack)
   - Before/after code example
   - Framework support cards
   - CTAs to framework-specific landing pages

2. **Why Scenarist?**
   - Framework-by-framework pain points
   - Real developer quotes
   - "Without Scenarist" vs "With Scenarist" code examples
   - Impact metrics (10x faster, zero flakes)

3. **Quick Start (Framework Selector)**
   - Next.js Pages tab
   - Next.js App tab
   - Express tab
   - Copy-paste ready code
   - Clear next steps

4. **Installation**
   - Package installation for each framework
   - Peer dependencies (MSW explicitly listed)
   - TypeScript setup

5. **Introduction → Scenario Format**
   - Complete scenario structure (id, name, description, mocks, variants)
   - Mock definition anatomy (method, url, match, response/sequence, captureState)
   - Response structure (status, body, headers, delay)
   - Sequence structure (responses array, repeat modes: last/cycle/none)
   - Match criteria (body partial match, headers/query exact match)
   - Specificity-based selection algorithm
   - State capture with path expressions (body.field, headers.field, query.field)
   - State injection with template syntax ({{state.key}})
   - Array append syntax (stateKey[])
   - Serializable nature and version control benefits

6. **Introduction → Default Mocks**
   - The 'default' scenario requirement (enforced via schema)
   - How default scenario works as baseline
   - Override behavior (other scenarios override default by URL)
   - Fallback pattern (no match criteria = fallback mock)
   - Specificity-based selection (more specific mocks win)
   - First-fallback-wins tiebreaker
   - Test ID isolation (different tests, different scenarios)
   - Default test ID when header absent

7. **Introduction → Ephemeral Endpoints**
   - What ephemeral endpoints are (test-only activation)
   - The `enabled` flag controls endpoint availability
   - When enabled: endpoints active, middleware extracts IDs, MSW registered
   - When disabled: endpoints return 404, middleware no-ops, zero overhead
   - Test ID extraction mechanism (x-scenarist-test-id header, configurable)
   - Unique test IDs enable parallel execution
   - How test IDs route to correct scenarios
   - Production safety guarantees

8. **Introduction → Endpoint APIs**
   - POST /__scenario__ - Switch scenario API
     - Request format: {scenario: string, variant?: string}
     - Response format: {success: boolean, testId: string, scenarioId: string, variant?: string}
     - Error responses: 400 (validation), 404 (not found), 500 (internal)
   - GET /__scenario__ - Get active scenario API
     - Response format: {testId: string, scenarioId: string, scenarioName?: string, variantName?: string}
     - Error response: 404 (no active scenario)
   - Test ID extraction from request context
   - Validation with ScenarioRequestSchema
   - ScenarioManager coordination
   - Framework-specific implementations (Express vs Next.js App vs Next.js Pages)

9. **Framework Guide → Next.js Pages Router → Getting Started**
   - Complete setup walkthrough
   - Scenario registration
   - First test
   - Runtime scenario switching demo

10. **Framework Guide → Express → Getting Started**
   - Complete setup walkthrough
   - Middleware integration
   - Scenario endpoints
   - First test

**Quality Gate:**
- All code examples tested in real apps
- Navigation works
- Search works
- Mobile responsive
- Accessibility audit passes

**Deliverable:** User can get started with Next.js or Express in <10 minutes

---

### Phase 3: Framework Coverage (Week 2)

**Tasks:**

1. **Framework Guide → Next.js App Router → Getting Started**
   - App Router specific setup
   - Route Handler testing
   - Scenario registration

2. **Landing Page: `/docs/nextjs`**
   - "Why Testing Next.js Is Broken"
   - RSC testing pain points
   - Official docs quotes
   - How Scenarist fixes it
   - CTA to Getting Started

3. **Landing Page: `/docs/express`**
   - Express/Node testing pain
   - How Scenarist fixes it
   - CTA to Getting Started

4. **Core Concepts → Scenarios & Variants**
   - What scenarios are
   - Why scenarios eliminate test pollution
   - Variants explanation
   - Organization patterns

5. **Core Concepts → Test Isolation**
   - Test ID concept
   - How isolation works
   - Parallel execution benefits
   - Before/after comparison

**Deliverable:** Framework-specific landing pages for SEO, complete Next.js coverage

---

### Phase 4: Features (Week 3)

**Every feature page follows: Problem → Solution → How It Works**

**Tasks:**

1. **Core Concepts → Mock Definitions**
   - Structure of mock definitions
   - Serializable nature
   - Version control benefits

2. **Features → Request Matching → Overview**
   - Pain: "One Endpoint, Multiple Scenarios"
   - Without Scenarist: Duplicated mocks
   - With Scenarist: Match criteria
   - How It Works: Specificity algorithm

3. **Features → Request Matching → Body/Headers/Query**
   - Pain-first for each type
   - Use cases (tiered access, A/B testing)
   - Code examples

4. **Features → Response Sequences → Overview**
   - Pain: "Polling and Multi-Step Flows"
   - Without Scenarist: Complex test orchestration
   - With Scenarist: Declarative sequences
   - How It Works: Position tracking

5. **Features → Stateful Mocks → Overview**
   - Pain: "Dynamic Backend State"
   - Without Scenarist: Global state management
   - With Scenarist: State capture/injection
   - How It Works: Template replacement

6. **Recipes: Top 5 Use Cases**
   - Authentication Flows (login → dashboard)
   - Payment Processing (authorize → capture)
   - Polling (pending → complete)
   - Error Scenarios (no restarts!)
   - Rate Limiting

**Deliverable:** Complete feature reference, top 5 recipes

---

### Phase 5: API Reference (Week 4)

**Tasks:**

1. **API Reference → Core**
   - Types, Ports, ScenarioManager, ResponseSelector, StateManager, SequenceTracker
   - Auto-generated from TypeScript (if possible)
   - Interactive examples

2. **API Reference → Adapters**
   - MSW, Express, Next.js (Pages + App)
   - Configuration options
   - Handler conversion details

3. **API Reference → Schemas**
   - ScenarioDefinition, MockDefinition, ResponseDefinition
   - Validation rules
   - Zod schema examples

**Deliverable:** Complete API reference for all packages

---

### Phase 6: Recipes & Contributing (Week 5-6)

**Tasks:**

1. **Recipes → Remaining 10-15 Use Cases**
   - Shopping cart flows
   - Checkout processes
   - Multi-step wizards
   - Conditional workflows
   - State management strategies

2. **Framework Guides → Configuration**
   - Next.js Pages/App configuration options
   - Express configuration
   - Test ID header customization

3. **Framework Guides → Testing Patterns**
   - Organizing test suites
   - Parallel execution setup
   - Playwright integration patterns

4. **Contributing → Architecture Overview**
   - Hexagonal Design (moved from Core Concepts)
   - Ports & Adapters
   - Dependency Injection
   - Serialization Principle

5. **Contributing → Building Custom Adapters**
   - Step-by-step guide
   - Template usage
   - Testing your adapter

6. **Troubleshooting & FAQ**

**Deliverable:** Comprehensive recipe library, contributor documentation

---

### Phase 7: Polish & Launch (Week 7)

**Tasks:**

1. **Advanced Recipes**
   - Performance optimization
   - Scenario chaining
   - Complex state management

2. **Migration Guides** (if applicable)

3. **Final Quality Checks**
   - Lighthouse audit (>90 all metrics)
   - Accessibility WCAG 2.1 AA
   - Broken link check
   - Mobile responsiveness
   - Search indexing verification

4. **SEO Optimization**
   - Meta descriptions
   - OpenGraph tags
   - Sitemap generation
   - Framework-specific keyword targeting

**Deliverable:** Production-ready documentation site

---

## 4. Writing Guidelines

### Tone & Voice

**Primary Tone:** Empathetic, competent, honest

**Characteristics:**
- **Empathetic** - "We know testing Next.js is painful"
- **Direct** - Get to the point quickly
- **Practical** - Show working code, not theory
- **Honest** - Acknowledge trade-offs, don't oversell
- **Encouraging** - Build confidence, celebrate progress

### Page Template: Pain → Solution → How It Works

**Every feature page follows this pattern:**

```markdown
# Feature Name

## The Problem [Framework] Developers Face

[Specific pain point with real quote/example]

**Without Scenarist:**
```typescript
// ❌ Before: The painful way
[Code showing current pain]
```

## How Scenarist Solves It

**With Scenarist:**
```typescript
// ✅ After: The Scenarist way
[Code showing solution]
```

**Impact:**
- ✅ Benefit 1
- ✅ Benefit 2
- ✅ Benefit 3

## How It Works

[Technical details, algorithm explanation, etc.]

**API Reference:** [Link to detailed API docs]

## See Also

- [Related Feature 1]
- [Related Feature 2]
- [Recipe Using This Feature]
```

### Code Example Standards

**Every code example must be:**

1. **Complete** - Copy-paste ready, no placeholders
2. **Tested** - Verified to work (extract from real examples)
3. **Minimal** - Only code relevant to concept being taught
4. **Explained** - Key parts have inline comments
5. **Consistent** - Same style throughout docs

### Accessibility Requirements

**WCAG 2.1 AA Compliance:**

1. **Color Contrast** - Text: 4.5:1 minimum
2. **Alt Text** - All diagrams have descriptive alt text
3. **Headings** - Logical hierarchy (H1 → H2 → H3)
4. **Links** - Descriptive link text (no "click here")
5. **Code Blocks** - Syntax highlighted for readability
6. **Navigation** - Skip to content link, breadcrumbs
7. **Interactive Elements** - Keyboard navigable, focus indicators

---

## 5. Success Metrics

### Quantitative Metrics

**Documentation Quality:**
- Lighthouse score >90 (Performance, Accessibility, Best Practices, SEO)
- Zero broken links (automated check)
- All code examples pass linting/type-checking
- Search indexing covers >95% of content

**Framework-Specific Conversions:**
- "Fix Next.js Testing" page → Quick Start conversion >40%
- "Fix Remix Testing" page → Quick Start conversion >40%
- "Fix Express Testing" page → Quick Start conversion >40%

**Search Rankings (3-6 months post-launch):**
- Rank top 10 for "Next.js App Router testing problems"
- Rank top 10 for "Remix testing challenges"
- Rank top 10 for "MSW test pollution"
- Rank top 10 for "E2E testing Next.js parallel"

**User Engagement:**
- Time on page >2 minutes (indicates reading)
- Bounce rate <40% (indicates value)
- Search usage >30% of sessions (indicates discovery)
- "Was this helpful?" >70% positive

**Adoption Metrics:**
- npm downloads increase >50% post-launch
- GitHub stars increase >100 post-launch
- "Docs" link clicks from README >20% of visitors

### Qualitative Metrics

**Framework Developer Quotes:**
- "Finally, Next.js testing that doesn't suck"
- "Scenarist saved my Remix test suite"
- "No more test pollution!"

**Social Proof:**
- Mentions in framework communities (Next.js Discord, Remix Discord)
- Blog posts from framework developers
- Conference talk mentions
- Twitter/X mentions with positive sentiment

**User Feedback:**
- Collect feedback via "Was this helpful?" + GitHub discussions
- Track common questions (add to FAQ)
- Monitor GitHub issues for documentation gaps

**Continuous Improvement:**
- Monthly analytics review (top pages, search queries, bounce rate)
- Quarterly content updates (new recipes, improved pages)
- Yearly full audit (accessibility, performance, competitor analysis)

---

## 6. Key Principles Summary

### Core Principles

1. **Lead With Pain** - Every page starts with the problem developers actually face
2. **Framework-Specific** - Speak to Next.js/Remix/TanStack developers directly
3. **Before/After** - Show the transformation, not just features
4. **Real Quotes** - Use actual developer frustrations from docs/GitHub/Stack Overflow
5. **Architecture Last** - Move hexagonal design to Contributors section

### The Shift

**From:** "Here's our clever architecture"
**To:** "Here's your pain point. Here's how we fix it."

**From:** "Scenarist uses ports and adapters"
**To:** "Stop restarting your app to test error scenarios"

**From:** "Hexagonal design enables flexibility"
**To:** "Run 50 tests in 5 seconds instead of 50 seconds"

### Why It Matters

Developers don't adopt libraries because of clever architecture. They adopt libraries because **their current solution is painful and your solution is better**.

Scenarist solves REAL pain:
- Next.js App Router testing is broken
- Remix testing is an afterthought
- TanStack Router testing is undocumented
- MSW alone causes test pollution
- E2E tests are slow and brittle

**Our documentation must lead with this pain, not with hexagonal architecture.**

---

## 7. Documentation Writing Principles (Session Learnings)

### Critical Principle: Accuracy Over Absolutism

**The Problem with "CAN'T" statements:**
During landing page iterations, we discovered that saying "unit tests CAN'T test server-side logic" is inaccurate and undermines credibility.

**The Reality:**
Unit tests CAN test server-side logic, but it's painful and risky:
- Requires extensive code-level mocking (sessions, auth, request objects, middleware)
- Mocks create a gap between how you test vs. how code actually runs in production
- Bugs can hide in mocks and only surface when users go through real journeys
- Testing integrated flows requires complex test setup

**The Correct Framing:**
```markdown
❌ BAD: "Unit tests can't test server-side context"
✅ GOOD: "Unit tests CAN test server-side logic, but it's painful and risky"

❌ BAD: "Unit tests don't cover HTTP integration"
✅ GOOD: "Unit tests require extensive mocking at the code level, creating distance from production reality"
```

**Key Insight:**
Your code runs as part of user journeys with real sessions, auth context, and middleware in production—but you're testing it either in isolation (unit tests) or only for happy path (browser tests). Browser-based testing with real server execution is closer to how code actually runs.

### No Marketing Fluff

**Remove percentage claims:**
- Don't use "77% boilerplate reduction" or similar statistics
- Don't use "10x faster" without context
- Don't use hyperbolic language

**Let code speak for itself:**
```markdown
❌ BAD:
**Code Reduction: 77%** - From 9 lines to 2 lines

✅ GOOD:
**Without helpers:**
[9 lines of code]

**With helpers:**
[2 lines of code]
```

**Why this matters:**
Marketing percentages don't add substance. Developers can see the difference in code examples without needing numbers attached. Credibility comes from showing, not telling.

### Landing Page vs. Docs Separation

**Landing Page = High-Level Bullet Points:**
```markdown
**Key features:**
- **Ephemeral endpoints:** Scenario switching only active when `enabled: true`
- **Test isolation:** Unique test IDs enable parallel execution
- **Type-safe helpers:** Playwright integration with autocomplete
- **Framework-agnostic:** Express, Next.js, Fastify, Hono, Remix, SvelteKit
```

**Docs Pages = Detailed Explanations:**
```markdown
## How It Works: Ephemeral Endpoints & Test Isolation

### Ephemeral Scenario Endpoints

Scenarist creates **ephemeral endpoints** that only exist when testing is enabled...

[Full code examples]
[Technical details]
[Under the hood explanations]
```

**Why this matters:**
- Landing page readers want quick overview to decide if tool is relevant
- Docs readers are already committed and want deep technical understanding
- Long explanations on landing page → high bounce rate
- Bullet points on docs pages → readers feel shortchanged

**Rule:** If explanation requires more than 3-4 lines, it belongs in docs, not landing page.

### The Realistic Testing Gap Framing

**Most teams actually do:**
- Unit tests (Jest/Vitest) → Test functions in isolation
- Browser tests (Playwright/Cypress) → Test happy path only

**The critical gap:**

Unit tests CAN test server-side logic, but:
- Requires extensive code-level mocking (sessions, auth, request objects)
- Mocks create distance from production reality
- Easy to introduce bugs that only surface in real user journeys

Browser tests capture real execution, but:
- Limited to 1-2 scenarios (happy path)
- Testing multiple scenarios requires complex setup OR server restarts

**The reality developers face:**
Server-side code executes as part of user journeys with real sessions, auth context, and middleware in production. You're testing it either in isolation (unit tests with mocks) or only for the happy path (browser tests).

**How Scenarist fills the gap:**
Test all scenarios (error cases, edge cases, different user states) through real HTTP requests with real server-side execution (sessions, middleware, Server Components), while mocking only external APIs.

**Why this framing works:**
- Acknowledges unit tests ARE valuable
- Explains the REAL problem: mocking creates testing/reality gap
- Shows browser testing is closer to production
- Positions Scenarist as removing the mocking gap

### Framework-Agnostic Positioning

**The Mistake:**
Early documentation positioned Scenarist as primarily for Next.js/Server Components.

**The Reality:**
Scenarist works with ANY Node.js framework:
- Express, Hono, Fastify (pure backend APIs)
- Next.js (Pages Router + App Router)
- Remix, SvelteKit (future)

**Server Components is ONE use case among many:**
- API routes (all frameworks)
- Middleware chains (all frameworks)
- Validation logic (all frameworks)
- SSR (Next.js, Remix, SvelteKit)
- Server Components (Next.js App Router)
- Business logic (all frameworks)

**Correct opening:**
```markdown
Whether you're building with **Express**, **Hono**, **Fastify**, **Next.js**, or **Remix**...
```

**Not:**
```markdown
Test Next.js Server Components without Jest...
```

**Why this matters:**
Narrowing to Next.js alienates Express/Hono/Fastify developers who are majority of Node.js ecosystem.

### Ephemeral Endpoints Explanation (Docs, Not Landing)

**Belongs in docs pages (why-scenarist.md, not landing page):**

Three key concepts to explain:
1. **Ephemeral endpoints** - `enabled` flag controls activation
2. **Test isolation** - Unique test IDs via `crypto.randomUUID()`
3. **Playwright helpers** - Automatic test ID management

**Landing page (bullet points):**
```markdown
- **Ephemeral endpoints:** Scenario switching only active when `enabled: true` (zero production overhead)
- **Test isolation:** Unique test IDs enable parallel execution without interference
```

**Docs page (full explanation):**
```markdown
## How It Works: Ephemeral Endpoints & Test Isolation

### Ephemeral Scenario Endpoints

Scenarist creates **ephemeral endpoints** that only exist when testing is enabled...

**What the `enabled` flag controls:**
- When `enabled: true` (test mode): Endpoints active, middleware extracts IDs, MSW registered
- When `enabled: false` (production): Endpoints return 404, middleware no-ops, zero overhead

[Code examples]
[Technical details]
```

**Why this matters:**
Technical details like "how enabled flag works" are valuable but too detailed for landing page. Landing page shows WHAT (ephemeral endpoints exist), docs show HOW (enabled flag mechanism).

### Content Hierarchy Decision Framework

**When writing documentation, ask:**

1. **Is this information essential for decision-making?**
   - YES → Landing page (bullet point)
   - NO → Docs page (detailed explanation)

2. **Can this be explained in 1-2 lines?**
   - YES → Landing page
   - NO → Docs page

3. **Does this explain HOW it works technically?**
   - YES → Docs page
   - NO → Could be landing page

4. **Would a developer skip this if they're just evaluating?**
   - YES → Docs page
   - NO → Landing page

**Examples:**

| Content | Landing Page? | Docs Page? | Rationale |
|---------|---------------|------------|-----------|
| "Ephemeral endpoints (zero production overhead)" | ✅ YES | ✅ YES (detailed) | Essential decision factor + needs technical explanation |
| "Test isolation via unique IDs" | ✅ YES | ✅ YES (detailed) | Essential benefit + needs mechanism explanation |
| "How `enabled` flag controls endpoints" | ❌ NO | ✅ YES | Technical detail, not decision factor |
| "Under the hood: test ID routing" | ❌ NO | ✅ YES | Implementation detail |
| "Type-safe scenario IDs" | ✅ YES | ✅ YES (detailed) | Developer experience win + needs examples |
| "Code reduction: 77%" | ❌ NO | ❌ NO | Marketing fluff, remove entirely |

### Writing Checklist for Every Page

**Before publishing any documentation page, verify:**

✅ **Accuracy:**
- [ ] No "CAN'T" statements that should be "CAN, but painful"
- [ ] Claims about unit tests acknowledge they work but are painful
- [ ] Testing gap accurately described (mocking creates distance, not impossibility)

✅ **No Marketing Fluff:**
- [ ] No percentage claims without context
- [ ] No "X times faster" without explanation
- [ ] Code comparisons speak for themselves

✅ **Correct Content Level:**
- [ ] Landing page has only bullet points and high-level overview
- [ ] Technical details and long explanations are in docs pages
- [ ] Each piece of content is in appropriate location

✅ **Framework-Agnostic:**
- [ ] Express, Hono, Fastify mentioned alongside Next.js
- [ ] Server Components presented as one use case, not THE use case
- [ ] Examples show multiple frameworks when relevant

✅ **Code Examples:**
- [ ] All code examples are complete and copy-paste ready
- [ ] No placeholders or undefined variables
- [ ] Examples match real type signatures
- [ ] Comments explain non-obvious parts

✅ **Realistic Testing Gap:**
- [ ] Acknowledges unit tests are valuable
- [ ] Explains mocking creates testing/reality gap
- [ ] Shows browser testing closer to production
- [ ] Positions Scenarist as removing mocking gap, not replacing unit tests

## 8. Next Steps

### Immediate Actions

1. **Review and approve this plan**
2. **Create Astro + Starlight site (Phase 1 - Week 0)**
3. **Write essential content (Phase 2 - Week 1)**
4. **Get early user feedback**
5. **Iterate through remaining phases**

### Key Deliverables

- **Week 0:** Deployed empty site with navigation
- **Week 1:** Essential pages (Homepage pain-first, Framework landing pages, Quick Start)
- **Week 2:** Complete framework coverage (Next.js Pages + App, Express)
- **Week 3:** Complete feature reference (pain-first) + top 5 recipes
- **Week 4:** Complete API reference
- **Week 5:** Recipe library + framework guides complete
- **Week 6:** Contributing documentation (architecture moved here)
- **Week 7:** Polish + launch

---

**Document Status:** APPROVED PLAN - Phase 2 Complete, Phase 3 In Progress
**Created:** 2025-11-08
**Last Updated:** 2025-11-13
**Current Phase:** 3 (Framework Coverage)
**Weeks Remaining:** ~3 weeks to v1.0
**Research Sources:** Next.js docs, Remix docs, TanStack GitHub, PropelAuth blog, Stack Overflow

## Current Status (As of 2025-11-13)

### Completed Work

**Phase 1: Astro + Starlight Setup** ✅ COMPLETE
- Astro + Starlight site initialized at `apps/docs`
- Framework structure configured (Next.js, Express, future Remix/TanStack)
- Deployed at scenarist.io (Cloudflare Pages)
- Search enabled (Starlight built-in Pagefind)
- Dark mode configured
- Custom styling applied

**Phase 2: Essential Content** ✅ COMPLETE
- ✅ Homepage (pain-first approach)
- ✅ Why Scenarist page (framework-specific pain)
- ✅ Installation guide
- ✅ Quick Start with framework selector
- ✅ All Introduction pages:
  - ✅ Scenario Format (comprehensive structure)
  - ✅ Default Mocks (override behavior, fallback patterns)
  - ✅ Ephemeral Endpoints (test-only activation)
  - ✅ Endpoint APIs (GET/POST /__scenario__ reference)
- ✅ Framework Guide → Next.js App Router → Getting Started
- ✅ Framework Guide → Next.js Pages Router → Getting Started
- ✅ Framework Guide → Express → Getting Started
- ✅ Example apps for all three frameworks

**Documentation Fixes (PR #76)** ✅ COMPLETE
- Fixed incorrect API documentation (removed non-existent `createMSWHandler`)
- Corrected App Router endpoint path to use URL-encoded `%5F%5Fscenario%5F%5F`
- Added explanation of Next.js private folders
- Fixed FileTree component rendering
- Documented endpoint path configurability
- Converted appropriate files to MDX for component support

### Recent Achievements (November 2025)

**Technical Implementation (ALL COMPLETE):**
- ✅ All core packages COMPLETE (300+ tests passing)
- ✅ Next.js adapter with singleton pattern (ADR-0013, ADR-0014)
- ✅ Playwright helpers package (70% boilerplate reduction)
- ✅ Automatic default fallback feature (ADR-0011)
- ✅ Parallel test execution with unique test IDs (ADR-0016)
- ✅ All example apps with comprehensive test coverage
- ✅ Express, Next.js Pages Router, Next.js App Router adapters complete
- ✅ Hexagonal architecture fully implemented

**Documentation Progress:**
- ✅ Phase 2 introduction pages COMPLETE (Scenario Format, Default Mocks, Ephemeral Endpoints, Endpoint APIs)
- ✅ Framework-specific getting started guides COMPLETE (Next.js Pages, App Router, Express)
- ✅ Example app documentation COMPLETE (all three frameworks)
- ✅ API correctness fixes (PR #76)

### In Progress

**Phase 3: Framework Coverage** (Current Work - Week 4-5)
- [ ] Landing Page: Why Testing Next.js Is Broken (SEO priority)
- [ ] Landing Page: Why Testing Express/Node Is Broken
- [ ] Core Concepts: Scenarios & Variants
- [ ] Core Concepts: Test Isolation (parallel execution benefits)
- [ ] Core Concepts: Mock Definitions (serializable nature)

### Timeline Context

**Original Plan:** 7 weeks (Phases 0-7)
**Current Position:** Week 4-5 (Phase 3 in progress)
**Weeks Remaining:** ~3 weeks to v1.0 release

**Progress Summary:**
- ✅ Weeks 0-1: Phases 1-2 COMPLETE (Setup + Essential Content)
- 🚧 Weeks 2-3: Phase 3 IN PROGRESS (Framework Coverage)
- ⏳ Weeks 4-7: Phases 4-7 REMAINING (Features, API Reference, Recipes, Polish)

### Next Actions (Phase 3 Focus)

**Immediate Priorities:**

1. **Create Framework Landing Pages (SEO Critical)**
   - `/docs/frameworks/nextjs` - "Why Testing Next.js Is Broken"
   - `/docs/frameworks/express` - "Why Testing Express/Node Is Broken"
   - Use real developer quotes from official docs
   - Show before/after code comparisons

2. **Write Core Concepts Pages**
   - Scenarios & Variants (eliminate test pollution)
   - Test Isolation (parallel execution benefits)
   - Mock Definitions (serializable nature, version control)
   - Runtime Scenario Switching (no app restarts)

3. **Extract Real-World Examples**
   - From `apps/express-example/src/scenarios.ts`
   - From `apps/nextjs-app-router-example/lib/scenarios.ts`
   - From `apps/nextjs-pages-router-example/lib/scenarios.ts`
   - Use in landing pages and concept pages

4. **SEO Optimization for Framework Pages**
   - Meta descriptions targeting framework-specific pain
   - OpenGraph tags for social sharing
   - Keyword targeting: "Next.js testing problems", "Remix testing", etc.

**Success Criteria for Phase 3:**
- [ ] Framework landing pages deployed and indexed
- [ ] All core concepts documented
- [ ] Real-world examples showcased
- [ ] SEO metadata in place
- [ ] "Fix Next.js Testing" → Quick Start conversion >40%
