/**
 * Match result containing whether URL matched and any extracted parameters.
 */
export type UrlMatchResult = {
  readonly matches: boolean;
  readonly params?: Readonly<Record<string, string>>;
};

/**
 * Check if a request URL matches a mock definition URL pattern.
 *
 * Supports:
 * - Exact strings: 'https://api.example.com/users'
 * - Glob patterns: 'https://api.example.com/users/*'
 * - Path parameters: 'https://api.example.com/users/:id'
 *
 * @param pattern - URL pattern from MockDefinition
 * @param requestUrl - Actual request URL
 * @returns Match result with params if applicable
 */
export const matchesUrl = (
  pattern: string,
  requestUrl: string
): UrlMatchResult => {
  // Exact string matching
  if (pattern === requestUrl) {
    return { matches: true };
  }

  // Glob pattern matching
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${regexPattern}$`);

    if (regex.test(requestUrl)) {
      return { matches: true };
    }
  }

  return { matches: false };
};
