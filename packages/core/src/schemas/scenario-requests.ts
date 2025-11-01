import { z } from 'zod';

/**
 * Schema for scenario switch request body.
 *
 * This schema defines the domain rules for what constitutes a valid
 * scenario switch request. All framework adapters MUST use this schema
 * to validate scenario switch requests at the trust boundary (HTTP request → domain).
 *
 * **Architectural Note:**
 * - This is DOMAIN KNOWLEDGE (what makes a valid request)
 * - Adapters apply this validation at TRUST BOUNDARIES
 * - Single source of truth for scenario request validation
 * - Never duplicate this schema in adapters
 *
 * @example
 * ```typescript
 * // In adapter endpoint handler:
 * import { ScenarioRequestSchema } from '@scenarist/core';
 *
 * const { scenario, variant } = ScenarioRequestSchema.parse(req.body);
 * ```
 */
export const ScenarioRequestSchema = z.object({
  /**
   * Scenario ID to switch to.
   * Must be a non-empty string matching a registered scenario ID.
   */
  scenario: z.string().min(1, 'Scenario ID must not be empty'),

  /**
   * Optional variant name within the scenario.
   * If provided, must be a non-empty string.
   */
  variant: z.string().min(1, 'Variant name must not be empty').optional(),
});

/**
 * Type derived from ScenarioRequestSchema.
 * Represents a validated scenario switch request.
 *
 * **Usage:** Use this type for function parameters after validation has occurred.
 */
export type ScenarioRequest = z.infer<typeof ScenarioRequestSchema>;
