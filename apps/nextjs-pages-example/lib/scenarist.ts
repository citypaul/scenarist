/**
 * Scenarist Setup for Next.js Pages Router
 *
 * Phase 1 (GREEN): Minimal setup to make test pass
 */

import { createScenarist } from '@scenarist/nextjs-adapter/pages';
import { scenarios } from './scenarios';

/**
 * Create Scenarist instance with scenarios
 *
 * This provides:
 * - MSW server integration
 * - Scenario management
 * - Test ID isolation
 * - Scenario endpoint handlers
 */
export const scenarist = createScenarist({
  enabled: true, // Always enabled in example app for demonstration
  defaultScenario: scenarios.default,
});

// Register all scenarios
scenarist.registerScenarios(Object.values(scenarios));
