import type { Request, Response } from 'express';
import type { ScenarioManager, ScenaristConfig, ScenaristScenarios } from '@scenarist/core';
import { createScenarist as createScenaristImpl, type ExpressScenarist, type ExpressAdapterOptions } from '../src/setup/setup-scenarist.js';

/**
 * Create a mock ScenaristConfig with sensible defaults.
 * Override only the properties you need for your test.
 */
export const mockConfig = (overrides?: Partial<ScenaristConfig>): ScenaristConfig => ({
  enabled: true,
  strictMode: false,
  headers: {
    testId: 'x-test-id',
  },
  endpoints: {
    setScenario: '/__scenario__',
    getScenario: '/__scenario__',
  },
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

/**
 * Create a Scenarist instance for testing.
 *
 * This test helper wraps createScenarist() and ensures it returns a non-nullable
 * value by throwing early if undefined. This is the correct behavior for tests
 * since NODE_ENV !== 'production' in test environments.
 *
 * Returns non-nullable ExpressScenarist so tests don't need null checks.
 *
 * Note: Named createTestScenarist to distinguish from the public createScenarist API.
 */
export const createTestScenarist = async <T extends ScenaristScenarios>(
  options: ExpressAdapterOptions<T>
): Promise<ExpressScenarist<T>> => {
  const scenarist = await createScenaristImpl(options);

  if (!scenarist) {
    throw new Error(
      'Scenarist should be defined in test environment (NODE_ENV !== "production")'
    );
  }

  return scenarist;
};
