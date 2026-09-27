---
"@scenarist/core": minor
"@scenarist/express-adapter": minor
"@scenarist/nextjs-adapter": minor
---

`enabled` is now honoured. `createScenarist({ enabled: false })` returns `undefined` from the Express, Next.js App Router and Next.js Pages Router adapters: no scenario endpoints, no middleware and no request interception. The adapters' `createScenarist()` return types now include `undefined`, so guard with `if (scenarist)` or `scenarist?.`.

**Check your `enabled` expression.** Previously `enabled` was ignored, so Scenarist ran even when it evaluated to `false`. If you use `enabled: process.env.NODE_ENV === "test"`, make sure the process serving your tests runs with `NODE_ENV=test`. `next dev` defaults to `development`, so set `NODE_ENV: "test"` in Playwright's `webServer.env`. A Pages Router API route that does `export default scenarist?.createScenarioEndpoint()` needs a fallback handler to satisfy Next.js route types.
