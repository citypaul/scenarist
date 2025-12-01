---
"@scenarist/playwright-helpers": patch
---

Move @playwright/test from dependencies to peerDependencies

Previously, @playwright/test was declared as a direct dependency, causing consumers
to install a bundled version of Playwright that could conflict with their own
installation. This is now correctly declared as a peerDependency, allowing consumers
to use their existing Playwright installation.
