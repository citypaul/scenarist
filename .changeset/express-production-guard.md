---
"@scenarist/express-adapter": patch
---

Restore the Express runtime production guard. `createScenarist()` returns `undefined` when `NODE_ENV` is `production`, even with `enabled: true`. This keeps `/__scenario__` endpoints out of unbundled Express apps started with `NODE_ENV=production node server.js`, where Node.js does not apply the `production` export condition. Use `node --conditions=production` to also avoid loading Scenarist and MSW code.
