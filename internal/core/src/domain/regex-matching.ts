import {
  SerializedRegexSchema,
  type SerializedRegex,
} from "../schemas/match-criteria.js";

type RegexPatternInput = {
  readonly source: string;
  readonly flags?: string;
};

const testRegex = (value: string, pattern: RegexPatternInput): boolean => {
  try {
    // eslint-disable-next-line security/detect-non-literal-regexp -- Serialized patterns are schema-validated and native RegExp inputs are trusted code.
    const regex = new RegExp(pattern.source, pattern.flags); // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    return regex.test(value);
  } catch {
    return false;
  }
};

/**
 * Match a value against a regex pattern.
 *
 * **Security:**
 * - ReDoS protection via schema validation (redos-detector) at trust boundary
 * - Returns false on error (invalid regex syntax)
 *
 * **Usage:**
 * ```typescript
 * matchesRegex('summer-premium-sale', { source: 'premium|vip', flags: 'i' }) // true
 * matchesRegex('summer-sale', { source: 'premium|vip', flags: 'i' }) // false
 * ```
 *
 * @param value - String to test against pattern
 * @param pattern - Serialized regex with source and optional flags
 * @returns true if pattern matches, false otherwise
 */
export const matchesRegex = (
  value: string,
  pattern: SerializedRegex,
): boolean => {
  const validationResult = SerializedRegexSchema.safeParse(pattern);

  if (!validationResult.success) {
    return false;
  }

  return testRegex(value, validationResult.data);
};

/**
 * Match a value against a native RegExp from trusted developer code.
 *
 * **Security:**
 * - Bypasses serialized regex validation intentionally for native RegExp scenario criteria
 * - Do not use with patterns derived from serialized data or user input
 * - Reconstructs from source and flags before testing to avoid mutating caller-owned lastIndex state
 *
 * @param value - String to test against pattern
 * @param pattern - Native RegExp from trusted code
 * @returns true if pattern matches, false otherwise
 */
export const matchesTrustedNativeRegex = (
  value: string,
  pattern: RegExp,
): boolean => {
  return testRegex(value, {
    source: pattern.source,
    flags: pattern.flags,
  });
};
