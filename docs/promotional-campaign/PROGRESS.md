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

### Phase 1: Foundation

- [ ] Build PayFlow demo app (`demo/payflow/`, installs from npm)
- [ ] Record Video 1: The Testing Gap
- [ ] Write Video 1 companion blog post
- [ ] Record Video 2: One Server, Unlimited Scenarios
- [ ] Write Video 2 companion blog post

### Phase 2: Proof & Deep Dives

- [ ] Record Video 3: Case Study (8-10 min)
- [ ] Write Video 3 companion blog post
- [ ] Record Video 4: Server-Side State
- [ ] Write Video 4 companion blog post
- [ ] Record Video 5: Test Behavior, Not Implementation
- [ ] Write Video 5 companion blog post

### Phase 3: Core Features

- [ ] Record Video 6: Request Matching
- [ ] Write Video 6 companion blog post
- [ ] Record Video 7: Response Sequences
- [ ] Write Video 7 companion blog post
- [ ] Record Video 8: Stateful Mocks
- [ ] Write Video 8 companion blog post
- [ ] Record Video 9: Parallel Testing
- [ ] Write Video 9 companion blog post

### Phase 4: Advanced Patterns

- [ ] Record Video 10: Feature Composition
- [ ] Write Video 10 companion blog post
- [ ] Record Video 11: Production Safety
- [ ] Write Video 11 companion blog post
- [ ] Record Video 12: Playwright Integration
- [ ] Write Video 12 companion blog post

### Phase 5: Decision Maker Content

- [ ] Record Video 13: For Tech Leads
- [ ] Write Video 13 companion blog post
- [ ] Record Video 14: Tool Comparison
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
