import { describe, it, expect } from 'vitest';
import type { ScenarioDefinition, ScenariosObject } from '@scenarist/core';
import { createScenarist } from '../../src/pages/setup.js';

// Define all test scenarios upfront
const testScenarios = {
  default: {
    id: 'default',
    name: 'Default Scenario',
    description: 'Default test scenario',
    mocks: [],
  },
  premium: {
    id: 'premium',
    name: 'Premium Scenario',
    description: 'Premium test scenario',
    mocks: [],
  },
  scenario2: {
    id: 'scenario2',
    name: 'Scenario 2',
    description: 'Second test scenario',
    mocks: [],
  },
} as const satisfies ScenariosObject;

const createTestSetup = () => {
  const scenarist = createScenarist({
    enabled: true,
    scenarios: testScenarios,
  });

  return { scenarist };
};

describe('Pages Router createScenarist', () => {
  it('should create scenarist instance with config', () => {
    const { scenarist } = createTestSetup();

    expect(scenarist.config).toBeDefined();
    expect(scenarist.config.enabled).toBe(true);
  });

  it('should have all scenarios registered at initialization', () => {
    const { scenarist } = createTestSetup();

    const scenarios = scenarist.listScenarios();

    expect(scenarios).toHaveLength(3); // default + premium + scenario2
    expect(scenarios.map((s) => s.id)).toContain('default');
    expect(scenarios.map((s) => s.id)).toContain('premium');
    expect(scenarios.map((s) => s.id)).toContain('scenario2');
  });

  it('should switch scenarios', () => {
    const { scenarist } = createTestSetup();

    const result = scenarist.switchScenario('test-1', 'premium', undefined);

    expect(result.success).toBe(true);
  });

  it('should get active scenario', () => {
    const { scenarist } = createTestSetup();

    scenarist.switchScenario('test-2', 'premium', undefined);

    const active = scenarist.getActiveScenario('test-2');

    expect(active).toEqual({
      scenarioId: 'premium',
      variantName: undefined,
    });
  });

  it('should get scenario by ID', () => {
    const { scenarist } = createTestSetup();

    const scenario = scenarist.getScenarioById('premium');

    expect(scenario).toEqual(testScenarios.premium);
  });

  it('should clear scenario for test ID', () => {
    const { scenarist } = createTestSetup();

    scenarist.switchScenario('test-3', 'premium', undefined);

    scenarist.clearScenario('test-3');

    const active = scenarist.getActiveScenario('test-3');
    expect(active).toBeUndefined();
  });

  it('should provide scenario endpoint handler', () => {
    const { scenarist } = createTestSetup();

    expect(scenarist.createScenarioEndpoint).toBeDefined();
    expect(typeof scenarist.createScenarioEndpoint).toBe('function');
  });

  it('should create working scenario endpoint when called', async () => {
    const { scenarist } = createTestSetup();

    const endpoint = scenarist.createScenarioEndpoint();

    expect(endpoint).toBeDefined();
    expect(typeof endpoint).toBe('function');
  });

  it('should start MSW server', () => {
    const { scenarist } = createTestSetup();

    expect(() => scenarist.start()).not.toThrow();
  });

  it('should stop MSW server', async () => {
    const { scenarist } = createTestSetup();

    scenarist.start();
    await expect(scenarist.stop()).resolves.not.toThrow();
  });
});
