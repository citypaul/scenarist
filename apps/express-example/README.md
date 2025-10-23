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

## Using the Bruno API Collection

This example includes a [Bruno](https://www.usebruno.com/) API collection for manual testing and exploration. Bruno is an open-source, Git-friendly alternative to Postman that stores collections as files in your repository.

### Installing Bruno

Download Bruno for your platform:

- **macOS**: Download from [usebruno.com](https://www.usebruno.com/downloads) or install via Homebrew:
  ```bash
  brew install bruno
  ```

- **Windows**: Download the installer from [usebruno.com](https://www.usebruno.com/downloads)

- **Linux**: Download the AppImage or use package managers:
  ```bash
  # Snap
  snap install bruno

  # Flatpak
  flatpak install flathub com.usebruno.Bruno
  ```

### Opening the Collection

1. Start the Express server:
   ```bash
   pnpm dev
   ```

2. Open Bruno application

3. Click **"Open Collection"**

4. Navigate to this directory and select the `bruno` folder:
   ```
   apps/express-example/bruno
   ```

5. The collection will load with all available requests organized in folders

### Using the Collection

The Bruno collection includes:

**Scenarios Folder** - Control which scenario is active:
- Get Active Scenario
- Set Scenario - Default
- Set Scenario - Success
- Set Scenario - GitHub Not Found
- Set Scenario - Weather Error
- Set Scenario - Stripe Failure
- Set Scenario - Slow Network
- Set Scenario - Mixed Results

**API Folder** - Test the actual application endpoints:
- GitHub - Get User
- Weather - Get Current
- Payment - Create Charge

**Health Check** - Verify server is running

### Workflow Example

1. **Set a scenario**: Run "Set Scenario - Success" to activate the success scenario
2. **Test endpoints**: Run "GitHub - Get User" to see how the API behaves with this scenario
3. **Switch scenarios**: Run "Set Scenario - GitHub Not Found"
4. **Test again**: Run "GitHub - Get User" again - now it returns 404
5. **Check active**: Run "Get Active Scenario" to confirm which scenario is active

### Environment Variables

The collection uses these environment variables (set in `environments/Local.bru`):

- `baseUrl`: `http://localhost:3000` - Server URL
- `testId`: `bruno-test` - Test ID used in x-test-id header

You can create additional environments for different setups (staging, production, etc.).

### Tips

- All requests include the `x-test-id` header automatically using `{{testId}}`
- Scenarios persist across requests, so you only need to set them once
- Use different test IDs to test multiple scenarios simultaneously
- Check the "Docs" tab in each request for detailed information

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
├── default-fallback.test.ts      # Tests default scenario fallback
└── scenario-persistence.test.ts  # Tests scenarios persist across multiple requests
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

### Scenario Persistence Across Multiple Requests

Once a scenario is set for a test ID, it persists across all subsequent requests with that test ID. This simulates real user journeys across multiple pages:

```typescript
const testId = 'user-journey';

// Set scenario once
await request(app)
  .post('/__scenario__')
  .set('x-test-id', testId)
  .send({ scenario: 'success' });

// Page 1: User profile
await request(app)
  .get('/api/github/user/john')
  .set('x-test-id', testId);
// => Uses success scenario

// Page 2: Weather dashboard
await request(app)
  .get('/api/weather/london')
  .set('x-test-id', testId);
// => Still uses success scenario

// Page 3: Payment
await request(app)
  .post('/api/payment')
  .set('x-test-id', testId)
  .send({ amount: 1000 });
// => Still uses success scenario
```

The scenario remains active until explicitly changed or cleared. This enables:
- **Realistic user journey testing** - Multiple page navigations with consistent backend state
- **Complex flow testing** - Multi-step processes (browse → add to cart → checkout → confirm)
- **Consistent behavior** - Same scenario across all requests in a test

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
- ✅ 7 scenario persistence tests (multi-request scenarios)
- ✅ **27 total tests passing**

## Next Steps

1. Add more scenarios for different edge cases
2. Add more external API integrations
3. Try concurrent test execution: `pnpm test --reporter=verbose`
4. Explore variant support for parameterized scenarios

## Learn More

- [Scenarist Documentation](../../README.md)
- [Express Adapter Documentation](../../packages/express-adapter/README.md)
- [Architecture Guide](../../CLAUDE.md)
