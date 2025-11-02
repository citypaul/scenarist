import { z } from 'zod';
import { ScenarioDefinitionSchema } from './scenario-definition.js';

/**
 * Validates that a scenarios object has a 'default' key.
 *
 * This enforces the convention that all scenario collections must
 * include a 'default' scenario to serve as the baseline.
 *
 * **Trust Boundary:** Applied in buildConfig when user provides scenarios.
 *
 * Each value must be a valid ScenarioDefinition with proper structure.
 */
export const ScenariosObjectSchema = z
  .record(z.string(), ScenarioDefinitionSchema)
  .refine((scenarios) => 'default' in scenarios, {
    message: "Scenarios object must have a 'default' key",
  });
