---
"@scenarist/playwright-helpers": patch
---

Fix absolute URL endpoint support for cross-origin API servers

When the API server runs on a different host/port than the frontend, users can now provide an absolute URL for the `scenaristEndpoint` option. The endpoint is detected as absolute (starts with `http://` or `https://`) and used directly without prepending `baseURL`.

**Before (broken):**

```typescript
// Would produce invalid URL: http://localhost:3000http://localhost:9090/__scenario__
scenaristEndpoint: "http://localhost:9090/__scenario__";
```

**After (works):**

```typescript
// Correctly hits http://localhost:9090/__scenario__
scenaristEndpoint: "http://localhost:9090/__scenario__";
```
