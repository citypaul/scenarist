# Campaign Progress

Last updated: 2025-12-15

## Current Status: Planning Complete

The master plan is complete and approved. Ready to begin implementation.

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

### Demo App Stage 1: Foundation (supports Videos 1-5)

- [ ] Build PayFlow basic structure (Next.js, Tailwind, TypeScript)
- [ ] Add Auth0 integration and user tiers
- [ ] Add pricing page with tier-based display
- [ ] Add basic Scenarist setup
- [ ] **REVIEW CHECKPOINT** → Tag: `stage-1-foundation`

### Phase 1: Foundation Videos

- [ ] Record Video 1: The Testing Gap → Tag: `video-01-testing-gap`
- [ ] Write Video 1 companion blog post
- [ ] Record Video 2: One Server, Unlimited Scenarios → Tag: `video-02-scenario-switching`
- [ ] Write Video 2 companion blog post

### Phase 2: Proof & Deep Dives

- [ ] Record Video 3: Case Study (8-10 min) → Tag: `video-03-case-study`
- [ ] Write Video 3 companion blog post
- [ ] Record Video 4: Server-Side State → Tag: `video-04-server-state`
- [ ] Write Video 4 companion blog post
- [ ] Record Video 5: Test Behavior, Not Implementation → Tag: `video-05-behavior-testing`
- [ ] Write Video 5 companion blog post

### Demo App Stage 2: Features (supports Videos 6-9)

- [ ] Add cart functionality
- [ ] Add checkout flow
- [ ] Add payment processing (Stripe mock)
- [ ] Add response sequences for polling
- [ ] **REVIEW CHECKPOINT** → Tag: `stage-2-features`

### Phase 3: Core Features

- [ ] Record Video 6: Request Matching → Tag: `video-06-request-matching`
- [ ] Write Video 6 companion blog post
- [ ] Record Video 7: Response Sequences → Tag: `video-07-sequences`
- [ ] Write Video 7 companion blog post
- [ ] Record Video 8: Stateful Mocks → Tag: `video-08-stateful-mocks`
- [ ] Write Video 8 companion blog post
- [ ] Record Video 9: Parallel Testing → Tag: `video-09-parallel-testing`
- [ ] Write Video 9 companion blog post

### Demo App Stage 3: Complete (supports Videos 10-14)

- [ ] Add full Playwright test suite
- [ ] Verify production build (tree-shaking)
- [ ] Add email notifications (SendGrid mock)
- [ ] Polish all scenarios
- [ ] **REVIEW CHECKPOINT** → Tag: `stage-3-complete`

### Phase 4: Advanced Patterns

- [ ] Record Video 10: Feature Composition → Tag: `video-10-composition`
- [ ] Write Video 10 companion blog post
- [ ] Record Video 11: Production Safety → Tag: `video-11-production-safety`
- [ ] Write Video 11 companion blog post
- [ ] Record Video 12: Playwright Integration → Tag: `video-12-playwright`
- [ ] Write Video 12 companion blog post

### Phase 5: Decision Maker Content

- [ ] Record Video 13: For Tech Leads → Tag: `video-13-tech-leads`
- [ ] Write Video 13 companion blog post
- [ ] Record Video 14: Tool Comparison → Tag: `video-14-comparison`
- [ ] Write Video 14 companion blog post

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
