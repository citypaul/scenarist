import type { HttpRequestContext } from "../types/scenario.js";

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const isDangerousKey = (key: string): boolean => DANGEROUS_KEYS.has(key);

/**
 * Type guard to check if a value is a plain object (Record).
 * Used to properly narrow types after typeof checks.
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

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
export const extractFromPath = (
  context: HttpRequestContext,
  path: string,
): unknown => {
  const segments = path.split(".");

  // Guard: Need at least 2 segments (prefix.field)
  if (segments.length < 2) {
    return undefined;
  }

  const prefix = segments[0]!;

  // Guard: Must be valid prefix
  if (prefix !== "body" && prefix !== "headers" && prefix !== "query") {
    return undefined;
  }

  const remainingPath = segments.slice(1);

  const source = getSourceForPrefix(context, prefix);

  // Guard: Source must exist
  if (source === undefined || source === null) {
    return undefined;
  }

  return traversePath(source, remainingPath);
};

type ValidPrefix = "body" | "headers" | "query";

const getSourceForPrefix = (
  context: HttpRequestContext,
  prefix: ValidPrefix,
): unknown => {
  switch (prefix) {
    case "body":
      return context.body;
    case "headers":
      return context.headers;
    case "query":
      return context.query;
  }
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

  // Guard: Can only traverse objects - use type guard for proper narrowing
  if (!isRecord(obj)) {
    return undefined;
  }

  const key = path[0]!;

  // Guard: Prevent prototype pollution attacks
  if (isDangerousKey(key)) {
    return undefined;
  }

  // Guard: Only access own properties, not inherited ones
  if (!Object.hasOwn(obj, key)) {
    return undefined;
  }

  // eslint-disable-next-line security/detect-object-injection -- Key validated by Object.hasOwn and isDangerousKey guard
  const value = obj[key];

  // Recursively traverse remaining path
  return traversePath(value, path.slice(1));
};
