const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export const isDangerousKey = (key: string): boolean => DANGEROUS_KEYS.has(key);

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
