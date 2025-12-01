---
"@scenarist/express-adapter": patch
---

Simplify `createScenarist()` to synchronous API, aligning with Next.js adapters

**API Change:**

```typescript
// Before (async)
const scenarist = await createScenarist({ enabled: true, scenarios });

// After (sync)
const scenarist = createScenarist({ enabled, scenarios });
```

Investigation proved dynamic imports don't enable tree-shaking (conditional exports do), so the async pattern was unnecessary. This change provides a consistent developer experience across all Scenarist adapters.
