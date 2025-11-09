/**
 * Applies state templates to a value.
 * Replaces {{state.key}} patterns with actual values from state.
 *
 * @param value - Value to apply templates to (string, object, array, or primitive)
 * @param state - State object containing values for template replacement
 * @returns Value with templates replaced
 */
export const applyTemplates = (value: unknown, state: Record<string, unknown>): unknown => {
  // Guard: Handle strings (base case)
  if (typeof value === 'string') {
    // Check if entire string is a single pure template (no surrounding text)
    const pureTemplateMatch = /^\{\{state\.([^}]+)\}\}$/.exec(value);

    if (pureTemplateMatch) {
      // Pure template: return raw value (preserves type - arrays, numbers, objects)
      const path = pureTemplateMatch[1]!; // Guaranteed to exist by regex capture group
      const stateValue = resolveStatePath(state, path);

      // Return raw value if found, otherwise return undefined
      return stateValue !== undefined ? stateValue : undefined;
    }

    // Mixed template (has surrounding text): use string replacement
    return value.replace(/\{\{state\.([^}]+)\}\}/g, (match, path: string) => {
      const stateValue = resolveStatePath(state, path);

      // Guard: Missing state keys remain as template
      if (stateValue === undefined) {
        return match;
      }

      // Convert to string for concatenation with surrounding text
      return String(stateValue);
    });
  }

  // Guard: Handle arrays recursively
  if (Array.isArray(value)) {
    return value.map((item) => applyTemplates(item, state));
  }

  // Guard: Handle objects recursively
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = applyTemplates(val, state);
    }
    return result;
  }

  // Primitives (number, boolean, null) returned unchanged
  return value;
};

/**
 * Resolves a nested path in state object.
 * Supports paths like 'user.profile.name' and 'items.length'.
 *
 * @param state - State object to traverse
 * @param path - Path to resolve (e.g., 'user.name' or 'items.length')
 * @returns Value at path, or undefined if not found
 */
const resolveStatePath = (state: Record<string, unknown>, path: string): unknown => {
  const segments = path.split('.');
  let current: unknown = state;

  for (const segment of segments) {
    // Guard: Can't traverse non-objects
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    // Handle arrays with .length property
    if (Array.isArray(current) && segment === 'length') {
      return current.length;
    }

    // Traverse object
    const record = current as Record<string, unknown>;
    current = record[segment];

    // Guard: Return undefined if property doesn't exist
    if (current === undefined) {
      return undefined;
    }
  }

  return current;
};
