import { z } from 'zod';

/**
 * Zod schemas for scenario definitions.
 * These schemas validate the structure of scenario data at trust boundaries.
 *
 * **IMPORTANT**: TypeScript types are inferred from these schemas to maintain
 * a single source of truth. The schemas in this file are the canonical definition.
 */

export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

export const MockResponseSchema = z.object({
  status: z.number().int().min(100).max(599),
  body: z.unknown().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  delay: z.number().nonnegative().optional(),
});
export type MockResponse = z.infer<typeof MockResponseSchema>;

export const MatchCriteriaSchema = z.object({
  body: z.record(z.string(), z.unknown()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  query: z.record(z.string(), z.string()).optional(),
});
export type MatchCriteria = z.infer<typeof MatchCriteriaSchema>;

export const RepeatModeSchema = z.enum(['last', 'cycle', 'none']);
export type RepeatMode = z.infer<typeof RepeatModeSchema>;

export const ResponseSequenceSchema = z.object({
  responses: z.array(MockResponseSchema).min(1),
  repeat: RepeatModeSchema.optional(),
});
export type ResponseSequence = z.infer<typeof ResponseSequenceSchema>;

export const CaptureStateSchema = z.record(z.string(), z.string());
export type CaptureState = z.infer<typeof CaptureStateSchema>;

export const MockDefinitionSchema = z.object({
  method: HttpMethodSchema,
  url: z.string().min(1),
  match: MatchCriteriaSchema.optional(),
  response: MockResponseSchema.optional(),
  sequence: ResponseSequenceSchema.optional(),
  captureState: CaptureStateSchema.optional(),
});
export type MockDefinition = z.infer<typeof MockDefinitionSchema>;

export const VariantDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  data: z.unknown(),
});
export type VariantDefinition = z.infer<typeof VariantDefinitionSchema>;

export const ScenarioDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  mocks: z.array(MockDefinitionSchema),
  variants: z.array(VariantDefinitionSchema).optional(),
});
export type ScenarioDefinition = z.infer<typeof ScenarioDefinitionSchema>;
