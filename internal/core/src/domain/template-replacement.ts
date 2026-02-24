import { isRecord, isDangerousKey } from "./type-guards.js";

/**
 * Applies templates to a value.
 * Replaces {{state.key}} and {{params.key}} patterns with actual values.
 *
 * Note: This function preserves the structure of the input value.
 * Callers passing typed objects (like ScenaristResponse) can safely
 * cast the return value back to the input type.
 *
 * @param value - Value to apply templates to (string, object, array, or primitive)
 * @param templateData - Object containing state and params for template replacement.
 *                       Can be flat object (backward compatible) or { state: {...}, params: {...} }
 * @returns Value with templates replaced
 */
// Using {1,256} limit on regex to prevent ReDoS attacks with malicious input
const PURE_TEMPLATE_PATTERN = /^\{\{(state|params)\.([^}]{1,256})\}\}$/;
const MIXED_TEMPLATE_PATTERN = /\{\{(state|params)\.([^}]{1,256})\}\}/g;

const applyTemplatesToString = (
  value: string,
  templateData: Record<string, unknown>,
): unknown => {
  const pureTemplateMatch = PURE_TEMPLATE_PATTERN.exec(value);

  if (pureTemplateMatch) {
    // Pure template: return raw value (preserves type - arrays, numbers, objects)
    const prefix = pureTemplateMatch[1]!;
    const path = pureTemplateMatch[2]!;
    const resolvedValue = resolveTemplatePath(templateData, prefix, path);

    // null instead of undefined to ensure JSON serialization preserves the field
    return resolvedValue !== undefined ? resolvedValue : null;
  }

  // Mixed template (has surrounding text): use string replacement
  return value.replace(
    MIXED_TEMPLATE_PATTERN,
    (match, prefix: string, path: string) => {
      const resolvedValue = resolveTemplatePath(templateData, prefix, path);

      if (resolvedValue === undefined) {
        return match;
      }

      return String(resolvedValue);
    },
  );
};

const normalizeTemplateData = (
  templateData: Record<string, unknown>,
): Record<string, unknown> =>
  templateData.state !== undefined || templateData.params !== undefined
    ? templateData
    : { state: templateData, params: {} };

export const applyTemplates = (
  value: unknown,
  templateData: Record<string, unknown>,
): unknown => {
  const normalizedData = normalizeTemplateData(templateData);

  if (typeof value === "string") {
    return applyTemplatesToString(value, normalizedData);
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyTemplates(item, normalizedData));
  }

  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // eslint-disable-next-line security/detect-object-injection -- Key from Object.entries iteration
      result[key] = applyTemplates(val, normalizedData);
    }
    return result;
  }

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
  path: string,
): unknown => {
  // Get the root object (state or params)
  // eslint-disable-next-line security/detect-object-injection -- Prefix validated as 'state' or 'params' by regex
  const root = templateData[prefix];

  // Guard: Prefix doesn't exist (e.g., no params provided)
  if (root === undefined || typeof root !== "object" || root === null) {
    return undefined;
  }

  // Resolve nested path within root object
  const segments = path.split(".");
  let current: unknown = root;

  for (const segment of segments) {
    // Guard: Can't traverse non-objects
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    // Handle arrays with .length property
    if (Array.isArray(current) && segment === "length") {
      return current.length;
    }

    // Traverse object - use type guard for proper narrowing
    if (!isRecord(current)) {
      return undefined;
    }

    // Security: Prevent prototype pollution attacks
    // This is a READ-only traversal, not a write operation, so prototype pollution is not possible.
    // Additionally, we explicitly block dangerous keys (__proto__, constructor, prototype) via isDangerousKey()
    // and verify the property exists on the object itself (not prototype) via Object.hasOwn().
    // @see https://github.com/citypaul/scenarist/security/code-scanning/165
    if (isDangerousKey(segment) || !Object.hasOwn(current, segment)) {
      return undefined;
    }

    // nosemgrep: javascript.lang.security.audit.prototype-pollution.prototype-pollution-loop.prototype-pollution-loop
    // eslint-disable-next-line security/detect-object-injection -- Read-only traversal with isDangerousKey and Object.hasOwn guards
    current = current[segment];

    // Guard: Return undefined if property doesn't exist
    if (current === undefined) {
      return undefined;
    }
  }

  return current;
};
