/**
 * Scenarist Scenario Definitions
 *
 * Phase 1: Minimal scenarios (empty mocks)
 * Phase 2: Request matching for tier-based pricing
 */

import type { ScenarioDefinition } from '@scenarist/core';
import { buildProducts } from '../data/products';

/**
 * Default scenario - baseline behavior
 */
export const defaultScenario: ScenarioDefinition = {
  id: 'default',
  name: 'Default Scenario',
  description: 'Default baseline behavior',
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
  id: 'premiumUser',
  name: 'Premium User',
  description: 'Premium tier pricing (£99.99)',
  mocks: [
    {
      method: 'GET',
      url: 'http://localhost:3001/products',
      match: {
        headers: { 'x-user-tier': 'premium' },
      },
      response: {
        status: 200,
        body: {
          products: buildProducts('premium'),
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
  id: 'standardUser',
  name: 'Standard User',
  description: 'Standard tier pricing (£149.99)',
  mocks: [
    {
      method: 'GET',
      url: 'http://localhost:3001/products',
      match: {
        headers: { 'x-user-tier': 'standard' },
      },
      response: {
        status: 200,
        body: {
          products: buildProducts('standard'),
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
  id: 'cartWithState',
  name: 'Shopping Cart with State',
  description: 'Stateful shopping cart that captures and injects cart items',
  mocks: [
    // GET /products - Return products so add-to-cart buttons exist
    {
      method: 'GET',
      url: 'http://localhost:3001/products',
      response: {
        status: 200,
        body: {
          products: buildProducts('standard'),  // Standard pricing for cart test
        },
      },
    },
    // POST /cart/add - Capture productId into cartItems array
    {
      method: 'POST',
      url: 'http://localhost:3001/cart/add',
      captureState: {
        'cartItems[]': 'body.productId',  // Append productId to cartItems array
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
      method: 'GET',
      url: 'http://localhost:3001/cart',
      response: {
        status: 200,
        body: {
          items: '{{state.cartItems}}',  // Inject captured cart items
        },
      },
    },
  ],
};

/**
 * All scenarios for registration
 */
export const scenarios = {
  default: defaultScenario,
  premiumUser: premiumUserScenario,
  standardUser: standardUserScenario,
  cartWithState: cartWithStateScenario,
} as const;
