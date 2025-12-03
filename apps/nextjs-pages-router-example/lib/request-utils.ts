/**
 * Utility functions for safely extracting values from Next.js request types.
 *
 * Next.js types headers and query params as `string | string[] | undefined`,
 * but we often need plain strings. These helpers safely narrow the types
 * without using type assertions.
 */

/**
 * Safely extracts a string value from a header or query param.
 * Returns the first element if array, empty string if undefined.
 */
export const getString = (
  value: string | string[] | undefined,
  defaultValue = "",
): string => {
  if (value === undefined) return defaultValue;
  if (Array.isArray(value)) return value[0] ?? defaultValue;
  return value;
};

/**
 * Safely extracts a string value from a header or query param.
 * Returns undefined if not present.
 */
export const getOptionalString = (
  value: string | string[] | undefined,
): string | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
};
