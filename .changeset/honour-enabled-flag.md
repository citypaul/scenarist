---
"@scenarist/core": minor
"@scenarist/express-adapter": minor
"@scenarist/nextjs-adapter": minor
---

`enabled` is now honoured. `createScenarist({ enabled: false })` returns `undefined` from the Express, Next.js App Router and Next.js Pages Router adapters: no scenario endpoints, no middleware and no request interception. The adapters' `createScenarist()` return types now include `undefined`, so guard with `if (scenarist)` or `scenarist?.`.

**Check your `enabled` expression.** Previously `enabled` was ignored, so Scenarist ran even when it evaluated to `false`.

- **Next.js:** `enabled: process.env.NODE_ENV === "test"` now disables Scenarist. Next.js replaces `process.env.NODE_ENV` in your code with `'development'` under `next dev` and `'production'` under `next build`, even when you start it with `NODE_ENV=test`. Use `enabled: true`; production builds are still excluded because they resolve the `production` export condition.
- **Express:** `enabled: process.env.NODE_ENV === "test"` works when the process serving your tests runs with `NODE_ENV=test` (Vitest and Jest set it). If Playwright starts your server, set it in `webServer.env`.

A Pages Router API route that does `export default scenarist?.createScenarioEndpoint()` needs a fallback handler to satisfy Next.js route types.
