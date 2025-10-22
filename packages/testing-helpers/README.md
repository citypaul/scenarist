# @scenarist/testing-helpers

Type-safe testing utilities for Scenarist. Provides autocomplete and type checking for scenario IDs, eliminating runtime errors from typos.

## Installation

```bash
pnpm add -D @scenarist/testing-helpers
# or
npm install --save-dev @scenarist/testing-helpers
# or
yarn add --dev @scenarist/testing-helpers
```

## The Problem

Without type-safe helpers, switching scenarios requires magic strings:

```typescript
// ❌ No autocomplete, easy to typo, runtime errors
await request(app)
  .post('/__scenario__')
  .set('x-test-id', 'test-123')
  .send({ scenario: 'github-not-found' }); // Did I spell that right?
```

## The Solution

`@scenarist/testing-helpers` provides a type-safe client with full autocomplete:

```typescript
// ✅ Autocomplete works, typos caught at compile time!
await client.switchTo('githubNotFound', 'test-123');
```

## Usage

### Basic Setup

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createScenaristTestClient } from '@scenarist/testing-helpers';
import { createApp } from '../src/server.js';
import {
  successScenario,
  githubNotFoundScenario,
  weatherErrorScenario,
} from '../src/scenarios.js';

describe('My API Tests', () => {
  const { app, scenarist } = createApp();

  // Create type-safe client with scenario registry
  const scenarios = {
    success: successScenario,
    githubNotFound: githubNotFoundScenario,
    weatherError: weatherErrorScenario,
  } as const;

  const client = createScenaristTestClient(() => request(app), scenarios);

  it('should use success scenario', async () => {
    // Switch scenario - fully typed with autocomplete!
    await client.switchTo('success', 'test-123');

    // Make request
    const response = await request(app)
      .get('/api/github/user/testuser')
      .set('x-test-id', 'test-123');

    expect(response.status).toBe(200);
    expect(response.body.login).toBe('testuser');
  });
});
```

### API Reference

#### `createScenaristTestClient(requestBuilder, scenarios, config?)`

Creates a type-safe test client.

**Parameters:**

- `requestBuilder`: Function that returns a supertest request instance
- `scenarios`: Object mapping keys to `ScenarioDefinition` objects
- `config` (optional): Configuration options

**Returns:** `ScenaristTestClient<T>`

**Example:**

```typescript
const client = createScenaristTestClient(
  () => request(app),
  {
    success: successScenario,
    error: errorScenario,
  },
  {
    scenarioEndpoint: '/__scenario__', // default
    testIdHeader: 'x-test-id', // default
  }
);
```

#### `client.switchTo(key, testId?)`

Switch to a specific scenario.

**Parameters:**

- `key`: Scenario key (typed based on your scenarios object)
- `testId` (optional): Test ID for test isolation

**Returns:** Supertest `Test` instance for chaining assertions

**Example:**

```typescript
// Switch without test ID
await client.switchTo('success');

// Switch with test ID
await client.switchTo('success', 'test-123');

// Chain assertions on the switch response
const response = await client.switchTo('success', 'test-456');
expect(response.status).toBe(200);
expect(response.body.success).toBe(true);
```

#### `client.getCurrent(testId?)`

Get the currently active scenario.

**Parameters:**

- `testId` (optional): Test ID for test isolation

**Returns:** Supertest `Test` instance for chaining assertions

**Example:**

```typescript
// Get current scenario
const response = await client.getCurrent('test-123');
expect(response.body.scenarioId).toBe('success');

// Without test ID
const response = await client.getCurrent();
```

#### `client.scenarios`

Access to the scenarios registry.

**Example:**

```typescript
// Get scenario ID
const successId = client.scenarios.success.id;

// Access scenario definition
const successName = client.scenarios.success.name;
```

## Type Safety

The client provides full type safety:

```typescript
const scenarios = {
  success: successScenario,
  error: errorScenario,
} as const;

const client = createScenaristTestClient(() => request(app), scenarios);

// ✅ These compile fine - keys exist
client.switchTo('success');
client.switchTo('error');

// ❌ TypeScript error - 'typo' is not a valid key
client.switchTo('typo');
```

The `as const` assertion is important for proper type inference!

## Custom Configuration

### Custom Scenario Endpoint

```typescript
const client = createScenaristTestClient(
  () => request(app),
  scenarios,
  {
    scenarioEndpoint: '/custom-scenario-endpoint',
  }
);

// Now uses /custom-scenario-endpoint instead of /__scenario__
await client.switchTo('success');
```

### Custom Test ID Header

```typescript
const client = createScenaristTestClient(
  () => request(app),
  scenarios,
  {
    testIdHeader: 'x-custom-test-id',
  }
);

// Now uses x-custom-test-id header instead of x-test-id
await client.switchTo('success', 'test-123');
```

## Benefits

### ✅ **Autocomplete Support**

Your IDE shows all available scenarios:

```typescript
client.switchTo('|'); // <-- IDE shows: success, error, githubNotFound, etc.
```

### ✅ **Compile-Time Safety**

Typos are caught before runtime:

```typescript
client.switchTo('sucess'); // ❌ TypeScript error immediately
```

### ✅ **Refactor-Safe**

Rename a scenario key, and TypeScript shows all locations that need updating.

### ✅ **Self-Documenting**

The scenarios object serves as documentation of available test scenarios.

### ✅ **Clean API**

No more verbose request builders - clean, readable test code:

```typescript
// Before
await request(app)
  .post('/__scenario__')
  .set('x-test-id', 'test-123')
  .send({ scenario: 'github-not-found' });

// After
await client.switchTo('githubNotFound', 'test-123');
```

## Integration with Testing Frameworks

### Vitest

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createScenaristTestClient } from '@scenarist/testing-helpers';

describe('API Tests', () => {
  const { app, scenarist } = createApp();
  const client = createScenaristTestClient(() => request(app), scenarios);

  beforeAll(() => scenarist.start());
  afterAll(() => scenarist.stop());

  it('works with success scenario', async () => {
    await client.switchTo('success', 'test-1');
    // ...
  });
});
```

### Jest

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createScenaristTestClient } from '@scenarist/testing-helpers';

describe('API Tests', () => {
  const { app, scenarist } = createApp();
  const client = createScenaristTestClient(() => request(app), scenarios);

  beforeAll(() => scenarist.start());
  afterAll(() => scenarist.stop());

  it('works with success scenario', async () => {
    await client.switchTo('success', 'test-1');
    // ...
  });
});
```

### Playwright

While this package is designed for supertest, the pattern can be adapted for Playwright:

```typescript
// Create a typed helper for Playwright
const switchScenario = async (page: Page, key: keyof typeof scenarios) => {
  await page.request.post('http://localhost:3000/__scenario__', {
    data: { scenario: scenarios[key].id },
  });
};

// Use in tests
await switchScenario(page, 'success'); // ✅ Typed!
```

## Examples

### Complete Test Suite

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createScenaristTestClient } from '@scenarist/testing-helpers';
import { createApp } from '../src/server.js';
import * as scenarios from '../src/scenarios.js';

describe('E2E Tests', () => {
  const { app, scenarist } = createApp();

  const testScenarios = {
    success: scenarios.successScenario,
    githubNotFound: scenarios.githubNotFoundScenario,
    weatherError: scenarios.weatherErrorScenario,
    stripeFailure: scenarios.stripeFailureScenario,
  } as const;

  const client = createScenaristTestClient(() => request(app), testScenarios);

  beforeAll(() => scenarist.start());
  afterAll(() => scenarist.stop());

  describe('Success scenarios', () => {
    it('should handle successful GitHub requests', async () => {
      await client.switchTo('success', 'github-success-test');

      const response = await request(app)
        .get('/api/github/user/testuser')
        .set('x-test-id', 'github-success-test');

      expect(response.status).toBe(200);
      expect(response.body.login).toBe('testuser');
    });
  });

  describe('Error scenarios', () => {
    it('should handle GitHub 404 errors', async () => {
      await client.switchTo('githubNotFound', 'github-404-test');

      const response = await request(app)
        .get('/api/github/user/nonexistent')
        .set('x-test-id', 'github-404-test');

      expect(response.status).toBe(404);
    });

    it('should handle weather service errors', async () => {
      await client.switchTo('weatherError', 'weather-error-test');

      const response = await request(app)
        .get('/api/weather/tokyo')
        .set('x-test-id', 'weather-error-test');

      expect(response.status).toBe(500);
    });
  });
});
```

## License

MIT
