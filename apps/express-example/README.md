# Scenarist Express Example

This example demonstrates how to use Scenarist with an Express application for powerful E2E testing with runtime scenario switching.

## What This Example Shows

- ✅ **Runtime Scenario Switching** - Switch between different API behaviors without restarting your app
- ✅ **Test ID Isolation** - Run multiple tests concurrently with different scenarios
- ✅ **Default Scenario Fallback** - Partial scenarios automatically fall back to default for unmocked endpoints
- ✅ **Real API Integration** - Your actual Express routes call external APIs (mocked by MSW)
- ✅ **Complete E2E Tests** - Full integration tests with supertest

## Running the Example

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Start the server (for manual testing)
pnpm dev
```

## Project Structure

```
src/
├── server.ts              # Express app with Scenarist setup
├── scenarios.ts           # Scenario definitions
└── routes/
    ├── github.ts          # Routes calling GitHub API
    ├── weather.ts         # Routes calling Weather API
    └── stripe.ts          # Routes calling Stripe API

tests/
├── scenario-switching.test.ts    # Tests scenario switching
├── test-id-isolation.test.ts     # Tests test ID isolation
└── default-fallback.test.ts      # Tests default scenario fallback
```

## How It Works

### 1. Setup Scenarist

```typescript
import { createScenarist } from '@scenarist/express-adapter';

const scenarist = createScenarist({
  enabled: true,
  strictMode: false  // Allow passthrough for unmocked requests
});

// Register scenarios
scenarist.registerScenario(defaultScenario);
scenarist.registerScenario(successScenario);
scenarist.registerScenario(errorScenario);

// Apply middleware
app.use(scenarist.middleware);

// Start MSW
scenarist.start();
```

### 2. Define Scenarios

Scenarios are serializable data (no functions!) that define how external APIs should respond:

```typescript
export const successScenario: ScenarioDefinition = {
  id: 'success',
  name: 'Success Scenario',
  description: 'All external API calls succeed',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      response: {
        status: 200,
        body: {
          login: 'testuser',
          id: 123,
          name: 'Test User',
          // ... more fields
        },
      },
    },
    // More mocks...
  ],
};
```

### 3. Write Your Express Routes

Your routes call real external APIs - Scenarist intercepts them:

```typescript
router.get('/api/github/user/:username', async (req, res) => {
  const { username } = req.params;

  // This fetch is intercepted by MSW
  const response = await fetch(`https://api.github.com/users/${username}`);
  const data = await response.json();

  res.status(response.status).json(data);
});
```

### 4. Write E2E Tests

Tests can switch scenarios dynamically and are isolated by test ID:

```typescript
describe('GitHub API Integration', () => {
  beforeAll(() => {
    scenarist.start();
  });

  afterAll(() => {
    scenarist.stop();
  });

  it('should return user data when using success scenario', async () => {
    // Switch to success scenario for this test
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-1')
      .send({ scenario: 'success' });

    // Make request
    const response = await request(app)
      .get('/api/github/user/testuser')
      .set('x-test-id', 'test-1');

    expect(response.status).toBe(200);
    expect(response.body.login).toBe('testuser');
  });

  it('should return 404 when using error scenario', async () => {
    // Switch to error scenario for this test
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-2')
      .send({ scenario: 'github-not-found' });

    // Make request
    const response = await request(app)
      .get('/api/github/user/nonexistent')
      .set('x-test-id', 'test-2');

    expect(response.status).toBe(404);
  });
});
```

## Key Features Demonstrated

### Scenario Switching

```bash
# Switch scenario for a specific test ID
POST /__scenario__
Headers: x-test-id: my-test
Body: { "scenario": "success" }

# Get current scenario
GET /__scenario__
Headers: x-test-id: my-test
```

### Test ID Isolation

Each test ID has its own scenario state. Tests run in parallel don't affect each other:

```typescript
// Test 1 uses success scenario
await request(app)
  .post('/__scenario__')
  .set('x-test-id', 'test-1')
  .send({ scenario: 'success' });

// Test 2 uses error scenario - completely independent!
await request(app)
  .post('/__scenario__')
  .set('x-test-id', 'test-2')
  .send({ scenario: 'error' });
```

### Default Scenario Fallback

If a scenario doesn't define a mock for a specific endpoint, it automatically falls back to the default scenario:

```typescript
// weather-error scenario only defines weather API mocks
await request(app)
  .post('/__scenario__')
  .set('x-test-id', 'partial-test')
  .send({ scenario: 'weather-error' });

// Weather API uses weather-error scenario (returns 500)
await request(app)
  .get('/api/weather/tokyo')
  .set('x-test-id', 'partial-test');
// => 500 error

// GitHub API falls back to default scenario (returns success)
await request(app)
  .get('/api/github/user/testuser')
  .set('x-test-id', 'partial-test');
// => 200 success with default data
```

## Available Scenarios

This example includes several scenarios:

- **default** - Basic successful responses for all APIs
- **success** - All APIs return successful responses
- **github-not-found** - GitHub API returns 404
- **weather-error** - Weather API returns 500
- **stripe-failure** - Stripe payment fails (402)
- **slow-network** - All APIs respond with 1-2 second delays
- **mixed-results** - Some APIs succeed, others fail

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test scenario-switching.test.ts

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test --coverage
```

## Test Results

All tests pass, demonstrating:

- ✅ 10 scenario switching tests
- ✅ 4 test ID isolation tests
- ✅ 6 default fallback tests
- ✅ **20 total tests passing**

## Next Steps

1. Add more scenarios for different edge cases
2. Add more external API integrations
3. Try concurrent test execution: `pnpm test --reporter=verbose`
4. Explore variant support for parameterized scenarios

## Learn More

- [Scenarist Documentation](../../README.md)
- [Architecture Guide](../../CLAUDE.md)
- [Implementation Plan](../../MSW_EXPRESS_IMPLEMENTATION.md)
