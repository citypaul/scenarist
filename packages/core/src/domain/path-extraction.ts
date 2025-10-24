import type { HttpRequestContext } from '../types/scenario.js';

/**
 * Extracts a value from HttpRequestContext based on a path expression.
 *
 * Supported path prefixes:
 * - `body.field` - Extract from request body
 * - `headers.field` - Extract from request headers
 * - `query.field` - Extract from query parameters
 *
 * Supports nested paths: `body.user.profile.name`
 *
 * @param context - HTTP request context
 * @param path - Path expression (e.g., 'body.userId', 'headers.x-session-id')
 * @returns Extracted value, or undefined if path not found
 */
export const extractFromPath = (context: HttpRequestContext, path: string): unknown => {
  const segments = path.split('.');

  // Guard: Need at least 2 segments (prefix.field)
  if (segments.length < 2) {
    return undefined;
  }

  const prefix = segments[0]!;

  // Guard: Must be valid prefix
  if (prefix !== 'body' && prefix !== 'headers' && prefix !== 'query') {
    return undefined;
  }

  const remainingPath = segments.slice(1);

  const sourceMap = {
    body: context.body,
    headers: context.headers,
    query: context.query,
  };

  const source = sourceMap[prefix];

  // Guard: Source must exist
  if (source === undefined || source === null) {
    return undefined;
  }

  return traversePath(source, remainingPath);
};

/**
 * Traverses a nested object path.
 *
 * @param obj - Object to traverse
 * @param path - Path segments to follow
 * @returns Value at path, or undefined if not found
 */
const traversePath = (obj: unknown, path: readonly string[]): unknown => {
  // Guard: Empty path means we've reached the value
  if (path.length === 0) {
    return obj;
  }

  // Guard: Can only traverse objects
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return undefined;
  }

  const key = path[0]!;
  const record = obj as Record<string, unknown>;
  const value = record[key];

  // Recursively traverse remaining path
  return traversePath(value, path.slice(1));
};
