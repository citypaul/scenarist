---
"@scenarist/core": minor
"@scenarist/nextjs-adapter": minor
"@scenarist/playwright-helpers": minor
"@scenarist/express-adapter": minor
---

Add conditional afterResponse for stateResponse conditions and debug state endpoint

**Core:**

- Add condition-level `afterResponse` support in `stateResponse` - conditions can now override or suppress the mock-level afterResponse
- Add `getState()` method to ScenarioManager for inspecting current test state
- Add validation for duplicate `when` clauses in stateResponse conditions
- Add `getState` endpoint path to config

**Adapters (Express, Next.js):**

- Add debug state endpoint (`GET /__scenarist__/state`) for inspecting current test state
- Add `createStateEndpoint()` method to adapter instances for API consistency
- Production tree-shaking ensures debug endpoint is not included in production builds

**Playwright Helpers:**

- Add `debugState` fixture for inspecting current test state in Playwright tests
- Add `waitForDebugState` fixture for waiting on state conditions
- Add `scenaristStateEndpoint` configuration option
