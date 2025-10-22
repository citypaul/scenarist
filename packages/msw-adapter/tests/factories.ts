import type { MockDefinition, ScenarioDefinition } from '@scenarist/core';

/**
 * Test data factory for MockDefinition with sensible defaults.
 *
 * @param overrides - Optional partial MockDefinition to override defaults
 * @returns Complete MockDefinition for testing
 */
export const mockDefinition = (
  overrides?: Partial<MockDefinition>
): MockDefinition => ({
  method: 'GET',
  url: 'https://api.example.com/users',
  response: {
    status: 200,
  },
  ...overrides,
});

/**
 * Test data factory for ScenarioDefinition with sensible defaults.
 * Name and description are automatically derived from id.
 *
 * @param overrides - Optional partial ScenarioDefinition to override defaults
 * @returns Complete ScenarioDefinition for testing
 */
export const mockScenario = (
  overrides?: Partial<ScenarioDefinition>
): ScenarioDefinition => {
  const id = overrides?.id ?? 'test-scenario';
  return {
    id,
    name: overrides?.name ?? `${id} scenario`,
    description: overrides?.description ?? `Scenario for ${id}`,
    mocks: [],
    ...overrides,
  };
};
