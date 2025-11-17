/**
 * Scenarist Scenario Definitions
 *
 * Phase 1: Minimal scenarios (empty mocks)
 * Phase 2: Request matching for tier-based pricing
 */

import type { ScenaristScenario, ScenaristScenarios } from "@scenarist/nextjs-adapter/app";
import { buildProducts } from "../data/products";

/**
 * Default scenario - baseline behavior with happy path mocks
 *
 * These mocks provide fallback responses when active scenario mocks don't match.
 * They represent the most common/expected behavior for each API.
 */
export const defaultScenario: ScenaristScenario = {
  id: "default",
  name: "Default Scenario",
  description: "Default baseline behavior with happy path mocks",
  mocks: [
    // Products API - standard tier pricing (most common case)
    {
      method: "GET",
      url: "http://localhost:3001/products",
      response: {
        status: 200,
        body: {
          products: buildProducts("standard"),
        },
      },
    },
    // Cart API - empty cart (initial state)
    {
      method: "GET",
      url: "http://localhost:3001/cart",
      response: {
        status: 200,
        body: {
          items: [],
        },
      },
    },
    // Cart add - successful addition
    {
      method: "POST",
      url: "http://localhost:3001/cart/add",
      response: {
        status: 200,
        body: {
          success: true,
          message: "Item added to cart",
        },
      },
    },
  ],
};

/**
 * Premium User Scenario - Phase 2: Request Matching
 *
 * Demonstrates Scenarist's request matching feature:
 * - Intercepts calls to localhost:3001/products (json-server)
 * - Matches on x-user-tier: premium header
 * - Returns premium pricing (£99.99)
 *
 * When request doesn't match (e.g., x-user-tier: standard), automatically
 * falls back to default scenario's mock (standard pricing).
 */
export const premiumUserScenario: ScenaristScenario = {
  id: "premiumUser",
  name: "Premium User",
  description: "Premium tier pricing (£99.99)",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/products",
      match: {
        headers: { "x-user-tier": "premium" },
      },
      response: {
        status: 200,
        body: {
          products: buildProducts("premium"),
        },
      },
    },
  ],
};

/**
 * Standard User Scenario - Phase 2: Request Matching
 *
 * Demonstrates Scenarist's request matching feature:
 * - Intercepts calls to localhost:3001/products (json-server)
 * - Matches on x-user-tier: standard header
 * - Returns standard pricing (£149.99)
 */
export const standardUserScenario: ScenaristScenario = {
  id: "standardUser",
  name: "Standard User",
  description: "Standard tier pricing (£149.99)",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/products",
      match: {
        headers: { "x-user-tier": "standard" },
      },
      response: {
        status: 200,
        body: {
          products: buildProducts("standard"),
        },
      },
    },
  ],
};

/**
 * Cart with State Scenario - Phase 3: Stateful Mocks
 *
 * Demonstrates Scenarist's stateful mock feature:
 * - POST /cart/add: Captures productId from request body into cartItems[] array
 * - GET /cart: Injects cartItems array into response with aggregated quantities
 *
 * State structure:
 * - cartItems[]: Array of productIds (appends with [] syntax)
 *
 * Response injection:
 * - Aggregates cartItems into unique items with quantities
 * - Returns as { items: [{ productId, quantity }, ...] }
 */
export const cartWithStateScenario: ScenaristScenario = {
  id: "cartWithState",
  name: "Shopping Cart with State",
  description: "Stateful shopping cart that captures and injects cart items",
  mocks: [
    // GET /products - Return products so add-to-cart buttons exist
    {
      method: "GET",
      url: "http://localhost:3001/products",
      response: {
        status: 200,
        body: {
          products: buildProducts("standard"), // Standard pricing for cart test
        },
      },
    },
    // POST /cart/add - Capture productId into state
    {
      method: "POST",
      url: "http://localhost:3001/cart/add",
      captureState: {
        "cartItems[]": "body.productId",
      },
      response: {
        status: 200,
        body: {
          success: true,
          message: "Item added to cart",
        },
      },
    },
    // GET /cart - Inject cartItems from state
    {
      method: "GET",
      url: "http://localhost:3001/cart",
      response: {
        status: 200,
        body: {
          items: "{{state.cartItems}}",
        },
      },
    },
  ],
};

/**
 * GitHub Polling Scenario - Phase 2: Response Sequences
 *
 * Demonstrates sequence progression with repeat: 'last':
 * - Simulates async job polling (pending → processing → complete)
 * - After exhaustion, repeats the last response infinitely
 * - Use case: Polling operations where final state should persist
 */
export const githubPollingScenario: ScenaristScenario = {
  id: "githubPolling",
  name: "GitHub Job Polling",
  description: "Async job polling sequence (repeat: 'last')",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/github/jobs/:id",
      sequence: {
        responses: [
          {
            status: 200,
            body: { jobId: "123", status: "pending", progress: 0 },
          },
          {
            status: 200,
            body: { jobId: "123", status: "processing", progress: 50 },
          },
          {
            status: 200,
            body: { jobId: "123", status: "complete", progress: 100 },
          },
        ],
        repeat: "last",
      },
    },
  ],
};

/**
 * Weather Cycle Scenario - Phase 2: Response Sequences
 *
 * Demonstrates sequence cycling with repeat: 'cycle':
 * - Cycles through weather conditions infinitely
 * - After reaching the end, loops back to the first response
 * - Use case: Simulating cyclical patterns
 */
export const weatherCycleScenario: ScenaristScenario = {
  id: "weatherCycle",
  name: "Weather Cycle",
  description: "Cycles through weather states (repeat: 'cycle')",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/weather/:city",
      sequence: {
        responses: [
          {
            status: 200,
            body: { city: "London", conditions: "Sunny", temp: 20 },
          },
          {
            status: 200,
            body: { city: "London", conditions: "Cloudy", temp: 18 },
          },
          {
            status: 200,
            body: { city: "London", conditions: "Rainy", temp: 15 },
          },
        ],
        repeat: "cycle",
      },
    },
  ],
};

/**
 * Payment Limited Scenario - Phase 2: Response Sequences
 *
 * Demonstrates sequence exhaustion with repeat: 'none':
 * - Allows 3 payment attempts then falls back to error
 * - After exhaustion, falls through to the next mock (rate limit error)
 * - Use case: Rate limiting, quota enforcement
 */
export const paymentLimitedScenario: ScenaristScenario = {
  id: "paymentLimited",
  name: "Limited Payment Attempts",
  description: "Allows 3 attempts then rate limits (repeat: 'none')",
  mocks: [
    {
      method: "POST",
      url: "http://localhost:3001/payments",
      sequence: {
        responses: [
          { status: 200, body: { id: "ch_1", status: "pending" } },
          { status: 200, body: { id: "ch_2", status: "pending" } },
          { status: 200, body: { id: "ch_3", status: "succeeded" } },
        ],
        repeat: "none",
      },
    },
    {
      method: "POST",
      url: "http://localhost:3001/payments",
      response: {
        status: 429,
        body: { error: { message: "Rate limit exceeded" } },
      },
    },
  ],
};

/**
 * Checkout Scenario - Phase 4: Feature Composition
 *
 * Demonstrates BOTH request matching AND stateful mocks working TOGETHER:
 * - REQUEST MATCHING: Different shipping costs based on country
 *   - UK: £0.00 (free shipping)
 *   - US: £10.00
 *   - FR/EU: £5.00
 * - STATEFUL MOCKS: Capture shipping address and inject into order
 *
 * This scenario proves features compose correctly in the same workflow.
 */
export const checkoutScenario: ScenaristScenario = {
  id: "checkout",
  name: "Checkout with Shipping",
  description: "Demonstrates matching + stateful composition",
  mocks: [
    // Calculate shipping - UK (free shipping)
    {
      method: "POST",
      url: "http://localhost:3001/checkout/shipping",
      match: {
        body: { country: "UK" },
      },
      captureState: {
        country: "body.country",
        address: "body.address",
        city: "body.city",
        postcode: "body.postcode",
      },
      response: {
        status: 200,
        body: {
          country: "UK",
          shippingCost: 0,
        },
      },
    },
    // Calculate shipping - US ($10 shipping)
    {
      method: "POST",
      url: "http://localhost:3001/checkout/shipping",
      match: {
        body: { country: "US" },
      },
      captureState: {
        country: "body.country",
        address: "body.address",
        city: "body.city",
        postcode: "body.postcode",
      },
      response: {
        status: 200,
        body: {
          country: "US",
          shippingCost: 10,
        },
      },
    },
    // Calculate shipping - EU/France (£5 shipping)
    {
      method: "POST",
      url: "http://localhost:3001/checkout/shipping",
      match: {
        body: { country: "FR" },
      },
      captureState: {
        country: "body.country",
        address: "body.address",
        city: "body.city",
        postcode: "body.postcode",
      },
      response: {
        status: 200,
        body: {
          country: "FR",
          shippingCost: 5,
        },
      },
    },
    // Place order - Capture order data and inject address
    {
      method: "POST",
      url: "http://localhost:3001/checkout/order",
      captureState: {
        orderId: "body.orderId",
      },
      response: {
        status: 200,
        body: {
          orderId: "{{state.orderId}}",
          shippingAddress: {
            country: "{{state.country}}",
            address: "{{state.address}}",
            city: "{{state.city}}",
            postcode: "{{state.postcode}}",
          },
        },
      },
    },
  ],
};

/**
 * Campaign Regex Scenario - Testing regex pattern matching (server-side)
 *
 * Demonstrates Scenarist's regex matching feature:
 * - Intercepts server-side calls to localhost:3001/products
 * - Matches x-campaign header against regex pattern /premium|vip/i
 * - Returns premium pricing when campaign contains 'premium' or 'vip'
 * - Falls back to default scenario (standard pricing) when no match
 *
 * Use case: Different pricing based on marketing campaign
 * Server-side: API route extracts campaign from query param, adds as header to fetch
 */
export const campaignRegexScenario: ScenaristScenario = {
  id: "campaignRegex",
  name: "Campaign Regex Matching",
  description: "Premium pricing for premium/vip campaigns",
  mocks: [
    {
      method: "GET",
      url: "http://localhost:3001/products",
      match: {
        headers: {
          "x-campaign": {
            regex: { source: "premium|vip", flags: "i" },
          },
        },
      },
      response: {
        status: 200,
        body: {
          products: buildProducts("premium"),
        },
      },
    },
  ],
};

/**
 * String Matching Strategies Scenario - Phase 2: ATDD
 *
 * Demonstrates all string matching strategies:
 * - contains: Substring matching
 * - startsWith: Prefix matching
 * - endsWith: Suffix matching
 * - equals: Explicit exact matching
 *
 * This scenario is designed to fail until Phase 2 implementation is complete.
 */
export const stringMatchingScenario: ScenaristScenario = {
  id: "stringMatching",
  name: "String Matching Strategies",
  description: "Tests contains, startsWith, endsWith, and equals matching",
  mocks: [
    // Test 1: Contains strategy - campaign header containing 'premium'
    {
      method: "GET",
      url: "http://localhost:3001/products",
      match: {
        headers: {
          "x-campaign": { contains: "premium" },
        },
      },
      response: {
        status: 200,
        body: {
          products: buildProducts("premium"),
          matchedBy: "contains",
        },
      },
    },

    // Test 2: StartsWith strategy - API key starting with 'sk_'
    {
      method: "GET",
      url: "http://localhost:3001/api-keys",
      match: {
        headers: {
          "x-api-key": { startsWith: "sk_" },
        },
      },
      response: {
        status: 200,
        body: {
          valid: true,
          keyType: "secret",
          matchedBy: "startsWith",
        },
      },
    },

    // Test 3: EndsWith strategy - email query param ending with '@company.com'
    {
      method: "GET",
      url: "http://localhost:3001/users",
      match: {
        query: {
          email: { endsWith: "@company.com" },
        },
      },
      response: {
        status: 200,
        body: {
          users: [
            { id: 1, email: "john@company.com", role: "admin" },
            { id: 2, email: "jane@company.com", role: "user" },
          ],
          matchedBy: "endsWith",
        },
      },
    },

    // Test 4: Equals strategy - explicit exact match
    {
      method: "GET",
      url: "http://localhost:3001/status",
      match: {
        headers: {
          "x-exact": { equals: "exact-value" },
        },
      },
      response: {
        status: 200,
        body: {
          status: "ok",
          message: "Exact match successful",
          matchedBy: "equals",
        },
      },
    },

    // Fallback: No match criteria - handles non-matching requests
    {
      method: "GET",
      url: "http://localhost:3001/products",
      response: {
        status: 200,
        body: {
          products: buildProducts("standard"),
          matchedBy: "fallback",
        },
      },
    },
  ],
};

/**
 * Scenario: URL Matching with Native RegExp and String Strategies
 *
 * Demonstrates URL matching capabilities:
 * - Native RegExp patterns for numeric IDs
 * - String strategies (contains, startsWith, endsWith) for URL filtering
 * - Combined matching (URL + headers)
 */
export const urlMatchingScenario: ScenaristScenario = {
  id: "urlMatching",
  name: "URL Matching Strategies",
  description: "Tests URL matching with RegExp, string strategies, and combined criteria",
  mocks: [
    // Test 1: Native RegExp - Match numeric user IDs
    {
      method: "GET",
      url: "http://localhost:3001/api/users/:username",
      match: {
        url: /\/users\/\d+$/, // Match URLs ending with numeric ID
      },
      response: {
        status: 200,
        body: {
          login: "user-numeric-id",
          id: 12345,
          name: "Numeric ID User",
          bio: "Matched by numeric ID pattern",
          public_repos: 42,
          followers: 500,
          matchedBy: "regexNumericId",
        },
      },
    },

    // Test 2: Contains strategy - Match URLs containing specific city
    {
      method: "GET",
      url: /http:\/\/localhost:3001\/api\/weather\/v\d+\/[^/]+$/,  // RegExp for any version
      match: {
        url: { contains: "/london" },  // Match specific city
      },
      response: {
        status: 200,
        body: {
          city: "Weather Match City",
          temperature: 22,
          conditions: "Weather route matched",
          humidity: 55,
          matchedBy: "containsWeather",
        },
      },
    },

    // Test 3: StartsWith strategy - Match API versioning
    {
      method: "GET",
      url: /http:\/\/localhost:3001\/api\/weather\/v\d+\/[^/]+$/,  // RegExp for any version
      match: {
        url: { startsWith: "http://localhost:3001/api/weather/v2" },
      },
      response: {
        status: 200,
        body: {
          city: "Version 2 City",
          temperature: 25,
          conditions: "V2 API matched",
          humidity: 60,
          matchedBy: "startsWithV2",
        },
      },
    },

    // Test 4: EndsWith strategy - Match file extensions
    {
      method: "GET",
      url: "http://localhost:3001/api/files/:filename",
      match: {
        url: { endsWith: ".json" },
      },
      response: {
        status: 200,
        body: {
          type: "file",
          name: "data.json",
          path: "config/data.json",
          content: "eyJrZXkiOiJ2YWx1ZSJ9", // base64: {"key":"value"}
          matchedBy: "endsWithJson",
        },
      },
    },

    // Test 5: Combined - URL pattern + header match
    {
      method: "POST",
      url: "http://localhost:3001/api/charges",
      match: {
        url: /\/charges$/,
        headers: {
          "x-api-version": "2023-10-16",
        },
      },
      response: {
        status: 200,
        body: {
          id: "ch_combined123",
          status: "succeeded",
          amount: 2000,
          currency: "usd",
          matchedBy: "combinedUrlHeader",
        },
      },
    },

    // Test 6: Exact string match (backward compatible)
    {
      method: "GET",
      url: "http://localhost:3001/api/users/:username",
      match: {
        url: "http://localhost:3001/api/users/exactuser",
      },
      response: {
        status: 200,
        body: {
          login: "exactuser",
          id: 99999,
          name: "Exact Match User",
          bio: "Matched by exact URL",
          public_repos: 10,
          followers: 100,
          matchedBy: "exactUrl",
        },
      },
    },

    // Fallback for users API
    {
      method: "GET",
      url: "http://localhost:3001/api/users/:username",
      response: {
        status: 200,
        body: {
          login: "fallback-user",
          id: 0,
          name: "Fallback User",
          bio: "No URL match",
          public_repos: 0,
          followers: 50,
          matchedBy: "fallback",
        },
      },
    },

    // Fallback for weather API
    {
      method: "GET",
      url: /http:\/\/localhost:3001\/api\/weather\/v\d+\/[^/]+$/,  // RegExp for any version
      response: {
        status: 200,
        body: {
          city: "Fallback City",
          temperature: 20,
          conditions: "No URL match",
          humidity: 50,
          matchedBy: "fallback",
        },
      },
    },

    // Fallback for files API
    {
      method: "GET",
      url: "http://localhost:3001/api/files/:filename",
      response: {
        status: 200,
        body: {
          type: "file",
          name: "unknown.txt",
          path: "unknown.txt",
          content: "",
          matchedBy: "fallback",
        },
      },
    },

    // Fallback for charges API
    {
      method: "POST",
      url: "http://localhost:3001/api/charges",
      response: {
        status: 200,
        body: {
          id: "ch_fallback123",
          status: "succeeded",
          amount: 1000,
          currency: "usd",
          matchedBy: "fallback",
        },
      },
    },

    // Test 7: Path Parameter - Simple :id extraction
    // This should extract the user ID from the URL and use it in the response
    // Using /api/user-param/:id to avoid conflict with regex numeric ID mock
    {
      method: "GET",
      url: "/api/user-param/:id",
      response: {
        status: 200,
        body: {
          userId: "{{params.id}}",  // Should be extracted from URL
          login: "user-{{params.id}}",
          name: "User {{params.id}}",
          bio: "User with ID from path parameter",
          matchedBy: "pathParam",
        },
      },
    },

    // Test 8: Multiple Path Parameters - :userId and :postId
    {
      method: "GET",
      url: "/api/users/:userId/posts/:postId",
      response: {
        status: 200,
        body: {
          userId: "{{params.userId}}",
          postId: "{{params.postId}}",
          title: "Post {{params.postId}} by {{params.userId}}",
          content: "Content for post {{params.postId}}",
          author: "{{params.userId}}",
          matchedBy: "multipleParams",
        },
      },
    },

    // Test 9a: Optional Parameter - When filename is present
    // More specific mock (uses template to inject param)
    {
      method: "GET",
      url: "/api/file-optional/:filename",  // Without ? - requires param
      response: {
        status: 200,
        body: {
          filename: "{{params.filename}}",
          path: "/file-optional/{{params.filename}}",
          exists: true,
          matchedBy: "optional",
        },
      },
    },

    // Test 9b: Optional Parameter - When filename is absent
    // Fallback mock (static defaults)
    {
      method: "GET",
      url: "/api/file-optional",  // Exact match, no param
      response: {
        status: 200,
        body: {
          filename: "default.txt",
          path: "/file-optional/default.txt",
          exists: true,
          matchedBy: "optional",
        },
      },
    },

    // Test 10: Repeating Path Parameter - :path+
    // Changed from /api/files/:path+ to /api/paths/:path+ to avoid conflict with /api/files/:filename
    {
      method: "GET",
      url: "/api/paths/:path+",
      response: {
        status: 200,
        body: {
          path: "{{params.path}}",  // Should be array joined
          segments: "{{params.path.length}}",  // Array length
          fullPath: "/paths/{{params.path}}",
          matchedBy: "repeating",
        },
      },
    },

    // Fallback for orders endpoint (when custom regex doesn't match)
    // IMPORTANT: Must come BEFORE custom regex due to "last match wins" rule
    {
      method: "GET",
      url: "/api/orders/:orderId",
      response: {
        status: 200,
        body: {
          orderId: "{{params.orderId}}",
          status: "unknown",
          total: 0,
          matchedBy: "fallback",
        },
      },
    },

    // Test 11: Custom Regex Parameter - :orderId(\d+)
    // Should only match numeric order IDs
    // IMPORTANT: Comes AFTER fallback so it wins when both match (last match wins)
    {
      method: "GET",
      url: "/api/orders/:orderId(\\d+)",
      response: {
        status: 200,
        body: {
          orderId: "{{params.orderId}}",
          status: "processing",
          total: 99.99,
          matchedBy: "customRegex",
        },
      },
    },
  ],
};

/**
 * Hostname Matching Demonstration Scenario
 *
 * Demonstrates the three URL pattern types and their hostname matching behavior:
 *
 * 1. PATHNAME-ONLY patterns (/api/data) - Origin-agnostic (match ANY hostname)
 * 2. FULL URL patterns (http://localhost:3001/api/data) - Hostname-specific (must match exactly)
 * 3. REGEXP patterns (/\/api\/data/) - Origin-agnostic (MSW weak comparison)
 *
 * Use case: Understanding how different pattern types behave with hostnames
 */
export const hostnameMatchingScenario: ScenaristScenario = {
  id: "hostnameMatching",
  name: "Hostname Matching Demonstration",
  description: "Shows pathname vs full URL vs RegExp pattern behaviors",
  mocks: [
    // Example 1: Pathname-only pattern - matches ANY hostname
    {
      method: "GET",
      url: "/api/origin-agnostic",
      response: {
        status: 200,
        body: {
          patternType: "pathname-only",
          behavior: "origin-agnostic",
          message: "This matches requests to ANY hostname",
          examples: [
            "http://localhost:3001/api/origin-agnostic",
            "https://api.example.com/api/origin-agnostic",
            "http://staging.test.io/api/origin-agnostic",
          ],
        },
      },
    },

    // Example 2: Full URL pattern with localhost - hostname-specific
    {
      method: "GET",
      url: "http://localhost:3001/api/localhost-only",
      response: {
        status: 200,
        body: {
          patternType: "full-url",
          hostname: "localhost:3001",
          behavior: "hostname-specific",
          message: "This ONLY matches localhost:3001 requests",
          willMatch: "http://localhost:3001/api/localhost-only",
          wontMatch: [
            "https://api.example.com/api/localhost-only",
            "http://staging.test.io/api/localhost-only",
          ],
        },
      },
    },

    // Example 3: Full URL pattern with production hostname - hostname-specific
    {
      method: "GET",
      url: "https://api.example.com/api/production-only",
      response: {
        status: 200,
        body: {
          patternType: "full-url",
          hostname: "api.example.com",
          behavior: "hostname-specific",
          message: "This ONLY matches api.example.com requests",
          willMatch: "https://api.example.com/api/production-only",
          wontMatch: [
            "http://localhost:3001/api/production-only",
            "http://staging.test.io/api/production-only",
          ],
        },
      },
    },

    // Example 4: Native RegExp pattern - origin-agnostic (weak comparison)
    {
      method: "GET",
      url: /\/api\/regex-pattern$/,
      response: {
        status: 200,
        body: {
          patternType: "native-regexp",
          behavior: "origin-agnostic (MSW weak comparison)",
          message: "This matches the pattern at ANY origin",
          examples: [
            "http://localhost:3001/api/regex-pattern",
            "https://api.example.com/api/regex-pattern",
            "http://staging.test.io/v1/api/regex-pattern",
          ],
        },
      },
    },

    // Example 5: Pathname with path parameters - origin-agnostic
    {
      method: "GET",
      url: "/api/users/:userId/posts/:postId",
      response: {
        status: 200,
        body: {
          patternType: "pathname-only with params",
          behavior: "origin-agnostic + param extraction",
          message: "Extracts params and matches ANY hostname",
          userId: "{{params.userId}}",
          postId: "{{params.postId}}",
        },
      },
    },

    // Example 6: Full URL with path parameters - hostname-specific
    {
      method: "GET",
      url: "http://localhost:3001/api/local-users/:userId",
      response: {
        status: 200,
        body: {
          patternType: "full-url with params",
          hostname: "localhost:3001",
          behavior: "hostname-specific + param extraction",
          message: "Extracts params but ONLY from localhost:3001",
          userId: "{{params.userId}}",
          willMatch: "http://localhost:3001/api/local-users/123",
          wontMatch: "https://api.example.com/api/local-users/123",
        },
      },
    },
  ],
};

/**
 * All scenarios for registration and type-safe access
 */
export const scenarios = {
  default: defaultScenario,
  premiumUser: premiumUserScenario,
  standardUser: standardUserScenario,
  cartWithState: cartWithStateScenario,
  githubPolling: githubPollingScenario,
  weatherCycle: weatherCycleScenario,
  paymentLimited: paymentLimitedScenario,
  checkout: checkoutScenario,
  campaignRegex: campaignRegexScenario,
  stringMatching: stringMatchingScenario,
  urlMatching: urlMatchingScenario,
  hostnameMatching: hostnameMatchingScenario,
} as const satisfies ScenaristScenarios;
