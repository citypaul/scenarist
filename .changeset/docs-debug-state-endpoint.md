---
"@scenarist/playwright-helpers": patch
"@scenarist/nextjs-adapter": patch
"@scenarist/express-adapter": patch
---

docs: add debug state endpoint and fixtures documentation

- Document `GET /__scenarist__/state` debug endpoint for inspecting test state
- Document `debugState` and `waitForDebugState` Playwright fixtures
- Add examples for debugging multi-stage flows with state-aware mocking
- Link to ADR-0020 for conditional afterResponse design rationale
