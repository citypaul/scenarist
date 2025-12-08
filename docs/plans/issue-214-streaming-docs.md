# Issue 214: Add Streaming/Suspense Section to RSC Guide

## Status: COMPLETE

## Overview

Update the RSC guide (`apps/docs/src/content/docs/frameworks/nextjs-app-router/rsc-guide.mdx`) to document the Streaming/Suspense pattern that was added in issue #210.

## Requirements

From issue #214:
- Document Streaming/Suspense pattern
- Link to `app/streaming/` example
- Explain Suspense boundaries with Scenarist
- Link to `tests/playwright/streaming.spec.ts`

## Existing RSC Guide Structure

The guide currently has:
1. Why Server Components Need Different Testing
2. Setup Requirements for App Router
3. **Pattern 1**: Data Fetching in Server Components
4. **Pattern 2**: Stateful Mocks with RSC
5. **Pattern 3**: Polling & Sequences in RSC
6. Common Pitfalls and Debugging
7. Coming Soon (lists Streaming & Suspense)
8. Next Steps

## Implementation Plan

### Phase 1: Add Pattern 4 Section
- [x] Add "Pattern 4: Streaming & Suspense" after Pattern 3
- [x] Include example page with GitHub link
- [x] Include scenario definition
- [x] Include test implementation with GitHub link
- [x] Add Aside notes for tips

### Phase 2: Update Coming Soon Section
- [x] Remove "Streaming & Suspense" from Coming Soon list
- [x] Update Aside note about Milestone 2

### Phase 3: Verification
- [x] Run docs build to verify no errors
- [x] Review formatting and consistency

## New Section Content Structure

Following the existing pattern structure:

```
## Pattern 4: Streaming & Suspense

[Introduction paragraph explaining the pattern]

### Example: Streaming Products Page

**Page with Suspense:** [link to page.tsx]
**Async Component:** [link to slow-products.tsx]

[Code example of page.tsx]
[Code example of slow-products.tsx]

### Scenario Definition

[Code example of streaming scenario]

<Aside> tip about testing fallback states

### Test Implementation

**Test:** [link to streaming.spec.ts]

[Code example of tests]

<Aside> note about race conditions in testing
```

## Files to Modify

1. `apps/docs/src/content/docs/frameworks/nextjs-app-router/rsc-guide.mdx`
   - Add Pattern 4 section
   - Update Coming Soon section

## Progress Log

### 2024-12-08

- Read and analyzed existing RSC guide structure
- Created plan document
- Added Pattern 4: Streaming & Suspense section with:
  - Introduction explaining streaming with RSC
  - Page.tsx example with Suspense boundary
  - SlowProducts.tsx async component example
  - Scenario definitions for standard and premium tiers
  - Test implementation showing all 4 test cases
  - Key points table for streaming tests
  - Aside notes for tips and race conditions
- Updated Coming Soon section to remove Streaming & Suspense
- Verified docs build succeeds (4886 words indexed)
- Verified docs tests pass (10 tests)
