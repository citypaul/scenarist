/**
 * Playwright Test Fixtures for PayFlow
 *
 * Simple fixture setup using @scenarist/playwright-helpers.
 * Since PayFlow only communicates via HTTP APIs, we don't need
 * any database seeding - just the standard Scenarist fixtures.
 *
 * What you get:
 * - ✅ Type-safe scenario IDs with autocomplete
 * - ✅ Automatic unique test ID generation
 * - ✅ `switchScenario(page, scenarioId)` fixture
 */

import { withScenarios, expect } from "@scenarist/playwright-helpers";
import { scenarios } from "../src/scenarios";

export const test = withScenarios(scenarios);
export { expect };
