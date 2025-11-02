/**
 * Scenarist Scenario Definitions
 *
 * Phase 1 (GREEN): Minimal scenarios to make test pass
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
 * Premium user scenario - for testing scenario switching
 */
export const premiumUserScenario: ScenarioDefinition = {
  id: 'premiumUser',
  name: 'Premium User Scenario',
  description: 'Premium user with enhanced features',
  mocks: [],
};

/**
 * All scenarios for registration
 */
export const scenarios = {
  default: defaultScenario,
  premiumUser: premiumUserScenario,
} as const;
