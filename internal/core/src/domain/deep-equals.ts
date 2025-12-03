/**
 * Deep equality comparison for values.
 *
 * Supports primitives, null, undefined, arrays, and objects.
 * Used for state matching in stateResponse conditions and match.state criteria.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are deeply equal, false otherwise
 */
export const deepEquals = (a: unknown, b: unknown): boolean => {
  // Handle primitives and reference equality
  if (a === b) {
    return true;
  }

  // Handle null (after === check, if either is null, they're not equal)
  if (a === null || b === null) {
    return false;
  }

  // Handle undefined
  if (a === undefined || b === undefined) {
    return false;
  }

  // Handle different types
  if (typeof a !== typeof b) {
    return false;
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      // eslint-disable-next-line security/detect-object-injection -- Index bounded by array length check
      if (!deepEquals(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  // Handle array vs non-array (one is array, other is object)
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  // Handle objects
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (const key of aKeys) {
      if (!(key in (b as Record<string, unknown>))) {
        return false;
      }
      // eslint-disable-next-line security/detect-object-injection -- Keys from Object.keys (own properties only)
      if (
        !deepEquals(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        )
      ) {
        return false;
      }
    }

    return true;
  }

  return false;
};
