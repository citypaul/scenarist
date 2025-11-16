import type { ScenaristScenario, ScenaristScenarios } from '@scenarist/express-adapter';

/**
 * Default scenario - always available as fallback
 * Contains basic successful responses for all external APIs
 */
export const defaultScenario: ScenaristScenario = {
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
export const successScenario: ScenaristScenario = {
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
export const githubNotFoundScenario: ScenaristScenario = {
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
export const weatherErrorScenario: ScenaristScenario = {
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
export const stripeFailureScenario: ScenaristScenario = {
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
export const slowNetworkScenario: ScenaristScenario = {
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
export const mixedResultsScenario: ScenaristScenario = {
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
export const contentMatchingScenario: ScenaristScenario = {
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
export const githubPollingScenario: ScenaristScenario = {
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
export const weatherCycleScenario: ScenaristScenario = {
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
export const paymentLimitedScenario: ScenaristScenario = {
  id: 'payment-limited',
  name: 'Limited Payment Attempts',
  description: 'Allows 3 attempts then falls back to error',
  mocks: [
    // Fallback mock - comes first but has lower priority
    {
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 429,
        body: { error: { message: 'Rate limit exceeded' } },
      },
    },
    // Sequence mock - last fallback wins (will be selected until exhausted)
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
export const shoppingCartScenario: ScenaristScenario = {
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
export const multiStepFormScenario: ScenaristScenario = {
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
 * TEST SCENARIO: Shared polling sequence
 * Used in tests to verify test ID isolation with sequences
 */
export const sharedPollingScenario: ScenaristScenario = {
  id: 'shared-polling',
  name: 'Shared Polling Sequence',
  description: 'Multiple tests can use same scenario with independent state',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      sequence: {
        responses: [
          { status: 200, body: { step: 1 } },
          { status: 200, body: { step: 2 } },
          { status: 200, body: { step: 3 } },
        ],
        repeat: 'last',
      },
    },
  ],
};

/**
 * TEST SCENARIO: Temporary capture scenario
 * Used in tests to verify state is not reset when scenario switch fails
 */
export const tempCaptureScenario: ScenaristScenario = {
  id: 'temp-capture-scenario',
  name: 'Temp Capture Scenario',
  description: 'Temporary scenario for testing failed switch',
  mocks: [
    {
      method: 'POST',
      url: 'https://api.example.com/temp-data',
      captureState: {
        tempValue: 'body.value',
      },
      response: {
        status: 200,
        body: { success: true },
      },
    },
    {
      method: 'GET',
      url: 'https://api.example.com/temp-data',
      response: {
        status: 200,
        body: {
          value: '{{state.tempValue}}',
        },
      },
    },
  ],
};

/**
 * Campaign Regex Scenario - Testing regex pattern matching (server-side)
 *
 * Demonstrates Scenarist's regex matching feature:
 * - Intercepts server-side calls to GitHub API
 * - Matches x-campaign header against regex pattern /premium|vip/i
 * - Returns premium user data when campaign contains 'premium' or 'vip'
 * - Falls back to default scenario (guest user) when no match
 *
 * Use case: Different user tiers based on marketing campaign
 * Server-side: API route extracts campaign from query param, adds as header to fetch
 */
export const campaignRegexScenario: ScenaristScenario = {
  id: 'campaignRegex',
  name: 'Campaign Regex Matching',
  description: 'Premium user data for premium/vip campaigns',
  mocks: [
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      match: {
        headers: {
          'x-campaign': {
            regex: { source: 'premium|vip', flags: 'i' },
          },
        },
      },
      response: {
        status: 200,
        body: {
          login: 'premium-campaign-user',
          id: 9999,
          name: 'Premium Campaign User',
          bio: 'VIP access via marketing campaign',
          public_repos: 200,
          followers: 10000,
          private_repos: 100,
          total_private_repos: 100,
        },
      },
    },
  ],
};

/**
 * String Matching Scenario - Testing string matching strategies
 *
 * Demonstrates Scenarist's string matching strategies:
 * - contains: Substring matching (campaign header)
 * - startsWith: Prefix matching (API key)
 * - endsWith: Suffix matching (email domain)
 * - equals: Explicit exact matching
 *
 * Use case: Flexible request matching without regex complexity
 */
export const stringMatchingScenario: ScenaristScenario = {
  id: 'stringMatching',
  name: 'String Matching Strategies',
  description: 'Tests contains, startsWith, endsWith, and equals matching',
  mocks: [
    // Test 1: Contains strategy - campaign header containing 'premium'
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      match: {
        headers: {
          'x-campaign': { contains: 'premium' },
        },
      },
      response: {
        status: 200,
        body: {
          login: 'premium-user',
          id: 888,
          name: 'Premium User',
          bio: 'Premium campaign access',
          public_repos: 150,
          followers: 8000,
          matchedBy: 'contains',
        },
      },
    },

    // Test 2: StartsWith strategy - API key starting with 'sk_'
    {
      method: 'GET',
      url: 'https://api.stripe.com/v1/api-keys',
      match: {
        headers: {
          'x-api-key': { startsWith: 'sk_' },
        },
      },
      response: {
        status: 200,
        body: {
          valid: true,
          keyType: 'secret',
          matchedBy: 'startsWith',
        },
      },
    },

    // Test 3: EndsWith strategy - email query param ending with '@company.com'
    // Using GitHub repos endpoint as it's a known working domain
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username/repos',
      match: {
        query: {
          email: { endsWith: '@company.com' },
        },
      },
      response: {
        status: 200,
        body: {
          users: [
            { id: 1, email: 'john@company.com', role: 'admin' },
            { id: 2, email: 'jane@company.com', role: 'user' },
          ],
          matchedBy: 'endsWith',
        },
      },
    },

    // Test 4: Equals strategy - explicit exact match
    {
      method: 'GET',
      url: 'https://api.status.com/status',
      match: {
        headers: {
          'x-exact': { equals: 'exact-value' },
        },
      },
      response: {
        status: 200,
        body: {
          status: 'ok',
          message: 'Exact match successful',
          matchedBy: 'equals',
        },
      },
    },

    // Fallback: No match criteria - handles non-matching requests
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      response: {
        status: 200,
        body: {
          login: 'standard-user',
          id: 111,
          name: 'Standard User',
          bio: 'Standard access',
          public_repos: 25,
          followers: 200,
          matchedBy: 'fallback',
        },
      },
    },
  ],
};

/**
 * Scenario: URL Matching with Native RegExp
 *
 * Demonstrates URL matching capabilities:
 * - Native RegExp patterns for numeric IDs
 * - String strategies (contains, startsWith, endsWith) for URL filtering
 * - Combined matching (URL + headers/query)
 */
export const urlMatchingScenario: ScenaristScenario = {
  id: 'urlMatching',
  name: 'URL Matching Strategies',
  description: 'Tests URL matching with RegExp, string strategies, and combined criteria',
  mocks: [
    // Test 1: Native RegExp - Match numeric user IDs
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      match: {
        url: /\/users\/\d+$/, // Match URLs ending with numeric ID
      },
      response: {
        status: 200,
        body: {
          login: 'user-numeric-id',
          id: 12345,
          name: 'Numeric ID User',
          bio: 'Matched by numeric ID pattern',
          public_repos: 42,
          followers: 500,
          matchedBy: 'regexNumericId',
        },
      },
    },

    // Test 2: Contains strategy - Match URLs containing '/london'
    {
      method: 'GET',
      url: /https:\/\/api\.weather\.com\/v\d+\/weather\/[^/]+$/,  // RegExp for any version
      match: {
        url: { contains: '/london' },  // Match specific city
      },
      response: {
        status: 200,
        body: {
          city: 'Weather Match City',
          temperature: 22,
          conditions: 'Weather route matched',
          humidity: 55,
          matchedBy: 'containsWeather',
        },
      },
    },

    // Test 3: StartsWith strategy - Match API versioning
    {
      method: 'GET',
      url: /https:\/\/api\.weather\.com\/v\d+\/weather\/[^/]+$/,  // RegExp for any version
      match: {
        url: { startsWith: 'https://api.weather.com/v2' },
      },
      response: {
        status: 200,
        body: {
          city: 'Version 2 City',
          temperature: 25,
          conditions: 'V2 API matched',
          humidity: 60,
          matchedBy: 'startsWithV2',
        },
      },
    },

    // Test 4: EndsWith strategy - Match file extensions
    {
      method: 'GET',
      url: 'https://api.github.com/repos/:owner/:repo/contents/:path',
      match: {
        url: { endsWith: '.json' },
      },
      response: {
        status: 200,
        body: {
          type: 'file',
          name: 'data.json',
          path: 'config/data.json',
          content: 'eyJrZXkiOiJ2YWx1ZSJ9', // base64: {"key":"value"}
          matchedBy: 'endsWithJson',
        },
      },
    },

    // Test 5: Combined - URL pattern + header match
    {
      method: 'GET',
      url: 'https://api.stripe.com/v1/charges',
      match: {
        url: /\/v1\/charges$/,
        headers: {
          'x-api-version': '2023-10-16',
        },
      },
      response: {
        status: 200,
        body: {
          id: 'ch_combined123',
          status: 'succeeded',
          amount: 2000,
          currency: 'usd',
          matchedBy: 'combinedUrlHeader',
        },
      },
    },

    // Test 6: Exact string match (backward compatible)
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      match: {
        url: 'https://api.github.com/users/exactuser',
      },
      response: {
        status: 200,
        body: {
          login: 'exactuser',
          id: 99999,
          name: 'Exact Match User',
          bio: 'Matched by exact URL',
          public_repos: 10,
          followers: 100,
          matchedBy: 'exactUrl',
        },
      },
    },

    // Fallback response (no match criteria)
    {
      method: 'GET',
      url: 'https://api.github.com/users/:username',
      response: {
        status: 200,
        body: {
          login: 'fallback-user',
          id: 1,
          name: 'Fallback User',
          bio: 'Default response when no URL match',
          public_repos: 5,
          followers: 50,
          matchedBy: 'fallback',
        },
      },
    },

    // Fallback for weather API
    {
      method: 'GET',
      url: /https:\/\/api\.weather\.com\/v\d+\/weather\/[^/]+$/,  // RegExp for any version
      response: {
        status: 200,
        body: {
          city: 'Fallback City',
          temperature: 20,
          conditions: 'No URL match',
          humidity: 50,
          matchedBy: 'fallback',
        },
      },
    },

    // Fallback for file contents
    {
      method: 'GET',
      url: 'https://api.github.com/repos/:owner/:repo/contents/:path',
      response: {
        status: 200,
        body: {
          type: 'file',
          name: 'unknown.txt',
          path: 'unknown.txt',
          content: 'ZGVmYXVsdA==', // base64: "default"
          matchedBy: 'fallback',
        },
      },
    },

    // Fallback for stripe
    {
      method: 'GET',
      url: 'https://api.stripe.com/v1/charges',
      response: {
        status: 200,
        body: {
          id: 'ch_fallback123',
          status: 'pending',
          amount: 1000,
          currency: 'usd',
          matchedBy: 'fallback',
        },
      },
    },
  ],
};

/**
 * Scenarios organized as typed object for easy access in tests.
 *
 * Use this to get type-safe access to scenario IDs with autocomplete:
 *
 * @example
 * ```typescript
 * await request(app)
 *   .post(scenarist.config.endpoints.setScenario)
 *   .send({ scenario: 'success' }); // TypeScript autocomplete works!
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
  sharedPolling: sharedPollingScenario,
  tempCapture: tempCaptureScenario,
  campaignRegex: campaignRegexScenario,
  stringMatching: stringMatchingScenario,
  urlMatching: urlMatchingScenario,
} as const satisfies ScenaristScenarios;

