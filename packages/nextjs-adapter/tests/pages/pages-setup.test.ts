import { describe, it, expect } from 'vitest';
import type { ScenarioDefinition } from '@scenarist/core';
import { createScenarist } from '../../src/pages/setup.js';

const createTestSetup = () => {
  const defaultScenario: ScenarioDefinition = {
    id: 'default',
    name: 'Default Scenario',
    description: 'Default test scenario',
    mocks: [],
  };

  const scenarist = createScenarist({
    enabled: true,
    defaultScenario,
  });

  return { scenarist, defaultScenario };
};

describe('Pages Router createScenarist', () => {
  const premiumScenario: ScenarioDefinition = {
    id: 'premium',
    name: 'Premium Scenario',
    description: 'Premium test scenario',
    mocks: [],
  };

  it('should create scenarist instance with config', () => {
    const { scenarist } = createTestSetup();

    expect(scenarist.config).toBeDefined();
    expect(scenarist.config.enabled).toBe(true);
  });

  it('should register default scenario automatically', () => {
    const { scenarist } = createTestSetup();

    const scenarios = scenarist.listScenarios();

    expect(scenarios).toHaveLength(1);
    expect(scenarios[0]?.id).toBe('default');
  });

  it('should register additional scenarios', () => {
    const { scenarist } = createTestSetup();

    scenarist.registerScenario(premiumScenario);

    const scenarios = scenarist.listScenarios();

    expect(scenarios).toHaveLength(2);
    expect(scenarios.map((s) => s.id)).toContain('premium');
  });

  it('should register multiple scenarios at once', () => {
    const { scenarist } = createTestSetup();

    const scenario2: ScenarioDefinition = {
      id: 'scenario2',
      name: 'Scenario 2',
      description: 'Second test scenario',
      mocks: [],
    };

    scenarist.registerScenarios([premiumScenario, scenario2]);

    const scenarios = scenarist.listScenarios();

    expect(scenarios).toHaveLength(3); // default + premium + scenario2
  });

  it('should switch scenarios', () => {
    const { scenarist } = createTestSetup();

    scenarist.registerScenario(premiumScenario);

    const result = scenarist.switchScenario('test-1', 'premium', undefined);

    expect(result.success).toBe(true);
  });

  it('should get active scenario', () => {
    const { scenarist } = createTestSetup();

    scenarist.registerScenario(premiumScenario);
    scenarist.switchScenario('test-2', 'premium', undefined);

    const active = scenarist.getActiveScenario('test-2');

    expect(active).toEqual({
      scenarioId: 'premium',
      variantName: undefined,
    });
  });

  it('should get scenario by ID', () => {
    const { scenarist } = createTestSetup();

    scenarist.registerScenario(premiumScenario);

    const scenario = scenarist.getScenarioById('premium');

    expect(scenario).toEqual(premiumScenario);
  });

  it('should clear scenario for test ID', () => {
    const { scenarist } = createTestSetup();

    scenarist.registerScenario(premiumScenario);
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
