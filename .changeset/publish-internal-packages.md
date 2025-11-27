---
"@scenarist/core": patch
"@scenarist/msw-adapter": patch
---

Make internal packages publishable to npm

Previously, `@scenarist/core` and `@scenarist/msw-adapter` were marked as private, but they are dependencies of the public adapter packages. When users installed adapters from npm, these internal dependencies could not be resolved.

This change makes both internal packages publishable so they will be available on npm as transitive dependencies.
