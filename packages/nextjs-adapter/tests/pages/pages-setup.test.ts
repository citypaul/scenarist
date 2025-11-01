import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ScenarioDefinition } from '@scenarist/core';
import { createScenarist } from '../../src/pages/setup.js';

describe('Pages Router createScenarist', () => {
  const defaultScenario: ScenarioDefinition = {
    id: 'default',
    name: 'Default Scenario',
    mocks: [],
  };

  const premiumScenario: ScenarioDefinition = {
    id: 'premium',
    name: 'Premium Scenario',
    mocks: [],
  };

  let scenarist: ReturnType<typeof createScenarist>;

  beforeEach(() => {
    scenarist = createScenarist({
      enabled: true,
      defaultScenario,
    });
  });

  afterEach(async () => {
    await scenarist.stop();
  });

  it('should create scenarist instance with config', () => {
    expect(scenarist.config).toBeDefined();
    expect(scenarist.config.enabled).toBe(true);
  });

  it('should register default scenario automatically', () => {
    const scenarios = scenarist.listScenarios();

    expect(scenarios).toHaveLength(1);
    expect(scenarios[0]?.id).toBe('default');
  });

  it('should register additional scenarios', () => {
    scenarist.registerScenario(premiumScenario);

    const scenarios = scenarist.listScenarios();

    expect(scenarios).toHaveLength(2);
    expect(scenarios.map((s) => s.id)).toContain('premium');
  });

  it('should register multiple scenarios at once', () => {
    const scenario2: ScenarioDefinition = {
      id: 'scenario2',
      name: 'Scenario 2',
      mocks: [],
    };

    scenarist.registerScenarios([premiumScenario, scenario2]);

    const scenarios = scenarist.listScenarios();

    expect(scenarios).toHaveLength(3); // default + premium + scenario2
  });

  it('should switch scenarios', () => {
    scenarist.registerScenario(premiumScenario);

    const result = scenarist.switchScenario('test-1', 'premium', undefined);

    expect(result.success).toBe(true);
  });

  it('should get active scenario', () => {
    scenarist.registerScenario(premiumScenario);
    scenarist.switchScenario('test-2', 'premium', undefined);

    const active = scenarist.getActiveScenario('test-2');

    expect(active).toEqual({
      scenarioId: 'premium',
      variantName: undefined,
    });
  });

  it('should get scenario by ID', () => {
    scenarist.registerScenario(premiumScenario);

    const scenario = scenarist.getScenarioById('premium');

    expect(scenario).toEqual(premiumScenario);
  });

  it('should clear scenario for test ID', () => {
    scenarist.registerScenario(premiumScenario);
    scenarist.switchScenario('test-3', 'premium', undefined);

    scenarist.clearScenario('test-3');

    const active = scenarist.getActiveScenario('test-3');
    expect(active).toBeUndefined();
  });

  it('should provide scenario endpoint handler', () => {
    expect(scenarist.createScenarioEndpoint).toBeDefined();
    expect(typeof scenarist.createScenarioEndpoint).toBe('function');
  });

  it('should start MSW server', () => {
    expect(() => scenarist.start()).not.toThrow();
  });

  it('should stop MSW server', async () => {
    scenarist.start();
    await expect(scenarist.stop()).resolves.not.toThrow();
  });
});
