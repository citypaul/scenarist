---
"@scenarist/playwright-helpers": patch
"@scenarist/core": patch
---

Fix dependency declarations to prevent version conflicts

**@scenarist/playwright-helpers:**

- Move `@playwright/test` from dependencies to peerDependencies
- Prevents bundling Playwright, allowing consumers to use their own installation

**@scenarist/core:**

- Remove unused `msw` dependency (was never imported in source code)
- Core is a pure hexagonal domain with no MSW dependency; MSW integration lives in msw-adapter
