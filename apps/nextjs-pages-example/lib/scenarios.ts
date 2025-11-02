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
 * All scenarios for registration
 */
export const scenarios = {
  default: defaultScenario,
  premiumUser: premiumUserScenario,
  standardUser: standardUserScenario,
} as const;
