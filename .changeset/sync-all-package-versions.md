---
"@scenarist/core": patch
"@scenarist/msw-adapter": patch
"@scenarist/express-adapter": patch
"@scenarist/nextjs-adapter": patch
"@scenarist/playwright-helpers": patch
---

Sync all package versions and add internal packages to fixed version group

This release ensures all Scenarist packages are versioned together:

- Added `@scenarist/core` and `@scenarist/msw-adapter` to the fixed version group
- All packages now release with synchronized version numbers
- Prevents version drift between internal and published packages
