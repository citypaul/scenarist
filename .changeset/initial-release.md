---
"@scenarist/express-adapter": patch
"@scenarist/nextjs-adapter": patch
"@scenarist/playwright-helpers": patch
---

Initial v1.0.0 release of Scenarist - a hexagonal architecture library for MSW-based mock scenarios in E2E testing.

### Features

- **Runtime scenario switching** - Switch backend states without application restarts
- **Test ID isolation** - Run concurrent tests with different backend states via test IDs
- **Request content matching** - Match requests by body, headers, query params, and regex patterns
- **Response sequences** - Support polling and state machine patterns with ordered responses
- **Stateful mocks** - Capture and inject state between requests using templates
- **Production tree-shaking** - Zero overhead in production bundles via conditional exports

### Packages

- `@scenarist/express-adapter` - Express middleware integration
- `@scenarist/nextjs-adapter` - Next.js App Router and Pages Router support
- `@scenarist/playwright-helpers` - Playwright test utilities for scenario switching
