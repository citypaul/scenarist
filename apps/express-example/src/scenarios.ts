import type { ScenarioDefinition } from '@scenarist/core';

/**
 * Default scenario - always available as fallback
 * Contains basic successful responses for all external APIs
 */
export const defaultScenario: ScenarioDefinition = {
  id: 'default',
  name: 'Default Scenario',
  description: 'Default successful responses for all external APIs',
  mocks: [
    // GitHub API - Get user profile
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      response: {
        status: 200,
        body: {
          login: 'octocat',
          id: 1,
          name: 'The Octocat',
          bio: 'GitHub mascot',
          public_repos: 8,
          followers: 1000,
        },
      },
    },
    // Weather API - Get current weather
    {
      method: 'GET',
      url: 'https://api.weather.com/v1/weather/:city',
      response: {
        status: 200,
        body: {
          city: 'London',
          temperature: 18,
          conditions: 'Cloudy',
          humidity: 65,
        },
      },
    },
    // Stripe API - Create payment
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: {
          id: 'ch_default123',
          status: 'succeeded',
          amount: 1000,
          currency: 'usd',
        },
      },
    },
  ],
};

/**
 * Scenario: All APIs return successful responses
 */
export const successScenario: ScenarioDefinition = {
  id: 'success',
  name: 'Success Scenario',
  description: 'All external API calls succeed with valid data',
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
          bio: 'Test bio',
          public_repos: 42,
          followers: 1337,
        },
      },
    },
    {
      method: 'GET',
      url: 'https://api.weather.com/v1/weather/:city',
      response: {
        status: 200,
        body: {
          city: 'San Francisco',
          temperature: 22,
          conditions: 'Sunny',
          humidity: 45,
        },
      },
    },
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: {
          id: 'ch_success123',
          status: 'succeeded',
          amount: 5000,
          currency: 'usd',
        },
      },
    },
  ],
};

/**
 * Scenario: GitHub API returns 404 (user not found)
 */
export const githubNotFoundScenario: ScenarioDefinition = {
  id: 'github-not-found',
  name: 'GitHub User Not Found',
  description: 'GitHub API returns 404 for user lookup',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      response: {
        status: 404,
        body: {
          message: 'Not Found',
          documentation_url: 'https://docs.github.com',
        },
      },
    },
  ],
};

/**
 * Scenario: Weather API returns server error
 */
export const weatherErrorScenario: ScenarioDefinition = {
  id: 'weather-error',
  name: 'Weather API Error',
  description: 'Weather API returns 500 server error',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.weather.com/v1/weather/:city',
      response: {
        status: 500,
        body: {
          error: 'Internal Server Error',
          message: 'Weather service temporarily unavailable',
        },
      },
    },
  ],
};

/**
 * Scenario: Stripe payment fails (insufficient funds)
 */
export const stripeFailureScenario: ScenarioDefinition = {
  id: 'stripe-failure',
  name: 'Stripe Payment Failure',
  description: 'Stripe payment fails due to insufficient funds',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 402,
        body: {
          error: {
            type: 'card_error',
            code: 'insufficient_funds',
            message: 'Your card has insufficient funds.',
          },
        },
      },
    },
  ],
};

/**
 * Scenario: APIs return with delays (slow network)
 */
export const slowNetworkScenario: ScenarioDefinition = {
  id: 'slow-network',
  name: 'Slow Network',
  description: 'All APIs respond slowly (1-2 second delays)',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      response: {
        status: 200,
        body: {
          login: 'slowuser',
          id: 999,
          name: 'Slow User',
          bio: 'Slow network test',
          public_repos: 5,
          followers: 10,
        },
        delay: 1500,
      },
    },
    {
      method: 'GET',
      url: 'https://api.weather.com/v1/weather/:city',
      response: {
        status: 200,
        body: {
          city: 'Tokyo',
          temperature: 25,
          conditions: 'Clear',
          humidity: 55,
        },
        delay: 2000,
      },
    },
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: {
          id: 'ch_slow123',
          status: 'succeeded',
          amount: 3000,
          currency: 'usd',
        },
        delay: 1000,
      },
    },
  ],
};

/**
 * Scenario: Mixed results (some succeed, some fail)
 */
export const mixedResultsScenario: ScenarioDefinition = {
  id: 'mixed-results',
  name: 'Mixed Results',
  description: 'Some APIs succeed, others fail',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      response: {
        status: 200,
        body: {
          login: 'mixeduser',
          id: 456,
          name: 'Mixed User',
          bio: 'Test mixed scenario',
          public_repos: 15,
          followers: 100,
        },
      },
    },
    {
      method: 'GET',
      url: 'https://api.weather.com/v1/weather/:city',
      response: {
        status: 503,
        body: {
          error: 'Service Unavailable',
          message: 'Weather service is temporarily down',
        },
      },
    },
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: {
          id: 'ch_mixed123',
          status: 'succeeded',
          amount: 2500,
          currency: 'usd',
        },
      },
    },
  ],
};

/**
 * Scenario: Request content matching (Phase 1 - Dynamic Responses)
 * Demonstrates matching on request body, headers, and query parameters
 */
export const contentMatchingScenario: ScenarioDefinition = {
  id: 'content-matching',
  name: 'Content Matching',
  description: 'Different responses based on request content (body, headers, query)',
  mocks: [
    // Stripe: Premium items get discounted pricing (body match)
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      match: { body: { itemType: 'premium' } },
      response: {
        status: 200,
        body: {
          id: 'ch_premium123',
          status: 'succeeded',
          amount: 8000, // Discounted from 10000
          currency: 'usd',
          discount: 'premium_item_discount',
        },
      },
    },
    // Stripe: Standard items get regular pricing (body match)
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      match: { body: { itemType: 'standard' } },
      response: {
        status: 200,
        body: {
          id: 'ch_standard123',
          status: 'succeeded',
          amount: 5000,
          currency: 'usd',
        },
      },
    },
    // Stripe: Fallback for other payment types
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: {
          id: 'ch_fallback123',
          status: 'succeeded',
          amount: 1000,
          currency: 'usd',
        },
      },
    },
    // GitHub: Premium users get enhanced data (header match)
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      match: { headers: { 'x-user-tier': 'premium' } },
      response: {
        status: 200,
        body: {
          login: 'premium-user',
          id: 999,
          name: 'Premium User',
          bio: 'Premium tier access',
          public_repos: 100,
          followers: 5000,
          private_repos: 50, // Extra field for premium users
          total_private_repos: 50,
        },
      },
    },
    // GitHub: Standard users get basic data (header match)
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      match: { headers: { 'x-user-tier': 'standard' } },
      response: {
        status: 200,
        body: {
          login: 'standard-user',
          id: 100,
          name: 'Standard User',
          bio: 'Standard tier access',
          public_repos: 20,
          followers: 100,
        },
      },
    },
    // GitHub: Fallback for users without tier header
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      response: {
        status: 200,
        body: {
          login: 'guest-user',
          id: 1,
          name: 'Guest User',
          bio: 'No tier specified',
          public_repos: 5,
          followers: 10,
        },
      },
    },
    // Weather: Filtered results (query param match)
    {
      method: 'GET',
      url: 'https://api.weather.com/v1/weather/:city',
      match: { query: { units: 'metric', detailed: 'true' } },
      response: {
        status: 200,
        body: {
          city: 'Paris',
          temperature: 20,
          conditions: 'Partly Cloudy',
          humidity: 60,
          windSpeed: 15, // Extra detail when detailed=true
          pressure: 1013,
          visibility: 10,
        },
      },
    },
    // Weather: Standard results (query param match for units only)
    {
      method: 'GET',
      url: 'https://api.weather.com/v1/weather/:city',
      match: { query: { units: 'imperial' } },
      response: {
        status: 200,
        body: {
          city: 'New York',
          temperature: 68,
          conditions: 'Sunny',
          humidity: 50,
        },
      },
    },
    // Weather: Fallback
    {
      method: 'GET',
      url: 'https://api.weather.com/v1/weather/:city',
      response: {
        status: 200,
        body: {
          city: 'Default City',
          temperature: 15,
          conditions: 'Clear',
          humidity: 55,
        },
      },
    },
  ],
};

/**
 * Scenario: GitHub job polling (Phase 2 - Response Sequences)
 * Demonstrates sequence progression with repeat: 'last'
 */
export const githubPollingScenario: ScenarioDefinition = {
  id: 'github-polling',
  name: 'GitHub Job Polling Sequence',
  description: 'Simulates async GitHub job polling with state progression',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      sequence: {
        responses: [
          { status: 200, body: { status: 'pending', progress: 0, login: 'user1' } },
          { status: 200, body: { status: 'processing', progress: 50, login: 'user2' } },
          { status: 200, body: { status: 'complete', progress: 100, login: 'user3' } },
        ],
        repeat: 'last',
      },
    },
  ],
};

/**
 * Scenario: Weather cycling (Phase 2 - Response Sequences)
 * Demonstrates sequence cycling with repeat: 'cycle'
 */
export const weatherCycleScenario: ScenarioDefinition = {
  id: 'weather-cycle',
  name: 'Weather Cycle Sequence',
  description: 'Cycles through weather states infinitely',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.weather.com/v1/weather/:city',
      sequence: {
        responses: [
          { status: 200, body: { city: 'London', conditions: 'Sunny', temp: 20 } },
          { status: 200, body: { city: 'London', conditions: 'Cloudy', temp: 18 } },
          { status: 200, body: { city: 'London', conditions: 'Rainy', temp: 15 } },
        ],
        repeat: 'cycle',
      },
    },
  ],
};

/**
 * Scenario: Payment attempts with limits (Phase 2 - Response Sequences)
 * Demonstrates sequence exhaustion with repeat: 'none' and fallback mock
 */
export const paymentLimitedScenario: ScenarioDefinition = {
  id: 'payment-limited',
  name: 'Limited Payment Attempts',
  description: 'Allows 3 attempts then falls back to error',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      sequence: {
        responses: [
          { status: 200, body: { id: 'ch_1', status: 'pending' } },
          { status: 200, body: { id: 'ch_2', status: 'pending' } },
          { status: 200, body: { id: 'ch_3', status: 'succeeded' } },
        ],
        repeat: 'none',
      },
    },
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 429,
        body: { error: { message: 'Rate limit exceeded' } },
      },
    },
  ],
};

/**
 * Scenario: Shopping Cart (Phase 3 - Stateful Mocks)
 * Demonstrates state capture and injection across multiple requests.
 *
 * Flow:
 * 1. POST /cart/add - Captures item and appends to cartItems[] array
 * 2. GET /cart - Injects cartItems into response with count
 */
export const shoppingCartScenario: ScenarioDefinition = {
  id: 'shoppingCart',
  name: 'Shopping Cart (Stateful)',
  description: 'Stateful shopping cart with capture and injection',
  mocks: [
    // Add item to cart - captures item
    {
      method: 'POST',
      url: 'https://api.store.com/cart/add',
      captureState: {
        'cartItems[]': 'body.item',  // Append to array
      },
      response: {
        status: 200,
        body: {
          success: true,
          message: 'Item added to cart',
        },
      },
    },
    // Get cart - injects captured items
    {
      method: 'GET',
      url: 'https://api.store.com/cart',
      response: {
        status: 200,
        body: {
          items: '{{state.cartItems}}',  // Inject items array
          count: '{{state.cartItems.length}}',  // Inject array length
          total: 0,  // Would calculate from items in real app
        },
      },
    },
  ],
};

/**
 * Scenario: Multi-Step Form (Phase 3 - Stateful Mocks)
 * Demonstrates state capture across form steps with validation.
 *
 * Flow:
 * 1. POST /form/step1 - Captures user info (name, email)
 * 2. POST /form/step2 - Captures address, injects user info in response
 * 3. POST /form/submit - Injects all captured state in confirmation
 */
export const multiStepFormScenario: ScenarioDefinition = {
  id: 'multiStepForm',
  name: 'Multi-Step Form (Stateful)',
  description: 'Multi-step form with state persistence',
  mocks: [
    // Step 1: User info
    {
      method: 'POST',
      url: 'https://api.forms.com/form/step1',
      captureState: {
        'userName': 'body.name',
        'userEmail': 'body.email',
      },
      response: {
        status: 200,
        body: {
          success: true,
          message: 'Step 1 completed',
          nextStep: '/form/step2',
        },
      },
    },
    // Step 2: Address
    {
      method: 'POST',
      url: 'https://api.forms.com/form/step2',
      captureState: {
        'userAddress': 'body.address',
        'userCity': 'body.city',
      },
      response: {
        status: 200,
        body: {
          success: true,
          message: 'Step 2 completed for {{state.userName}}',
          nextStep: '/form/submit',
        },
      },
    },
    // Step 3: Submit - inject all captured state
    {
      method: 'POST',
      url: 'https://api.forms.com/form/submit',
      response: {
        status: 200,
        body: {
          success: true,
          message: 'Form submitted successfully',
          confirmation: {
            name: '{{state.userName}}',
            email: '{{state.userEmail}}',
            address: '{{state.userAddress}}',
            city: '{{state.userCity}}',
            confirmationId: 'CONF-12345',
          },
        },
      },
    },
  ],
};

/**
 * Scenarios organized as typed object for easy access in tests.
 *
 * Use this to get type-safe access to scenario IDs:
 *
 * @example
 * ```typescript
 * await request(app)
 *   .post(scenarist.config.endpoints.setScenario)
 *   .send({ scenario: scenarios.success.id });
 * ```
 */
export const scenarios = {
  default: defaultScenario,
  success: successScenario,
  githubNotFound: githubNotFoundScenario,
  weatherError: weatherErrorScenario,
  stripeFailure: stripeFailureScenario,
  slowNetwork: slowNetworkScenario,
  mixedResults: mixedResultsScenario,
  contentMatching: contentMatchingScenario,
  githubPolling: githubPollingScenario,
  weatherCycle: weatherCycleScenario,
  paymentLimited: paymentLimitedScenario,
  shoppingCart: shoppingCartScenario,
  multiStepForm: multiStepFormScenario,
} as const;

