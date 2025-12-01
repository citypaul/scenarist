import { z } from "zod";

/**
 * Schema for a scenarist response.
 *
 * Extracted to avoid circular dependencies between
 * scenario-definition.ts and state-aware-mocking.ts.
 */
export const ScenaristResponseSchema = z.object({
  status: z.number().int().min(100).max(599),
  body: z.unknown().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  delay: z.number().nonnegative().optional(),
});
export type ScenaristResponse = z.infer<typeof ScenaristResponseSchema>;
