# Agent Prompt Template

Copy and customize the prompt below for each workstream agent.

---

## Workstream 1 (Getting Started Section)

```
You are working on the Scenarist documentation restructure. You have been assigned to **Workstream 1: Getting Started Section**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-1`
**Issues**: #191, #192, #193, #194 (can be done in any order)

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Understand the URL mapping for page links (included in workflow rules)

## Your Tickets (any order)

1. **#191 - docs: Rewrite installation.md with actual content and fix broken links**
   - File: `apps/docs/src/content/docs/introduction/installation.md`
   - Fix broken links:
     - `/frameworks/nextjs/pages/getting-started` → `/frameworks/nextjs-pages-router/getting-started`
     - `/frameworks/nextjs/app/getting-started` → `/frameworks/nextjs-app-router/getting-started`
   - Add actual installation content (pnpm/npm/yarn commands)
   - **Page URL**: https://scenarist.io/introduction/installation

2. **#192 - docs: Create philosophy.mdx page**
   - Create NEW file: `apps/docs/src/content/docs/getting-started/philosophy.mdx`
   - ~300 lines, consumer-focused content:
     - Core principle: Test behavior, not implementation
     - Why declarative patterns enable better testing
     - The gap Scenarist fills between unit tests and E2E
     - When Scenarist is (and isn't) the right choice
   - **Page URL**: https://scenarist.io/getting-started/philosophy

3. **#193 - docs: Create first-scenario.mdx tutorial**
   - Create NEW file: `apps/docs/src/content/docs/getting-started/first-scenario.mdx`
   - ~200 lines, hands-on tutorial:
     - Step-by-step guide to creating first scenario
     - Expand on quick-start with more context
     - Common patterns for beginners
   - **Page URL**: https://scenarist.io/getting-started/first-scenario

4. **#194 - docs: Move and update quick-start.mdx**
   - Move from `introduction/quick-start.mdx` to `getting-started/quick-start.mdx`
   - Update any internal links
   - Minor edits for consistency
   - **Old URL**: https://scenarist.io/introduction/quick-start
   - **New URL**: https://scenarist.io/getting-started/quick-start

## Rules

1. **These tickets can be done in any order** - All independent
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `docs: <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets
7. **Include page links in PR description** - See "Pages Changed" section in PR template

## PR Template

Use this template for your PR descriptions:

## Summary
- [Bullet points describing changes]

## Pages Changed
- https://scenarist.io/[path] - [description of change]

## Checklist
- [ ] Links verified
- [ ] Frontmatter correct
- [ ] No broken internal links

closes #[issue-number]

Start by reading the workflow document, then begin with any ticket.
```

---

## Workstream 2 (Core Concepts Section)

```
You are working on the Scenarist documentation restructure. You have been assigned to **Workstream 2: Core Concepts Section**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-2`
**Issues**: #195, #196, #197, #198, #199 (can be done in any order)

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Understand the URL mapping for page links (included in workflow rules)

## Your Tickets (any order)

1. **#195 - docs: Move overview.md to concepts/how-it-works.md**
   - Move `introduction/overview.md` to `concepts/how-it-works.md`
   - Update frontmatter title
   - Update any internal links
   - **Old URL**: https://scenarist.io/introduction/overview
   - **New URL**: https://scenarist.io/concepts/how-it-works

2. **#196 - docs: Move scenario-format.mdx to concepts/**
   - Move `introduction/scenario-format.mdx` to `concepts/scenario-format.mdx`
   - Update any internal links
   - **Old URL**: https://scenarist.io/introduction/scenario-format
   - **New URL**: https://scenarist.io/concepts/scenario-format

3. **#197 - docs: Move default-mocks.mdx to concepts/**
   - Move `introduction/default-mocks.mdx` to `concepts/default-mocks.mdx`
   - Update any internal links
   - **Old URL**: https://scenarist.io/introduction/default-mocks
   - **New URL**: https://scenarist.io/concepts/default-mocks

4. **#198 - docs: Split capabilities.mdx into dynamic-responses directory**
   - Split `introduction/capabilities.mdx` (878 lines) into 4 files:
   - Create new directory `concepts/dynamic-responses/` with:
     1. `index.mdx` (~100 lines) - Overview linking to sub-pages
     2. `content-matching.mdx` (~250 lines) - Request Content Matching section
     3. `sequences.mdx` (~150 lines) - Response Sequences section
     4. `stateful-mocks.mdx` (~200 lines) - Stateful Mocks section
   - **Old URL**: https://scenarist.io/introduction/capabilities
   - **New URLs**:
     - https://scenarist.io/concepts/dynamic-responses
     - https://scenarist.io/concepts/dynamic-responses/content-matching
     - https://scenarist.io/concepts/dynamic-responses/sequences
     - https://scenarist.io/concepts/dynamic-responses/stateful-mocks

5. **#199 - docs: Refactor production-safety.mdx (shorten to ~300 lines)**
   - Move `introduction/production-safety.mdx` to `concepts/production-safety.mdx`
   - Shorten from 805 lines to ~300 lines
   - Remove content that belongs in Reference section
   - Keep focus on: How it works, configuration, framework notes
   - **Old URL**: https://scenarist.io/introduction/production-safety
   - **New URL**: https://scenarist.io/concepts/production-safety

## Rules

1. **These tickets can be done in any order** - All independent
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `docs: <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets
7. **Include page links in PR description** - See "Pages Changed" section in PR template

## PR Template

Use this template for your PR descriptions:

## Summary
- [Bullet points describing changes]

## Pages Changed
- https://scenarist.io/[old-path] → https://scenarist.io/[new-path]

## Checklist
- [ ] Content preserved accurately
- [ ] Frontmatter updated
- [ ] Internal links updated

closes #[issue-number]

Start by reading the workflow document, then begin with any ticket.
```

---

## Workstream 3 (RSC Guide)

```
You are working on the Scenarist documentation restructure. You have been assigned to **Workstream 3: RSC Guide**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-3`
**Issues**: #200

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Review existing App Router example code in `apps/nextjs-app-router-example/`
3. Understand the URL mapping for page links (included in workflow rules)

## Your Ticket

**#200 - docs: Create Testing React Server Components guide**

Create NEW file: `apps/docs/src/content/docs/frameworks/nextjs-app-router/rsc-guide.mdx`

~300 lines documenting EXISTING patterns with links to GitHub example code:

1. **Why Server Components need different testing**
2. **Setup requirements for App Router**
3. **Pattern 1: Data Fetching in Server Components** - Link to existing `app/products/page.tsx`
4. **Pattern 2: Stateful Mocks with RSC** - Link to existing `app/cart-server/page.tsx`
5. **Pattern 3: Polling & Sequences in RSC** - Link to existing `app/polling/page.tsx`
6. **Pattern 4: Request Matching for Tier-Based Responses**
7. **Common pitfalls and debugging**
8. **Coming Soon** (placeholder for Milestone 2 patterns - Server Actions, Auth, Streaming, Error Boundaries)

**Page URL**: https://scenarist.io/frameworks/nextjs-app-router/rsc-guide

## Rules

1. **Small incremental commits** - Each commit must pass tests/types/lint
2. **Create a plan before starting** - Document in your PR
3. **Commit message format**: `docs: <description>`
4. **Final commit**: Include `closes #200`
5. **Include page link in PR description**

## Important Context

- Document EXISTING patterns from the example app - don't invent new ones
- Link to actual GitHub files in citypaul/scenarist repo
- The "Coming Soon" section will be filled by WS8 after WS7 creates the examples

## PR Template

## Summary
- Created comprehensive RSC testing guide
- Documents 4 existing patterns with code examples
- Links to GitHub example code

## Pages Changed
- https://scenarist.io/frameworks/nextjs-app-router/rsc-guide (NEW)

## Checklist
- [ ] All code examples reference real files
- [ ] GitHub links are correct
- [ ] Frontmatter includes proper title and description

closes #200

Start by reading the workflow document, then review the existing example app code.
```

---

## Workstream 4 (Testing Patterns)

```
You are working on the Scenarist documentation restructure. You have been assigned to **Workstream 4: Testing Patterns Section**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-4`
**Issues**: #201, #202, #203 (can be done in any order)

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Understand the URL mapping for page links (included in workflow rules)

## Your Tickets (any order)

1. **#201 - docs: Refactor playwright-integration.mdx**
   - Move `introduction/testing-with-playwright.md` to `testing/playwright-integration.mdx`
   - Keep focused on Playwright setup and fixtures
   - Remove content that belongs in parallel-testing
   - **Old URL**: https://scenarist.io/introduction/testing-with-playwright
   - **New URL**: https://scenarist.io/testing/playwright-integration

2. **#202 - docs: Create parallel-testing.mdx**
   - Create NEW file: `apps/docs/src/content/docs/testing/parallel-testing.mdx`
   - ~250 lines
   - Extract from `reference/verification.md` (Header Propagation section)
   - Extract from `introduction/overview.md` (Test Isolation section)
   - Dedicated guide on running tests in parallel
   - Test ID isolation patterns
   - Concurrent test scenarios
   - **Page URL**: https://scenarist.io/testing/parallel-testing

3. **#203 - docs: Create best-practices.mdx**
   - Create NEW file: `apps/docs/src/content/docs/testing/best-practices.mdx`
   - ~300 lines
   - Scenario organization patterns
   - When to use which feature (matching vs sequences vs state)
   - Common anti-patterns to avoid
   - Testing strategy recommendations
   - Factory function patterns for test data
   - **Page URL**: https://scenarist.io/testing/best-practices

## Rules

1. **These tickets can be done in any order** - All independent
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `docs: <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets
7. **Include page links in PR description**

## PR Template

## Summary
- [Bullet points describing changes]

## Pages Changed
- https://scenarist.io/[path] - [description]

## Checklist
- [ ] Content extracted cleanly
- [ ] No duplicate content with source files
- [ ] Frontmatter correct

closes #[issue-number]

Start by reading the workflow document, then begin with any ticket.
```

---

## Workstream 5 (Reference Section)

```
You are working on the Scenarist documentation restructure. You have been assigned to **Workstream 5: Reference Section**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-5`
**Issues**: #204, #205 (can be done in any order)

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Understand the URL mapping for page links (included in workflow rules)

## Your Tickets (any order)

1. **#204 - docs: Split verification.md into verification + troubleshooting**
   - Split `reference/verification.md` (813 lines) into 2 files:
   - Keep `reference/verification.md` (~400 lines)
     - Core verification content
     - Tree-shaking checks
   - Create `reference/troubleshooting.mdx` (~300 lines)
     - Common Issues section
     - Debugging strategies
     - Red flags and symptom identification
   - **Page URLs**:
     - https://scenarist.io/reference/verification (shortened)
     - https://scenarist.io/reference/troubleshooting (NEW)

2. **#205 - docs: Create consolidated api.mdx reference**
   - Create NEW file: `apps/docs/src/content/docs/reference/api.mdx`
   - ~400 lines
   - Consolidate:
     - `introduction/endpoint-apis.mdx` content
     - `introduction/ephemeral-endpoints.mdx` content
   - Single comprehensive API reference
   - **Page URL**: https://scenarist.io/reference/api

## Rules

1. **These tickets can be done in any order** - All independent
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `docs: <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets
7. **Include page links in PR description**

## PR Template

## Summary
- [Bullet points describing changes]

## Pages Changed
- https://scenarist.io/[path] - [description]

## Checklist
- [ ] Content consolidated correctly
- [ ] No information lost
- [ ] Frontmatter correct

closes #[issue-number]

Start by reading the workflow document, then begin with any ticket.
```

---

## Workstream 6 (Sidebar & Link Fixes)

```
You are working on the Scenarist documentation restructure. You have been assigned to **Workstream 6: Sidebar & Link Fixes**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-6`
**Issues**: #206, #207 (can be done in any order, but AFTER WS1-WS5 complete)

## CRITICAL: Cross-Workstream Dependency

**Both tickets depend on WS1-WS5 completing first.**

Before starting, verify all these issues are closed:
```bash
gh issue view 191 --json state  # WS1
gh issue view 192 --json state
gh issue view 193 --json state
gh issue view 194 --json state
gh issue view 195 --json state  # WS2
gh issue view 196 --json state
gh issue view 197 --json state
gh issue view 198 --json state
gh issue view 199 --json state
gh issue view 200 --json state  # WS3
gh issue view 201 --json state  # WS4
gh issue view 202 --json state
gh issue view 203 --json state
gh issue view 204 --json state  # WS5
gh issue view 205 --json state
```

If any are still open, **wait** until they are merged.

## Your Tickets (any order, after dependencies met)

1. **#206 - docs: Restructure sidebar in astro.config.mjs**
   - Update sidebar configuration in `apps/docs/astro.config.mjs`
   - Match new structure:
     - Getting Started section
     - Core Concepts section (with Dynamic Responses subsection)
     - Framework Guides (collapsed)
     - Testing Patterns section
     - Reference section (collapsed)
   - **Affects all pages** - sidebar appears on every page

2. **#207 - docs: Fix all broken internal links**
   - Search all .md and .mdx files for broken internal links
   - Common fixes needed:
     - `/introduction/*` → `/concepts/*` or `/getting-started/*`
     - `/guides/testing-with-playwright` → `/testing/playwright-integration`
   - Use: `grep -r \"](/introduction/\" apps/docs/src/content/docs/`
   - **Affects multiple pages** - list all fixed pages in PR

## Rules

1. **MUST wait for WS1-WS5 to complete** - Check dependencies first
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `docs: <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets
7. **Include page links in PR description** - List all affected pages

## PR Template

## Summary
- [Bullet points describing changes]

## Pages Changed
- All pages (sidebar restructure) OR
- [List specific pages with fixed links]

## Dependencies Verified
- [x] WS1 complete (#191, #192, #193, #194 closed)
- [x] WS2 complete (#195, #196, #197, #198, #199 closed)
- [x] WS3 complete (#200 closed)
- [x] WS4 complete (#201, #202, #203 closed)
- [x] WS5 complete (#204, #205 closed)

## Checklist
- [ ] All new paths exist
- [ ] No 404s when navigating
- [ ] Sidebar renders correctly

closes #[issue-number]

Start by verifying dependencies, then begin work.
```

---

## Workstream 7 (App Router Examples - Milestone 2)

```
You are working on the Scenarist App Router Example Enhancements (Milestone 2). You have been assigned to **Workstream 7: App Router Examples**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-7`
**Issues**: #208, #209, #210, #211 (can be done in any order)

## Before You Start

1. Read the workflow rules: `docs/release/parallel-agent-workflow.md`
2. Review existing patterns in `apps/nextjs-app-router-example/`
3. **TDD IS REQUIRED** - Write tests FIRST, then implementation

## Your Tickets (any order)

1. **#208 - feat: Add Server Actions example to App Router example app**
   - Create form with server action calling external API
   - Files to create:
     - `app/actions/page.tsx` - Page with form
     - `app/actions/actions.ts` - Server Action with `'use server'`
     - `tests/playwright/server-actions.spec.ts` - Tests
     - Add scenarios to `lib/scenarios.ts`
   - **TDD Required**: Write tests FIRST
   - **No page URL** - This is example app code, not docs

2. **#209 - feat: Add Authentication flow example to App Router example app**
   - Create protected route with auth check and login flow
   - Files to create:
     - `app/protected/page.tsx` - Protected Server Component
     - `app/protected/layout.tsx` - Layout with auth check
     - `app/login/page.tsx` - Login page
     - `lib/auth.ts` - Auth helper calling external API
     - `tests/playwright/auth-flows.spec.ts` - Tests
     - Add scenarios: `authenticatedUser`, `unauthenticatedUser`
   - **TDD Required**: Write tests FIRST
   - **No page URL** - This is example app code, not docs

3. **#210 - feat: Add Streaming/Suspense example to App Router example app**
   - Create RSC with Suspense boundary and fallback UI
   - Files to create:
     - `app/streaming/page.tsx` - Page with Suspense wrapper
     - `app/streaming/slow-products.tsx` - Async Server Component
     - `tests/playwright/streaming.spec.ts` - Streaming behavior tests
   - **TDD Required**: Write tests FIRST
   - **No page URL** - This is example app code, not docs

4. **#211 - feat: Add Error Boundary example to App Router example app**
   - Create error.tsx with recovery and test error scenarios
   - Files to create:
     - `app/errors/page.tsx` - Page that can fail
     - `app/errors/error.tsx` - Error boundary with retry
     - `tests/playwright/error-boundaries.spec.ts` - Error handling tests
     - Add scenario: `apiError`
   - **TDD Required**: Write tests FIRST
   - **No page URL** - This is example app code, not docs

## Rules

1. **TDD IS NON-NEGOTIABLE** - Write failing test first, then implementation
2. **These tickets can be done in any order** - All independent
3. **Small incremental commits** - Each commit must pass tests/types/lint
4. **Create a plan before starting each ticket** - Document in your PR
5. **Commit message format**: `feat: <description>` or `test: <description>`
6. **Final commit for each ticket**: Include `closes #<issue-number>`
7. **Create a PR for each ticket** - Don't batch multiple tickets

## Important Context

- All code goes in `apps/nextjs-app-router-example/`
- Follow existing patterns in the example app
- These examples will be documented by WS8 after your PRs merge
- Scenarios should be added to existing `lib/scenarios.ts`

## PR Template

## Summary
- [Bullet points describing feature]

## TDD Evidence
- Tests written first in commit [hash]
- Implementation in commit [hash]

## Files Changed
- `app/[feature]/page.tsx` - [description]
- `tests/playwright/[feature].spec.ts` - [description]

## Test Output

[Paste test results showing all tests pass]

## Checklist
- [ ] Tests written before implementation
- [ ] All tests pass
- [ ] TypeScript strict mode satisfied
- [ ] Follows existing patterns

closes #[issue-number]

Start by reading the workflow document, then begin with any ticket using TDD.
```

---

## Workstream 8 (RSC Guide Updates - Milestone 2)

```
You are working on the Scenarist RSC Guide Updates (Milestone 2). You have been assigned to **Workstream 8: RSC Guide Updates**.

## Your Assignment

**Worktree**: You are operating in a dedicated git worktree for this workstream.
**Branch**: `workstream-8`
**Issues**: #212, #213, #214, #215 (each depends on a WS7 issue)

## CRITICAL: Cross-Workstream Dependencies

Each ticket depends on a specific WS7 ticket completing first:

| Your Ticket | Depends On | Check Command |
|-------------|------------|---------------|
| #212 | #208 (Server Actions) | `gh issue view 208 --json state` |
| #213 | #209 (Auth Flow) | `gh issue view 209 --json state` |
| #214 | #210 (Streaming) | `gh issue view 210 --json state` |
| #215 | #211 (Error Boundary) | `gh issue view 211 --json state` |

**Only start a ticket after its dependency is merged.**

## Your Tickets (in dependency order)

1. **#212 - docs: Add Server Actions section to RSC guide**
   - **WAIT for #208 to merge**
   - Update `apps/docs/src/content/docs/frameworks/nextjs-app-router/rsc-guide.mdx`
   - Document Server Actions pattern
   - Link to `app/actions/` example
   - Link to `tests/playwright/server-actions.spec.ts`
   - **Page URL**: https://scenarist.io/frameworks/nextjs-app-router/rsc-guide

2. **#213 - docs: Add Authentication section to RSC guide**
   - **WAIT for #209 to merge**
   - Update `apps/docs/src/content/docs/frameworks/nextjs-app-router/rsc-guide.mdx`
   - Document Authentication pattern
   - Link to `app/protected/` example
   - Show authenticated vs unauthenticated scenarios
   - Link to `tests/playwright/auth-flows.spec.ts`
   - **Page URL**: https://scenarist.io/frameworks/nextjs-app-router/rsc-guide

3. **#214 - docs: Add Streaming/Suspense section to RSC guide**
   - **WAIT for #210 to merge**
   - Update `apps/docs/src/content/docs/frameworks/nextjs-app-router/rsc-guide.mdx`
   - Document Streaming/Suspense pattern
   - Link to `app/streaming/` example
   - Explain Suspense boundaries with Scenarist
   - Link to `tests/playwright/streaming.spec.ts`
   - **Page URL**: https://scenarist.io/frameworks/nextjs-app-router/rsc-guide

4. **#215 - docs: Add Error Boundary section to RSC guide**
   - **WAIT for #211 to merge**
   - Update `apps/docs/src/content/docs/frameworks/nextjs-app-router/rsc-guide.mdx`
   - Document Error Boundary pattern
   - Link to `app/errors/` example
   - Show error recovery flow
   - Link to `tests/playwright/error-boundaries.spec.ts`
   - **Remove "Coming Soon" placeholder section** (this is the final update)
   - **Page URL**: https://scenarist.io/frameworks/nextjs-app-router/rsc-guide

## Rules

1. **Check dependency before starting each ticket** - Only work on tickets whose dependency is merged
2. **Small incremental commits** - Each commit must pass tests/types/lint
3. **Create a plan before starting each ticket** - Document in your PR
4. **Commit message format**: `docs: <description>`
5. **Final commit for each ticket**: Include `closes #<issue-number>`
6. **Create a PR for each ticket** - Don't batch multiple tickets
7. **Include page link in PR description**

## Important Context

- All updates go to the SAME file: `rsc-guide.mdx`
- Link to real GitHub files from WS7's work
- Each PR adds a new section to the guide
- The final PR (#215) should remove the "Coming Soon" placeholder

## PR Template

## Summary
- Added [pattern name] section to RSC guide
- Links to example code at [GitHub path]
- Links to test file at [GitHub path]

## Pages Changed
- https://scenarist.io/frameworks/nextjs-app-router/rsc-guide

## Dependency Verified
- [x] #[WS7-issue] merged to main

## Checklist
- [ ] Links to correct GitHub files
- [ ] Code examples accurate
- [ ] Pattern clearly explained

closes #[issue-number]

Start by checking which dependencies are met, then work on available tickets.
```

---

## Quick Copy Reference

| Workstream | Copy from section |
|------------|-------------------|
| WS1 | "Workstream 1 (Getting Started Section)" |
| WS2 | "Workstream 2 (Core Concepts Section)" |
| WS3 | "Workstream 3 (RSC Guide)" |
| WS4 | "Workstream 4 (Testing Patterns)" |
| WS5 | "Workstream 5 (Reference Section)" |
| WS6 | "Workstream 6 (Sidebar & Link Fixes)" |
| WS7 | "Workstream 7 (App Router Examples - Milestone 2)" |
| WS8 | "Workstream 8 (RSC Guide Updates - Milestone 2)" |

## Parallelization Summary

**Can run immediately (in parallel):**
- WS1, WS2, WS3, WS4, WS5, WS7

**Must wait:**
- WS6: Wait for WS1-WS5 to complete
- WS8: Each ticket waits for its corresponding WS7 ticket

**Recommended launch order:**
1. Start WS1, WS2, WS3, WS4, WS5, WS7 simultaneously
2. Start WS6 when WS1-WS5 complete
3. Start WS8 tickets as their WS7 dependencies complete
