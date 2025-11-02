/**
 * Scenarist Scenario Definitions
 *
 * Phase 1: Minimal scenarios (empty mocks)
 * Phase 2: Request matching for tier-based pricing
 */

import type { ScenarioDefinition } from '@scenarist/core';

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
          products: [
            {
              id: '1',
              name: 'Product A',
              description: 'High-quality product A',
              price: 99.99,
              tier: 'premium',
              image: '/images/product-a.jpg',
            },
            {
              id: '2',
              name: 'Product B',
              description: 'Premium product B',
              price: 149.99,
              tier: 'premium',
              image: '/images/product-b.jpg',
            },
            {
              id: '3',
              name: 'Product C',
              description: 'Essential product C',
              price: 79.99,
              tier: 'premium',
              image: '/images/product-c.jpg',
            },
          ],
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
          products: [
            {
              id: '1',
              name: 'Product A',
              description: 'High-quality product A',
              price: 149.99,
              tier: 'standard',
              image: '/images/product-a.jpg',
            },
            {
              id: '2',
              name: 'Product B',
              description: 'Premium product B',
              price: 199.99,
              tier: 'standard',
              image: '/images/product-b.jpg',
            },
            {
              id: '3',
              name: 'Product C',
              description: 'Essential product C',
              price: 99.99,
              tier: 'standard',
              image: '/images/product-c.jpg',
            },
          ],
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
} as const;
