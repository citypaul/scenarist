/**
 * Express 5 types route params as string | string[] to handle repeated segments.
 * For single-segment params (e.g. /:username), the value is always a string at runtime.
 */
export const getRouteParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
