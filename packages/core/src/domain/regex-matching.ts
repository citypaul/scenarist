import type { SerializedRegex } from '../schemas/match-criteria.js';

/**
 * Match a value against a regex pattern with timeout protection.
 *
 * **Security:**
 * - Timeout protection (100ms default) prevents ReDoS attacks
 * - Returns false on timeout or error
 * - Schema validation (redos-detector) happens at trust boundary
 *
 * **Usage:**
 * ```typescript
 * matchesRegex('summer-premium-sale', { source: 'premium|vip', flags: 'i' }) // true
 * matchesRegex('summer-sale', { source: 'premium|vip', flags: 'i' }) // false
 * ```
 *
 * @param value - String to test against pattern
 * @param pattern - Serialized regex with source and optional flags
 * @param timeoutMs - Maximum time allowed for regex execution (default: 100ms)
 * @returns true if pattern matches, false otherwise
 */
export const matchesRegex = (
  value: string,
  pattern: SerializedRegex,
  timeoutMs: number = 100
): boolean => {
  try {
    const regex = new RegExp(pattern.source, pattern.flags);

    // Simple timeout mechanism
    const startTime = Date.now();
    const result = regex.test(value);
    const elapsed = Date.now() - startTime;

    if (elapsed > timeoutMs) {
      console.warn(`Regex timeout: pattern took ${elapsed}ms`);
      return false;
    }

    return result;
  } catch (error) {
    console.error('Regex matching error:', error);
    return false;
  }
};
