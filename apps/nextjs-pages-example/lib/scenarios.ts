/**
 * Scenarist Scenario Definitions
 *
 * Phase 1: Minimal scenarios (empty mocks)
 * Phase 2: Request matching for tier-based pricing
 */

import type { ScenarioDefinition, ScenariosObject } from "@scenarist/nextjs-adapter/pages";
import { buildProducts } from "../data/products";

/**
 * Default scenario - baseline behavior
 */
export const defaultScenario: ScenarioDefinition = {
  id: "default",
  name: "Default Scenario",
  description: "Default baseline behavior",
  mocks: [],
};

/**
 * Premium User Scenario - Phase 2: Request Matching
 *
 * Demonstrates Scenarist's request matching feature:
 * - Intercepts calls to localhost:3001/products (json-server)
 * - Matches on x-user-tier: premium header
 * - Returns premium pricing (£99.99)
 */
export const premiumUserScenario: ScenarioDefinition = {
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
export const standardUserScenario: ScenarioDefinition = {
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
export const cartWithStateScenario: ScenarioDefinition = {
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
    // POST /cart/add - Capture productId into cartItems array
    {
      method: "POST",
      url: "http://localhost:3001/cart/add",
      captureState: {
        "cartItems[]": "body.productId", // Append productId to cartItems array
      },
      response: {
        status: 200,
        body: {
          success: true,
        },
      },
    },
    // GET /cart - Inject cart items from state
    {
      method: "GET",
      url: "http://localhost:3001/cart",
      response: {
        status: 200,
        body: {
          items: "{{state.cartItems}}", // Inject captured cart items
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
export const githubPollingScenario: ScenarioDefinition = {
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
export const weatherCycleScenario: ScenarioDefinition = {
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
export const paymentLimitedScenario: ScenarioDefinition = {
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
export const checkoutScenario: ScenarioDefinition = {
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
} as const satisfies ScenariosObject;
