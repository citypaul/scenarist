import { z } from "zod";
import { SerializedRegexSchema } from "./match-criteria.js";
import { ScenaristResponseSchema } from "./response.js";
import {
  StatefulMockResponseSchema,
  StateAfterResponseSchema,
} from "./state-aware-mocking.js";

// Re-export from response.ts (no backward compatibility concerns - no consumers yet)
export { ScenaristResponseSchema, type ScenaristResponse } from "./response.js";

/**
 * Zod schemas for scenario definitions.
 * These schemas validate the structure of scenario data at trust boundaries.
 *
 * **IMPORTANT**: TypeScript types are inferred from these schemas to maintain
 * a single source of truth. The schemas in this file are the canonical definition.
 */

export const HttpMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "HEAD",
]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

/**
 * Match value supports 6 matching strategies:
 * - Plain string: exact match (backward compatible)
 * - equals: explicit exact match
 * - contains: substring match
 * - startsWith: prefix match
 * - endsWith: suffix match
 * - regex: pattern match (serialized form)
 * - Native RegExp: pattern match (native JavaScript RegExp object)
 *
 * Exactly ONE strategy must be defined when using object form.
 */
export const MatchValueSchema = z.union([
  z.string(),
  z.instanceof(RegExp),
  z
    .object({
      equals: z.string().optional(),
      contains: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional(),
      regex: SerializedRegexSchema.optional(),
    })
    .refine(
      (obj) => {
        const strategies = [
          obj.equals,
          obj.contains,
          obj.startsWith,
          obj.endsWith,
          obj.regex,
        ];
        const defined = strategies.filter((s) => s !== undefined);
        return defined.length === 1;
      },
      {
        message:
          "Exactly one matching strategy must be defined (equals, contains, startsWith, endsWith, or regex)",
      },
    ),
]);
export type MatchValue = z.infer<typeof MatchValueSchema>;

export const ScenaristMatchSchema = z.object({
  url: MatchValueSchema.optional(),
  body: z.record(z.string(), MatchValueSchema).optional(),
  headers: z.record(z.string(), MatchValueSchema).optional(),
  query: z.record(z.string(), MatchValueSchema).optional(),
  state: z.record(z.string(), z.unknown()).optional(),
});
export type ScenaristMatch = z.infer<typeof ScenaristMatchSchema>;

export const RepeatModeSchema = z.enum(["last", "cycle", "none"]);
export type RepeatMode = z.infer<typeof RepeatModeSchema>;

export const ScenaristSequenceSchema = z.object({
  responses: z.array(ScenaristResponseSchema).min(1),
  repeat: RepeatModeSchema.optional(),
});
export type ScenaristSequence = z.infer<typeof ScenaristSequenceSchema>;

export const ScenaristCaptureConfigSchema = z.record(z.string(), z.string());
export type ScenaristCaptureConfig = z.infer<
  typeof ScenaristCaptureConfigSchema
>;

/**
 * URL pattern supports three forms:
 * - String: exact match, path params (/users/:id), or glob (/api/*)
 * - Native RegExp: pattern match (e.g., /\/users\/\d+/)
 */
export const ScenaristUrlPatternSchema = z.union([
  z.string().min(1),
  z.instanceof(RegExp),
]);
export type ScenaristUrlPattern = z.infer<typeof ScenaristUrlPatternSchema>;

/**
 * ScenaristMock schema with mutual exclusion constraint.
 *
 * A mock can have exactly ONE of: response, sequence, or stateResponse.
 * The afterResponse field can be combined with any of these.
 */
export const ScenaristMockSchema = z
  .object({
    method: HttpMethodSchema,
    url: ScenaristUrlPatternSchema,
    match: ScenaristMatchSchema.optional(),
    response: ScenaristResponseSchema.optional(),
    sequence: ScenaristSequenceSchema.optional(),
    stateResponse: StatefulMockResponseSchema.optional(),
    captureState: ScenaristCaptureConfigSchema.optional(),
    afterResponse: StateAfterResponseSchema.optional(),
  })
  .refine(
    (mock) => {
      const responseTypes = [mock.response, mock.sequence, mock.stateResponse];
      const definedCount = responseTypes.filter((r) => r !== undefined).length;
      // Allow 0 (for fallback mocks) or exactly 1
      return definedCount <= 1;
    },
    {
      message:
        "A mock can have at most one of: response, sequence, or stateResponse",
    },
  );
export type ScenaristMock = z.infer<typeof ScenaristMockSchema>;

export const ScenaristScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  mocks: z.array(ScenaristMockSchema),
});
export type ScenaristScenario = z.infer<typeof ScenaristScenarioSchema>;
