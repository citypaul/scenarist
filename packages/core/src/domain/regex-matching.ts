import type { SerializedRegex } from '../schemas/match-criteria.js';

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
  pattern: SerializedRegex
): boolean => {
  try {
    const regex = new RegExp(pattern.source, pattern.flags);
    return regex.test(value);
  } catch (error) {
    console.error('Regex matching error:', error);
    return false;
  }
};
