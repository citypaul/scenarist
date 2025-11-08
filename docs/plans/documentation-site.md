# Scenarist Documentation Plan: World-Class Astro + Starlight Site

## Executive Summary

This plan creates a gold-standard documentation site for Scenarist using Astro + Starlight. The documentation follows progressive disclosure principles, emphasizing value-first messaging and multiple entry points for different audiences. The structure supports discovery through problem-oriented navigation while maintaining comprehensive API coverage.

**Key Insight:** Scenarist solves a specific pain point (brittle E2E tests, test pollution, slow test suites). Documentation must lead with this value proposition, show concrete before/after examples, then guide users through adoption.

---

## 1. Site Structure & Navigation

### Navigation Hierarchy

```
Scenarist Documentation
│
├── Introduction
│   ├── Overview (/)
│   ├── Why Scenarist?
│   ├── Quick Start
│   └── Installation
│
├── Core Concepts
│   ├── Scenarios & Variants
│   ├── Test Isolation (Test IDs)
│   ├── Mock Definitions
│   ├── Hexagonal Architecture
│   └── Runtime Scenario Switching
│
├── Features
│   ├── Request Matching
│   │   ├── Overview
│   │   ├── Body Matching
│   │   ├── Header Matching
│   │   └── Query Parameter Matching
│   ├── Response Sequences
│   │   ├── Overview
│   │   ├── Repeat Modes
│   │   └── Sequence Exhaustion
│   ├── Stateful Mocks
│   │   ├── Overview
│   │   ├── State Capture
│   │   ├── State Injection
│   │   └── State Reset
│   └── Dynamic Responses
│       └── Feature Composition
│
├── Framework Guides
│   ├── Express
│   │   ├── Getting Started
│   │   ├── Configuration
│   │   ├── Testing Patterns
│   │   └── Examples
│   ├── Next.js (Pages Router)
│   │   ├── Getting Started
│   │   ├── Configuration
│   │   ├── Testing Patterns
│   │   └── Examples
│   ├── Next.js (App Router)
│   │   ├── Getting Started
│   │   ├── Configuration
│   │   ├── Testing Patterns
│   │   └── Examples
│   └── Custom Adapters
│       └── Building Your Own
│
├── Recipes
│   ├── Testing Patterns
│   │   ├── Parallel Test Execution
│   │   ├── Isolated Test Suites
│   │   ├── E2E Test Organization
│   │   └── Playwright Integration
│   ├── Common Use Cases
│   │   ├── Authentication Flows
│   │   ├── Payment Processing
│   │   ├── Polling/Long-Running Operations
│   │   ├── Error Scenarios
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
├── Architecture
│   ├── Hexagonal Design
│   ├── Ports & Adapters
│   ├── Dependency Injection
│   ├── Serialization Principle
│   └── Testing Strategy
│
├── Contributing
│   ├── Development Setup
│   ├── Architecture Decisions (ADRs)
│   ├── Testing Standards
│   ├── Code Style Guide
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
- Organized by journey stage (Intro → Concepts → Features → Guides → Recipes → Reference)
- Progressive disclosure (simple → complex)
- Framework guides grouped together
- API reference at end (lookup, not learning)

**Quick Navigation:**
- Hero section with primary CTAs ("Get Started", "See Examples", "Why Scenarist?")
- Problem-oriented search ("How do I test authentication?")
- "Popular Recipes" section on homepage
- Framework selector widget (Express/Next.js Pages/Next.js App)

**Cross-References:**
- Bidirectional links between related concepts
- "See also" sections at page bottoms
- Breadcrumbs for context
- "Next steps" navigation at guide endings

---

## 2. Content Strategy

### Content Migration Plan

**From Existing Docs:**

| Source | Destination | Action |
|--------|-------------|--------|
| `core-functionality.md` | Core Concepts section | Split into Scenarios, Test Isolation, Mock Definitions |
| `stateful-mocks.md` | Features → Stateful Mocks | Migrate with examples |
| `api-reference-state.md` | API Reference → StateManager | Migrate, add interactive examples |
| `testing-guidelines.md` | Recipes → Testing Patterns | Reorganize by use case |
| Package READMEs (quick starts) | Framework Guides | Extract getting started sections |
| `docs/plans/` | Archive or Contributing → ADRs | Context for contributors |
| `docs/adrs/` | Contributing → Architecture Decisions | Direct migration, add navigation |
| `templates/ADAPTER_README_TEMPLATE.md` | Contributing → Custom Adapters | Adapt for docs site |

**New Content to Create:**

1. **Marketing/Value Pages:**
   - Why Scenarist? (problem/solution)
   - Comparison with alternatives (MSW directly, test doubles, test databases)
   - Use case showcase (real-world scenarios)

2. **Learning Guides:**
   - Quick Start (5-minute win)
   - Tutorial: Building a Complete Test Suite
   - Understanding Hexagonal Architecture (for contributors)

3. **Recipes:**
   - 15-20 common use case recipes
   - Copy-paste ready code examples
   - Before/after comparisons

4. **Framework-Specific Content:**
   - Express: Complete setup + testing patterns
   - Next.js Pages: Complete setup + testing patterns
   - Next.js App: Complete setup + testing patterns
   - Custom Adapter: Step-by-step building guide

5. **Interactive Elements:**
   - Live code examples (Stackblitz/CodeSandbox)
   - Scenario visualizer (diagram showing state/sequences)
   - Configuration builder (interactive form)

### Content Priorities (Writing Order)

**Phase 1: Essential (Week 1)**
- Homepage (value proposition, quick links)
- Why Scenarist? (sell the concept)
- Quick Start (Express example, 5-minute win)
- Installation (all frameworks)
- Core Concepts: Scenarios & Variants
- Core Concepts: Test Isolation
- Framework Guides: Express → Getting Started

**Phase 2: Core Documentation (Week 2-3)**
- Core Concepts: Mock Definitions
- Features: Request Matching (all subpages)
- Features: Response Sequences (all subpages)
- Features: Stateful Mocks (all subpages)
- Framework Guides: Next.js Pages → Getting Started
- Framework Guides: Next.js App → Getting Started
- Recipes: 5 most common use cases

**Phase 3: Comprehensive Coverage (Week 4-5)**
- API Reference: Core (all subpages)
- API Reference: Adapters (all subpages)
- Recipes: Remaining 10-15 use cases
- Framework Guides: Configuration pages
- Framework Guides: Testing Patterns pages
- Troubleshooting guide
- FAQ

**Phase 4: Advanced & Contributors (Week 6)**
- Architecture documentation
- Contributing guides
- ADR migration with context
- Custom Adapter building guide
- Migration guides (if applicable)
- Advanced recipes

---

## 3. Implementation Plan

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
         description: 'Hexagonal MSW scenario management for E2E testing',
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
         components: {
           // Override default components if needed
         },
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
   - Custom domain (docs.scenarist.dev)

**Deliverable:** Empty Starlight site deployed with navigation structure

---

### Phase 2: Essential Content (Week 1)

**Priority:** Get developers productive immediately

**Tasks:**

1. **Homepage**
   - Value proposition
   - Before/after code example
   - Feature cards
   - Quick navigation table
   - CTAs to Quick Start

2. **Why Scenarist?**
   - Problem statement
   - Comparison with alternatives
   - Trade-offs
   - Real-world impact example

3. **Quick Start**
   - Express tab (primary)
   - Next.js Pages tab
   - Next.js App tab
   - Copy-paste ready code
   - Clear next steps

4. **Installation**
   - Package installation for each framework
   - Peer dependencies
   - TypeScript setup

5. **Core Concepts → Scenarios & Variants**
   - What scenarios are
   - Why scenarios exist
   - Variants explanation
   - Organization patterns

6. **Core Concepts → Test Isolation**
   - Test ID concept
   - How isolation works
   - Parallel execution benefits

7. **Framework Guides → Express → Getting Started**
   - Complete setup walkthrough
   - Middleware integration
   - First test
   - Scenario registration

**Quality Gate:**
- All code examples tested in real Express app
- Navigation works
- Search works
- Mobile responsive
- Accessibility audit passes

**Deliverable:** User can get started with Express in <10 minutes

---

### Subsequent Phases

See full plan document sections 3-7 for:
- Phase 3: Core Documentation (Weeks 2-3)
- Phase 4: API Reference (Week 4)
- Phase 5: Recipes & Advanced (Week 5)
- Phase 6: Architecture & Contributing (Week 6)
- Phase 7: Polish & Launch (Week 7)

---

## 4. Writing Guidelines

### Tone & Voice

**Primary Tone:** Helpful, competent, honest

**Characteristics:**
- **Direct** - Get to the point quickly
- **Practical** - Show working code, not theory
- **Honest** - Acknowledge trade-offs, don't oversell
- **Encouraging** - Build confidence, celebrate progress
- **Respectful** - Don't assume knowledge, don't talk down

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

**User Feedback:**
- Collect feedback via "Was this helpful?" + GitHub discussions
- Track common questions (add to FAQ)
- Monitor GitHub issues for documentation gaps

**Continuous Improvement:**
- Monthly analytics review (top pages, search queries, bounce rate)
- Quarterly content updates (new recipes, improved pages)
- Yearly full audit (accessibility, performance, competitor analysis)

---

## 6. Next Steps

### Immediate Actions

1. **Review and approve this plan**
2. **Archive old plan documents**
3. **Create Astro + Starlight site (Phase 1)**
4. **Write essential content (Phase 2)**
5. **Get early user feedback**
6. **Iterate through remaining phases**

### Key Deliverables

- **Week 0:** Deployed empty site with navigation
- **Week 1:** Essential pages (Homepage, Why, Quick Start, Express guide)
- **Weeks 2-3:** Complete feature reference + framework guides
- **Week 4:** Complete API reference
- **Week 5:** Recipe library
- **Week 6:** Architecture + contributing docs
- **Week 7:** Polish + launch

---

## Appendix: Detailed Page Outlines

For detailed page-by-page outlines including:
- Homepage structure with before/after examples
- "Why Scenarist?" comparison tables
- Quick Start copy-paste examples
- Core Concepts deep dives
- Recipe templates (Authentication, Payment Processing, etc.)
- API Reference format
- Starlight component usage

See the complete plan generated by docs-guardian agent.

---

**Document Status:** DRAFT - Pending Review
**Created:** 2025-11-08
**Author:** docs-guardian agent
**Next Review:** After Phase 1 completion
