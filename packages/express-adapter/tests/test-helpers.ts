import type { Request, Response } from 'express';
import type { ScenarioManager, ScenaristConfig } from '@scenarist/core';

/**
 * Create a mock ScenaristConfig with sensible defaults.
 * Override only the properties you need for your test.
 */
export const mockConfig = (overrides?: Partial<ScenaristConfig>): ScenaristConfig => ({
  enabled: true,
  strictMode: false,
  headers: {
    testId: 'x-test-id',
    mockEnabled: 'x-mock-enabled',
  },
  endpoints: {
    setScenario: '/__scenario__',
    getScenario: '/__scenario__',
  },
  defaultScenario: 'default',
  defaultTestId: 'default-test',
  ...overrides,
});

/**
 * Create a mock Express Request object.
 * Simulates Express behavior: lowercases all header names.
 */
export const mockRequest = (overrides?: Partial<Request>): Request => {
  // Express/Node.js lowercases all header names
  const headers = overrides?.headers ?? {};
  const lowercasedHeaders: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      lowercasedHeaders[key.toLowerCase()] = value;
    }
  }

  return {
    hostname: 'localhost',
    ...overrides,
    headers: lowercasedHeaders, // Ensure headers are lowercased even after spread
  } as Request;
};

/**
 * Create a mock Express Response object.
 */
export const mockResponse = (): Response => ({} as Response);

/**
 * Create a mock ScenarioManager with default no-op implementations.
 * Override only the methods you need for your test.
 */
export const mockScenarioManager = (
  overrides?: Partial<ScenarioManager>
): ScenarioManager =>
  ({
    registerScenario: () => {},
    switchScenario: () => ({ success: true, data: undefined }),
    getActiveScenario: () => undefined,
    listScenarios: () => [],
    clearScenario: () => ({ success: true, data: undefined }),
    getScenarioById: () => undefined,
    ...overrides,
  }) as ScenarioManager;
