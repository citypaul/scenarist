import { z } from 'zod';
import { isSafePattern } from 'redos-detector';

/**
 * Zod schemas for match criteria with regex support.
 *
 * **Security:**
 * - ReDoS protection via redos-detector
 * - Only safe regex flag characters allowed
 * - Timeout protection handled separately in domain layer
 *
 * **Pattern:**
 * Serialize regex as { source: string, flags?: string } for JSON compatibility.
 */

/**
 * Valid regex flags (safe subset of JavaScript regex flags).
 *
 * Supported flags:
 * - g: global match
 * - i: case insensitive
 * - m: multiline
 * - s: dotAll (. matches newlines)
 * - u: unicode
 * - v: unicode sets
 * - y: sticky
 */
const VALID_REGEX_FLAGS = /^[gimsuvy]*$/;

/**
 * Validates that a regex pattern is safe from ReDoS attacks.
 *
 * Uses redos-detector to analyze the pattern for exponential backtracking.
 * Patterns that could cause catastrophic backtracking are rejected.
 *
 * @param pattern - The regex pattern to validate
 * @returns true if the pattern is safe, false otherwise
 */
const isPatternSafeFromReDoS = (pattern: string): boolean => {
  const result = isSafePattern(pattern);
  return result.safe;
};

/**
 * Schema for serialized regex patterns.
 *
 * **Security Notes:**
 * - Uses redos-detector to prevent ReDoS attacks
 * - Validates regex flags to prevent injection
 * - Source must be non-empty string
 *
 * **Serialization:**
 * Regex patterns are serialized as plain objects to maintain JSON compatibility.
 * This allows scenarios to be stored in files, databases, or transmitted over network.
 *
 * @example
 * ```typescript
 * const regex: SerializedRegex = {
 *   source: '/api/products',
 *   flags: 'i'
 * };
 * ```
 */
export const SerializedRegexSchema = z.object({
  source: z
    .string()
    .min(1, 'Regex source must not be empty')
    .refine(isPatternSafeFromReDoS, {
      message: 'Regex pattern is unsafe (ReDoS vulnerability detected)',
    }),
  flags: z
    .string()
    .regex(VALID_REGEX_FLAGS, 'Invalid regex flags (only g, i, m, s, u, v, y allowed)')
    .optional(),
});

export type SerializedRegex = z.infer<typeof SerializedRegexSchema>;
