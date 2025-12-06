# @scenarist/playwright-helpers

[![npm version](https://img.shields.io/npm/v/@scenarist/playwright-helpers.svg)](https://www.npmjs.com/package/@scenarist/playwright-helpers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Playwright test helpers for [Scenarist](https://scenarist.io) scenario management with guaranteed test isolation.

## 📖 Documentation

**→ [Playwright Integration Guide](https://scenarist.io/testing/playwright-integration)** — Fixtures, type-safe scenarios, test isolation

| Topic                   | Link                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Why Scenarist?**      | [scenarist.io/getting-started/why-scenarist](https://scenarist.io/getting-started/why-scenarist) |
| **Parallel Testing**    | [scenarist.io/testing/parallel-testing](https://scenarist.io/testing/parallel-testing)           |
| **Tool Comparison**     | [scenarist.io/comparison](https://scenarist.io/comparison)                                       |
| **Writing Scenarios**   | [scenarist.io/scenarios/basic-structure](https://scenarist.io/scenarios/basic-structure)         |
| **Request Matching**    | [scenarist.io/scenarios/request-matching](https://scenarist.io/scenarios/request-matching)       |
| **Response Sequences**  | [scenarist.io/scenarios/response-sequences](https://scenarist.io/scenarios/response-sequences)   |
| **State-Aware Mocking** | [scenarist.io/scenarios/state-aware-mocking](https://scenarist.io/scenarios/state-aware-mocking) |
| **Logging & Debugging** | [scenarist.io/reference/logging](https://scenarist.io/reference/logging)                         |

## Installation

```bash
# npm
npm install -D @scenarist/playwright-helpers

# pnpm
pnpm add -D @scenarist/playwright-helpers

# yarn
yarn add -D @scenarist/playwright-helpers
```

## Quick Start (Recommended: Fixtures API)

The **fixtures API** is the recommended way to use Scenarist with Playwright. It provides:

- ✅ Guaranteed unique test IDs (no collisions, even with parallel execution)
- ✅ Configuration in one place (no repetition across tests)
- ✅ Clean composition with your existing fixtures
- ✅ Type-safe with full TypeScript support

### 1. Configure in `playwright.config.ts`

```typescript
import { defineConfig } from "@playwright/test";
import type { ScenaristOptions } from "@scenarist/playwright-helpers";

export default defineConfig<ScenaristOptions>({
  use: {
    baseURL: "http://localhost:3000", // Standard Playwright config
    scenaristEndpoint: "/api/__scenario__", // Scenarist-specific config
  },
});
```

**Note:** The `<ScenaristOptions>` type parameter enables TypeScript to recognize `scenaristEndpoint` as a valid configuration option.

### 2. Create a Fixtures File

Create `tests/fixtures.ts` with your scenarios:

```typescript
// tests/fixtures.ts
import { withScenarios, expect } from "@scenarist/playwright-helpers";
import { scenarios } from "../lib/scenarios"; // Your scenario definitions

export const test = withScenarios(scenarios);
export { expect };
```

### 3. Use in Tests

```typescript
// tests/my-test.spec.ts
import { test, expect } from "./fixtures"; // Import from YOUR fixtures file

test("premium user sees premium pricing", async ({ page, switchScenario }) => {
  // Configuration read from playwright.config.ts - no repetition!
  await switchScenario(page, "premiumUser"); // Type-safe! Autocomplete works

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Premium" })).toBeVisible();
});
```

That's it! No manual test ID generation, no repeating baseURL/endpoint, guaranteed test isolation.

## Composing with Your Existing Fixtures

If your team already has custom Playwright fixtures, you can easily compose them with Scenarist fixtures:

```typescript
// tests/fixtures.ts
import { withScenarios, expect } from "@scenarist/playwright-helpers";
import { scenarios } from "../lib/scenarios";
import type { Page } from "@playwright/test";

type MyFixtures = {
  authenticatedPage: Page;
  database: Database;
};

export const test = withScenarios(scenarios).extend<MyFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Your custom fixture logic
    await page.goto("/login");
    await page.fill("[name=email]", "test@example.com");
    await page.fill("[name=password]", "password");
    await page.click("button[type=submit]");
    await use(page);
  },

  database: async ({}, use) => {
    const db = await connectToTestDatabase();
    await use(db);
    await db.close();
  },
});

export { expect };
```

Now use your extended test object:

```typescript
// tests/my-test.spec.ts
import { test, expect } from "./fixtures";

test("authenticated premium user flow", async ({
  authenticatedPage,
  switchScenario,
  database,
}) => {
  // All fixtures available: yours + Scenarist's
  await switchScenario(authenticatedPage, "premiumUser");
  await authenticatedPage.goto("/dashboard");

  const user = await database.getUser("test@example.com");
  expect(user.tier).toBe("premium");
});
```

## Type-Safe Scenario IDs (Automatic)

Type safety is **automatic** when you use `withScenarios(scenarios)`. The function infers scenario IDs from your scenarios object.

### 1. Define Scenarios

```typescript
// lib/scenarios.ts
import type { ScenaristScenarios } from '@scenarist/core';

export const scenarios = {
  cartWithState: { id: 'cartWithState', name: 'Cart with State', mocks: [...] },
  premiumUser: { id: 'premiumUser', name: 'Premium User', mocks: [...] },
  standardUser: { id: 'standardUser', name: 'Standard User', mocks: [...] },
} as const satisfies ScenaristScenarios;
```

### 2. Create Typed Test Object

```typescript
// tests/fixtures.ts
import { withScenarios, expect } from "@scenarist/playwright-helpers";
import { scenarios } from "../lib/scenarios";

// Type-safe test object - scenario IDs are inferred automatically!
export const test = withScenarios(scenarios);
export { expect };
```

### 3. Use with Full Autocomplete

```typescript
// tests/my-test.spec.ts
import { test, expect } from "./fixtures";

test("my test", async ({ page, switchScenario }) => {
  await switchScenario(page, "cart"); // ❌ TypeScript error: not a valid scenario
  await switchScenario(page, "cartWithState"); // ✅ Autocomplete works!
  //                            ^
  //                            Autocomplete shows all valid scenario IDs
});
```

**Benefits:**

- ✅ Autocomplete shows all valid scenario names
- ✅ TypeScript errors for typos or invalid scenarios
- ✅ Type stays in sync with actual scenarios (single source of truth)
- ✅ Works seamlessly with fixture composition

## Advanced: Per-Test Configuration Overrides

Most tests use the global config, but you can override for specific tests:

```typescript
test("staging environment test", async ({ page, switchScenario }) => {
  await switchScenario(page, "myScenario", {
    baseURL: "https://staging.example.com", // Override for this test only
    endpoint: "/api/custom-endpoint",
  });

  await page.goto("/");
  // Test against staging environment
});
```

## Advanced: Standalone `switchScenario` Function

For cases where you need manual control over test IDs or can't use fixtures:

```typescript
import { test, expect } from "@playwright/test";
import { switchScenario } from "@scenarist/playwright-helpers";

test("premium user scenario", async ({ page }) => {
  // Switch to premium scenario (generates unique test ID, sets headers automatically)
  await switchScenario(page, "premiumUser", {
    baseURL: "http://localhost:3000",
    endpoint: "/api/__scenario__",
  });

  // Navigate and test as premium user
  await page.goto("/");
  await expect(page.locator(".premium-badge")).toBeVisible();
});
```

> **Note on testing**: This package has comprehensive behavior-driven tests at the package level. This is NOT unit testing - we test observable behavior through the public API only. See [Testing Philosophy](#testing-philosophy) below for full rationale.

#### Options

```typescript
type SwitchScenarioOptions = {
  readonly baseURL: string; // Base URL of your application
  readonly endpoint?: string; // Scenario endpoint path or absolute URL (default: '/__scenario__')
  readonly testIdHeader?: string; // Test ID header name (default: 'x-scenarist-test-id')
  readonly variant?: string; // Optional scenario variant
};
```

> **Tip:** Use an absolute URL for `endpoint` when your API runs on a different host/port than the frontend. See [Cross-Origin API Servers](#cross-origin-api-servers).

#### What it does

The `switchScenario` helper:

1. Generates a unique test ID (`test-{scenarioId}-{timestamp}`)
2. POSTs to the scenario endpoint with the test ID header
3. Verifies the scenario switch succeeded (200 response)
4. Sets the test ID header for all subsequent requests in the test

This reduces scenario switching from 9 lines of boilerplate to 2 lines:

**Without helper (9 lines):**

```typescript
const testId = `test-premium-${Date.now()}`;
const response = await page.request.post(
  "http://localhost:3000/api/__scenario__",
  {
    headers: { "x-scenarist-test-id": testId },
    data: { scenario: "premiumUser" },
  },
);
expect(response.status()).toBe(200);
await page.setExtraHTTPHeaders({ "x-scenarist-test-id": testId });
```

**With helper (2 lines):**

```typescript
await switchScenario(page, "premiumUser", {
  baseURL: "http://localhost:3000",
  endpoint: "/api/__scenario__",
});
```

**Code reduction: 77%**

## API Reference

### Fixtures API (Recommended)

#### `withScenarios(scenarios)`

Creates a type-safe Playwright test object with Scenarist fixtures.

```typescript
// tests/fixtures.ts
import { withScenarios, expect } from "@scenarist/playwright-helpers";
import { scenarios } from "../lib/scenarios";

export const test = withScenarios(scenarios);
export { expect };
```

```typescript
// tests/my-test.spec.ts
import { test, expect } from "./fixtures";

test("my test", async ({ page, switchScenario, scenaristTestId }) => {
  // Your test code
});
```

**Fixtures provided:**

- `switchScenario(page, scenarioId, options?)` - Switch to a scenario (auto-injects test ID)
- `scenaristTestId` - Unique test ID for this test (usually don't need to access directly)
- `debugState(page)` - Get current test state from debug endpoint (useful for debugging)
- `waitForDebugState(page, condition, options?)` - Wait for state to meet a condition

#### `expect`

Re-exported from `@playwright/test` for convenience:

```typescript
import { withScenarios, expect } from "@scenarist/playwright-helpers";
```

#### Configuration Options

Set in `playwright.config.ts`:

```typescript
export default defineConfig({
  use: {
    baseURL: "http://localhost:3000", // Standard Playwright (used by switchScenario)
    scenaristEndpoint: "/api/__scenario__", // Scenarist endpoint path (default: '/api/__scenario__')
  },
});
```

**Available options:**

- `scenaristEndpoint?: string` - The endpoint path or absolute URL for scenario switching (default: `'/api/__scenario__'`)
- `scenaristStateEndpoint?: string` - The endpoint path for debug state inspection (default: `'/__scenarist__/state'`)

### Cross-Origin API Servers

When your API server runs on a different host or port than your frontend, use an **absolute URL** for `scenaristEndpoint`:

```typescript
// Frontend: http://localhost:3000
// API Server: http://localhost:9090
export default defineConfig<ScenaristOptions>({
  use: {
    baseURL: "http://localhost:3000", // Frontend URL (for Playwright navigation)
    scenaristEndpoint: "http://localhost:9090/__scenario__", // Absolute URL to API
  },
});
```

**How it works:**

- **Relative paths** (e.g., `/api/__scenario__`) are prepended with `baseURL`
- **Absolute URLs** (starting with `http://` or `https://`) are used directly, ignoring `baseURL`

This is useful when:

- Your API and frontend are separate services on different ports
- You're testing against a staging/production API endpoint
- Your test infrastructure uses a separate mock server

### Debug State Fixtures

When testing multi-stage flows with state-aware mocking, you may need to inspect or wait for internal state changes. The `debugState` and `waitForDebugState` fixtures help debug test failures and verify state mutations.

#### `debugState` (Fixture)

Fetches the current test state from the debug endpoint. Useful for debugging and verifying `afterResponse.setState` worked correctly.

```typescript
import { test, expect } from "./fixtures";

test("loan application flow", async ({ page, switchScenario, debugState }) => {
  await switchScenario(page, "loanApplication");

  // Before any actions - state should be empty
  const initialState = await debugState(page);
  expect(initialState).toEqual({});

  // Navigate and submit application
  await page.goto("/apply");
  await page.getByRole("button", { name: "Submit" }).click();

  // Verify state was set by afterResponse.setState
  const state = await debugState(page);
  expect(state.submitted).toBe(true);
  expect(state.phase).toBe("review");
});
```

**When to use `debugState`:**

- Debugging failing tests ("why is the response wrong?")
- Verifying `afterResponse.setState` worked correctly
- Understanding state progression through multi-step flows
- Testing conditional `afterResponse` behavior

#### `waitForDebugState` (Fixture)

Waits for the test state to meet a condition. Useful for async flows where state changes after a delay.

```typescript
import { test, expect } from "./fixtures";

test("async approval flow", async ({
  page,
  switchScenario,
  waitForDebugState,
}) => {
  await switchScenario(page, "asyncApproval");
  await page.goto("/dashboard");

  // Trigger async approval process
  await page.getByRole("button", { name: "Request Approval" }).click();

  // Wait for state to indicate approval completed
  const state = await waitForDebugState(
    page,
    (s) => s.approved === true,
    { timeout: 10000 }, // Wait up to 10 seconds
  );

  expect(state.approved).toBe(true);
  expect(state.approvedBy).toBeDefined();
});
```

**Parameters:**

- `page: Page` - Playwright Page object
- `condition: (state: Record<string, unknown>) => boolean` - Function that returns true when state is ready
- `options?: { timeout?: number; interval?: number }` - Optional configuration
  - `timeout` - Maximum time to wait in ms (default: 5000)
  - `interval` - Polling interval in ms (default: 100)

**Throws:** Error if condition is not met within timeout.

#### Setting Up the Debug Endpoint

The debug fixtures require a debug state endpoint in your application. Create it alongside your scenario endpoint:

**Pages Router:**

```typescript
// pages/api/__scenarist__/state.ts
import { scenarist } from "@/lib/scenarist";

export default scenarist?.createStateEndpoint();
```

**App Router:**

```typescript
// app/api/%5F%5Fscenarist%5F%5F/state/route.ts
import { scenarist } from "@/lib/scenarist";

const handler = scenarist?.createStateEndpoint();
export const GET = handler;
```

**Express:**

```typescript
// The state endpoint is automatically included in scenarist.middleware
// No additional setup needed!
```

#### `switchScenario` (Fixture)

Switch to a scenario using the automatically generated test ID.

```typescript
await switchScenario(page, scenarioId, options?)
```

**Parameters:**

- `page: Page` - Playwright Page object
- `scenarioId: string` - The scenario to switch to
- `options?: { baseURL?: string; endpoint?: string }` - Optional overrides (rarely needed)

**What it does:**

1. Reads `baseURL` from Playwright config (or uses override)
2. Reads `scenaristEndpoint` from Playwright config (or uses override)
3. Generates unique test ID automatically (via `scenaristTestId` fixture)
4. POSTs to scenario endpoint with test ID header
5. Verifies scenario switch succeeded
6. Sets test ID header for all subsequent requests

### Standalone API (Advanced)

#### `switchScenario` (Function)

For manual test ID control:

```typescript
import { switchScenario } from "@scenarist/playwright-helpers";

await switchScenario(page, scenarioId, {
  baseURL: "http://localhost:3000",
  endpoint: "/api/__scenario__",
  testId: "my-custom-test-id", // Manual test ID
});
```

**Use this only when:**

- You need to share test IDs across multiple tests
- You're integrating with existing test infrastructure that provides test IDs
- You can't use Playwright fixtures for some reason

**⚠️ Warning:** Manual test IDs can cause collisions in parallel execution. The fixture API is safer.

## Common Pitfalls

### ❌ Don't: Switch scenarios after navigation

```typescript
import { test, expect } from "./fixtures"; // Import from YOUR fixtures file

test("bad example", async ({ page, switchScenario }) => {
  await page.goto("/"); // BAD - Navigating first
  await switchScenario(page, "premium"); // Headers set too late!
});
```

**Why it fails**: Headers set AFTER navigation don't affect the already-loaded page.

**Solution**: ✅ Switch scenario BEFORE navigating:

```typescript
import { test, expect } from "./fixtures";

test("good example", async ({ page, switchScenario }) => {
  await switchScenario(page, "premium"); // Set headers first
  await page.goto("/"); // Now requests use test ID header
});
```

---

### ❌ Don't: Forget to configure in playwright.config.ts

```typescript
// playwright.config.ts - Missing configuration!
export default defineConfig({
  use: {
    // Missing: baseURL and scenaristEndpoint
  },
});
```

**Error**: `switchScenario` won't know where to send requests.

**Solution**: ✅ Configure in `playwright.config.ts`:

```typescript
export default defineConfig({
  use: {
    baseURL: "http://localhost:3000",
    scenaristEndpoint: "/api/__scenario__",
  },
});
```

---

### ❌ Don't: Use standalone `switchScenario` with manual test IDs

```typescript
import { switchScenario } from "@scenarist/playwright-helpers";

test("bad example", async ({ page }) => {
  // BAD - Manual test ID risks conflicts
  await switchScenario(page, "premium", {
    baseURL: "http://localhost:3000",
    endpoint: "/api/__scenario__",
    testId: "my-test", // Same ID across parallel tests = collision!
  });
});
```

**Why it fails**: Multiple tests with the same ID will interfere with each other in parallel execution.

**Solution**: ✅ Use the fixture API (auto-generates unique IDs):

```typescript
import { test, expect } from "./fixtures"; // Import from YOUR fixtures file

test("good example", async ({ page, switchScenario }) => {
  await switchScenario(page, "premium");
  // Generates unique ID automatically: test-abc123-{uuid}
});
```

## Why This Package Exists

Before this helper, switching scenarios in Playwright tests required significant boilerplate:

1. Generate unique test ID
2. Construct scenario endpoint URL
3. Send POST request with test ID header
4. Verify response status
5. Set test ID header for all subsequent requests

This 9-line pattern was repeated in every test, making tests verbose and error-prone. The `switchScenario` helper encapsulates this pattern into a single function call, reducing code by 77% while improving readability and maintainability.

## Documentation

📖 **[Full Documentation](https://scenarist.io)** - Complete guides, API reference, and examples.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
