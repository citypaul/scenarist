import { z } from "zod";
import { ScenaristResponseSchema } from "./response.js";

/**
 * Zod schemas for state-aware mocking (ADR-0019).
 *
 * These schemas define the structure of:
 * - stateResponse: Conditional responses based on test state
 * - afterResponse.setState: State mutation after response
 * - match.state: Mock selection based on current state
 */

/**
 * Schema for a single state condition.
 *
 * The `when` clause is a partial match object - all keys must match
 * the current state for the condition to apply.
 *
 * The optional `afterResponse` field overrides the mock-level afterResponse:
 * - If present with a value: use condition's afterResponse (replaces mock-level)
 * - If present as null: explicitly skip state mutation
 * - If absent: inherit mock-level afterResponse (backward compatible)
 *
 * @example
 * ```typescript
 * {
 *   when: { checked: true, step: 'reviewed' },
 *   then: { status: 200, body: { state: 'approved' } },
 *   afterResponse: { setState: { phase: 'approved' } }  // Optional
 * }
 * ```
 */
export const StateConditionSchema = z.object({
  when: z
    .record(z.string(), z.unknown())
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "when clause must have at least one key",
    }),
  then: ScenaristResponseSchema,
  afterResponse: z
    .object({
      setState: z
        .record(z.string(), z.unknown())
        .refine((obj) => Object.keys(obj).length > 0, {
          message: "setState must have at least one key",
        }),
    })
    .nullable()
    .optional(),
});
export type StateCondition = z.infer<typeof StateConditionSchema>;

/**
 * Schema for stateful mock response (stateResponse).
 *
 * Returns different responses based on current test state.
 * Uses specificity-based selection: most specific matching condition wins.
 *
 * @example
 * ```typescript
 * {
 *   default: { status: 200, body: { state: 'appStarted' } },
 *   conditions: [
 *     { when: { checked: true }, then: { status: 200, body: { state: 'quoteDecline' } } }
 *   ]
 * }
 * ```
 */
export const StatefulMockResponseSchema = z.object({
  default: ScenaristResponseSchema,
  conditions: z.array(StateConditionSchema),
});
export type StatefulMockResponse = z.infer<typeof StatefulMockResponseSchema>;

/**
 * Schema for afterResponse configuration.
 *
 * The setState object is merged into the current test state after
 * the response is returned.
 *
 * @example
 * ```typescript
 * {
 *   setState: { checked: true, step: 'completed' }
 * }
 * ```
 */
export const StateAfterResponseSchema = z.object({
  setState: z
    .record(z.string(), z.unknown())
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "setState must have at least one key",
    }),
});
export type StateAfterResponse = z.infer<typeof StateAfterResponseSchema>;

/**
 * Schema for state matching criteria (used in match.state).
 *
 * Partial match - all keys in the match criteria must match
 * the current state, but state can have additional keys.
 */
export const StateMatchCriteriaSchema = z.record(z.string(), z.unknown());
export type StateMatchCriteria = z.infer<typeof StateMatchCriteriaSchema>;
