import { match } from 'path-to-regexp';

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
const extractPath = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // If not a valid URL, treat as a path
    return url;
  }
};

const hasPathParams = (pattern: string): boolean => {
  // Check for : but not in protocol (http:// or https://)
  const withoutProtocol = pattern.replace(/^https?:\/\//, '');
  return withoutProtocol.includes(':');
};

export const matchesUrl = (
  pattern: string,
  requestUrl: string
): UrlMatchResult => {
  // Exact string matching
  if (pattern === requestUrl) {
    return { matches: true };
  }

  // Path parameter matching (check before glob to prioritize :id over *)
  if (hasPathParams(pattern)) {
    const patternPath = extractPath(pattern);
    const requestPath = extractPath(requestUrl);

    const matcher = match(patternPath, { decode: decodeURIComponent });
    const result = matcher(requestPath);

    if (result) {
      const params: Record<string, string> = {};

      for (const [key, value] of Object.entries(result.params)) {
        if (typeof value === 'string') {
          params[key] = value;
        }
      }

      return { matches: true, params };
    }
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
