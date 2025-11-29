import { match } from "path-to-regexp";

/**
 * Result of URL matching with path parameter extraction.
 *
 * Matches MSW's documented param types:
 * - string for simple params (:id)
 * - string[] for repeating params (:path+)
 */
export type UrlMatchResult = {
  readonly matches: boolean;
  readonly params?: Readonly<Record<string, string | ReadonlyArray<string>>>;
};

/**
 * Extract pathname from URL string, or return as-is if not a valid URL.
 *
 * CRITICAL: Handles path-to-regexp syntax (`:param`, `?`, `+`, `(regex)`)
 * The URL constructor treats `?` as query string delimiter, which breaks optional params.
 *
 * Examples:
 * - 'http://localhost:3001/api/files/:filename?' → '/api/files/:filename?' (preserves ?)
 * - 'http://localhost:3001/api/files/:path+' → '/api/files/:path+' (preserves +)
 * - '/api/users/:id' → '/api/users/:id' (already pathname)
 */
const extractPathnameOrReturnAsIs = (url: string): string => {
  // Match protocol://host pattern to manually extract pathname
  // This preserves path-to-regexp syntax that URL constructor would corrupt
  const urlPattern = /^https?:\/\/[^/]+(\/.*)?$/;
  const match = urlPattern.exec(url);

  if (match) {
    // Return everything after the host (group 1), or '/' if no path
    return match[1] || "/";
  }

  // Not a full URL, return as-is (already a pathname)
  return url;
};

/**
 * Extract params from path-to-regexp match result, filtering unnamed groups.
 *
 * MSW behavior (via path-to-regexp v6):
 * - Named params (:id, :name) are included
 * - Array params (:path+, :path*) are included as arrays
 * - Unnamed groups like (user|u) create numeric keys ('0', '1', etc.) which are FILTERED OUT
 *
 * Returns Record<string, string | string[]> matching MSW's documented types.
 */
const extractParams = (
  params: object,
): Record<string, string | ReadonlyArray<string>> => {
  return Object.fromEntries(
    Object.entries(params).filter(([key, value]) => {
      // Filter out unnamed groups (numeric keys like '0', '1', '2', etc.)
      if (/^\d+$/.test(key)) {
        return false;
      }
      // Keep strings and arrays (MSW documented: string | string[])
      return typeof value === "string" || Array.isArray(value);
    }),
  ) as Record<string, string | ReadonlyArray<string>>;
};

/**
 * Extract hostname from URL, or return undefined if not a full URL.
 */
const extractHostname = (url: string): string | undefined => {
  const urlPattern = /^https?:\/\/([^/]+)/;
  const match = urlPattern.exec(url);
  return match ? match[1] : undefined;
};

/**
 * Match URL patterns using MSW-compatible matching logic.
 *
 * Delegates to path-to-regexp v6 (same as MSW 2.x) for all string patterns.
 * This ensures automatic MSW parity for path parameter extraction.
 *
 * Matching strategies:
 * 1. RegExp patterns: MSW weak comparison (substring matching, origin-agnostic)
 * 2. Pathname-only patterns: Origin-agnostic (match any hostname)
 * 3. Full URL patterns: Hostname-specific (must match exactly)
 *
 * Pattern type examples:
 * - Pathname: '/users/:id' matches 'http://localhost/users/123' AND 'https://api.com/users/123'
 * - Full URL: 'http://api.com/users/:id' matches 'http://api.com/users/123' ONLY
 *
 * Path parameter examples (all handled by path-to-regexp):
 * - Exact: '/users/123' matches '/users/123'
 * - Simple params: '/users/:id' matches '/users/123' → {id: '123'}
 * - Multiple params: '/users/:userId/posts/:postId' → {userId: 'alice', postId: '42'}
 * - Optional params: '/files/:name?' matches '/files' or '/files/doc.txt'
 * - Repeating params: '/files/:path+' matches '/files/a/b/c' → {path: ['a','b','c']}
 * - Custom regex: '/orders/:id(\\d+)' matches '/orders/123' but not '/orders/abc'
 *
 * @see ADR-0016 for MSW weak comparison semantics
 */
export const matchesUrl = (
  pattern: string | RegExp,
  requestUrl: string,
): UrlMatchResult => {
  /**
   * RegExp patterns: MSW Weak Comparison (ADR-0016)
   *
   * RegExp.test() performs substring matching (origin-agnostic).
   * This matches MSW's documented behavior for regular expressions.
   *
   * Example: /\/posts\// matches:
   * - 'http://localhost:8080/posts/' ✅
   * - 'https://backend.dev/user/posts/' ✅
   * - 'https://api.example.com/posts/123' ✅
   */
  if (pattern instanceof RegExp) {
    return { matches: pattern.test(requestUrl) };
  }

  /**
   * String patterns: Hostname-aware matching
   *
   * If pattern is a full URL (has hostname), hostname must match.
   * If pattern is pathname-only, any hostname matches (origin-agnostic).
   *
   * This gives users choice:
   * - Use pathname patterns for environment-agnostic mocks
   * - Use full URL patterns when hostname matters
   */
  const patternHostname = extractHostname(pattern);
  const requestHostname = extractHostname(requestUrl);

  // If pattern has hostname, it must match request hostname
  if (patternHostname !== undefined && requestHostname !== undefined) {
    if (patternHostname !== requestHostname) {
      return { matches: false };
    }
  }

  /**
   * Pathname matching using path-to-regexp v6 (same as MSW 2.x)
   *
   * path-to-regexp handles:
   * - Exact string matches
   * - Path parameters (:id, :name, etc.)
   * - Optional parameters (:id?)
   * - Repeating parameters (:path+, :path*)
   * - Custom regex parameters (:id(\\d+))
   * - Unnamed groups filtering
   *
   * By using the same library as MSW, we automatically get MSW-compatible behavior.
   *
   * CRITICAL: Strip query parameters from request URL before matching.
   * path-to-regexp matches against pathname only, not query string.
   * Example: '/users/123?role=admin' should match pattern '/users/:id'
   */
  const patternPath = extractPathnameOrReturnAsIs(pattern);
  let requestPath = extractPathnameOrReturnAsIs(requestUrl);

  // Strip query parameters from request path
  const queryIndex = requestPath.indexOf("?");
  if (queryIndex !== -1) {
    requestPath = requestPath.substring(0, queryIndex);
  }

  const matcher = match(patternPath, { decode: decodeURIComponent });
  const result = matcher(requestPath);

  if (result) {
    const params = extractParams(result.params);
    return { matches: true, params };
  }

  return { matches: false };
};
