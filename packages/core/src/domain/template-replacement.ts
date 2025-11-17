/**
 * Applies templates to a value.
 * Replaces {{state.key}} and {{params.key}} patterns with actual values.
 *
 * @param value - Value to apply templates to (string, object, array, or primitive)
 * @param templateData - Object containing state and params for template replacement.
 *                       Can be flat object (backward compatible) or { state: {...}, params: {...} }
 * @returns Value with templates replaced
 */
export const applyTemplates = (value: unknown, templateData: Record<string, unknown>): unknown => {
  // Backward compatibility: If templateData doesn't have 'state' or 'params' keys,
  // treat it as a flat state object and wrap it
  const normalizedData = (templateData.state !== undefined || templateData.params !== undefined)
    ? templateData
    : { state: templateData, params: {} };
  // Guard: Handle strings (base case)
  if (typeof value === 'string') {
    // Check if entire string is a single pure template (no surrounding text)
    // Supports both {{state.key}} and {{params.key}}
    const pureTemplateMatch = /^\{\{(state|params)\.([^}]+)\}\}$/.exec(value);

    if (pureTemplateMatch) {
      // Pure template: return raw value (preserves type - arrays, numbers, objects)
      const prefix = pureTemplateMatch[1]!; // 'state' or 'params'
      const path = pureTemplateMatch[2]!; // Guaranteed to exist by regex capture group
      const resolvedValue = resolveTemplatePath(normalizedData, prefix, path);

      // Return raw value if found, otherwise return undefined
      return resolvedValue !== undefined ? resolvedValue : undefined;
    }

    // Mixed template (has surrounding text): use string replacement
    // Supports both {{state.key}} and {{params.key}}
    return value.replace(/\{\{(state|params)\.([^}]+)\}\}/g, (match, prefix: string, path: string) => {
      const resolvedValue = resolveTemplatePath(normalizedData, prefix, path);

      // Guard: Missing keys remain as template
      if (resolvedValue === undefined) {
        return match;
      }

      // Convert to string for concatenation with surrounding text
      return String(resolvedValue);
    });
  }

  // Guard: Handle arrays recursively
  if (Array.isArray(value)) {
    return value.map((item) => applyTemplates(item, normalizedData));
  }

  // Guard: Handle objects recursively
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = applyTemplates(val, normalizedData);
    }
    return result;
  }

  // Primitives (number, boolean, null) returned unchanged
  return value;
};

/**
 * Resolves a template path like 'state.key' or 'params.userId'.
 * Supports nested paths like 'state.user.profile.name' and 'params.path.length'.
 *
 * @param templateData - Template data object containing state and params
 * @param prefix - Template prefix ('state' or 'params')
 * @param path - Path to resolve after prefix (e.g., 'user.name' or 'userId')
 * @returns Value at path, or undefined if not found
 */
const resolveTemplatePath = (
  templateData: Record<string, unknown>,
  prefix: string,
  path: string
): unknown => {
  // Get the root object (state or params)
  const root = templateData[prefix];

  // Guard: Prefix doesn't exist (e.g., no params provided)
  if (root === undefined || typeof root !== 'object' || root === null) {
    return undefined;
  }

  // Resolve nested path within root object
  const segments = path.split('.');
  let current: unknown = root;

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
