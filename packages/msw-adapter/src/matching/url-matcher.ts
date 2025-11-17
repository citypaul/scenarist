import { match } from 'path-to-regexp';

export type UrlMatchResult = {
  readonly matches: boolean;
  readonly params?: Readonly<Record<string, string>>;
};

const extractPathnameOrReturnAsIs = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

const hasPathParamsAfterProtocol = (pattern: string): boolean => {
  const withoutProtocol = pattern.replace(/^https?:\/\//, '');
  return withoutProtocol.includes(':');
};

const extractStringParams = (
  params: object
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => typeof value === 'string')
  ) as Record<string, string>;
};

const escapeRegexSpecialChars = (str: string): string => {
  return str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
};

const convertGlobToRegex = (pattern: string): RegExp => {
  const escaped = escapeRegexSpecialChars(pattern);
  const regexPattern = escaped.replace(/\*/g, '.*');
  return new RegExp(`^${regexPattern}$`);
};

const matchesExactString = (pattern: string, requestUrl: string): boolean => {
  return pattern === requestUrl;
};

const matchesPathParams = (
  pattern: string,
  requestUrl: string
): UrlMatchResult => {
  const patternPath = extractPathnameOrReturnAsIs(pattern);
  const requestPath = extractPathnameOrReturnAsIs(requestUrl);

  const matcher = match(patternPath, { decode: decodeURIComponent });
  const result = matcher(requestPath);

  if (result) {
    const params = extractStringParams(result.params);
    return { matches: true, params };
  }

  return { matches: false };
};

const matchesGlobPattern = (pattern: string, requestUrl: string): boolean => {
  const regex = convertGlobToRegex(pattern);
  return regex.test(requestUrl);
};

export const matchesUrl = (
  pattern: string | RegExp,
  requestUrl: string
): UrlMatchResult => {
  /**
   * MSW Weak Comparison Semantics (ADR-0016)
   *
   * RegExp patterns use "weak comparison" - substring matching that's origin-agnostic.
   * This matches MSW's documented behavior for regular expressions.
   *
   * From MSW docs:
   * "Unlike paths, regular expressions use weak comparison, supporting partial matches.
   * When provided a regular expression, all request URLs that match that expression
   * will be captured, regardless of their origin."
   *
   * Example:
   *   pattern: /\/posts\//
   *   Matches: 'http://localhost:8080/posts/'          ✅ (different origin)
   *   Matches: 'https://backend.dev/user/posts/'       ✅ (different origin)
   *   Matches: 'https://api.example.com/posts/123'     ✅ (additional segments)
   *   Does NOT match: 'https://api.example.com/users/123'  ❌ (pattern not found)
   *
   * RegExp.test() performs substring matching by default (unless pattern uses anchors like ^, $),
   * so this implementation correctly supports MSW's weak comparison semantics.
   */
  if (pattern instanceof RegExp) {
    return { matches: pattern.test(requestUrl) };
  }

  if (matchesExactString(pattern, requestUrl)) {
    return { matches: true };
  }

  if (hasPathParamsAfterProtocol(pattern)) {
    return matchesPathParams(pattern, requestUrl);
  }

  if (pattern.includes('*') && matchesGlobPattern(pattern, requestUrl)) {
    return { matches: true };
  }

  return { matches: false };
};
