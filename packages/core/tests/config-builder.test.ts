import { describe, it, expect } from 'vitest';
import { buildConfig } from '../src/domain/config-builder.js';
import type { ScenarioDefinition, ScenariosObject } from '../src/types/index.js';

const mockDefaultScenario: ScenarioDefinition = {
  id: 'default',
  name: 'Default Scenario',
  description: 'Default test scenario',
  mocks: [],
};

const mockScenarios = {
  default: mockDefaultScenario,
} as const satisfies ScenariosObject;

describe('buildConfig', () => {
  it('should apply default values for missing config properties', () => {
    const config = buildConfig({
      enabled: true,
      scenarios: mockScenarios,
      defaultScenarioId: 'default',
    });

    expect(config.enabled).toBe(true);
    expect(config.headers.testId).toBe('x-test-id');
    expect(config.endpoints.setScenario).toBe('/__scenario__');
    expect(config.endpoints.getScenario).toBe('/__scenario__');
    expect(config.defaultScenarioId).toBe('default');
    expect(config.defaultTestId).toBe('default-test');
    expect(config.strictMode).toBe(false);
  });

  it('should allow overriding header config', () => {
    const config = buildConfig({
      enabled: true,
      scenarios: mockScenarios,
      defaultScenarioId: 'default',
      headers: {
        testId: 'x-custom-test-id',
      },
    });

    expect(config.headers.testId).toBe('x-custom-test-id');
  });

  it('should allow overriding endpoint config', () => {
    const config = buildConfig({
      enabled: true,
      scenarios: mockScenarios,
      defaultScenarioId: 'default',
      endpoints: {
        setScenario: '/api/scenario/set',
        getScenario: '/api/scenario/get',
      },
    });

    expect(config.endpoints.setScenario).toBe('/api/scenario/set');
    expect(config.endpoints.getScenario).toBe('/api/scenario/get');
  });

  it('should use provided defaultScenarioId', () => {
    const customScenario: ScenarioDefinition = {
      id: 'happy-path',
      name: 'Happy Path',
      description: 'All APIs succeed',
      mocks: [],
    };

    const customScenarios = {
      'happy-path': customScenario,
    } as const satisfies ScenariosObject;

    const config = buildConfig({
      enabled: true,
      scenarios: customScenarios,
      defaultScenarioId: 'happy-path',
    });

    expect(config.defaultScenarioId).toBe('happy-path');
  });

  it.each<{
    property: 'defaultTestId' | 'strictMode';
    value: string | boolean;
    default: string | boolean;
  }>([
    { property: 'defaultTestId', value: 'my-test', default: 'default-test' },
    { property: 'strictMode', value: true, default: false },
  ])('should allow overriding $property', ({ property, value, default: defaultValue }) => {
    const config = buildConfig({
      enabled: true,
      scenarios: mockScenarios,
      defaultScenarioId: 'default',
      [property]: value,
    });

    expect(config[property]).toBe(value);

    // Also verify default when not provided
    const configWithDefaults = buildConfig({
      enabled: true,
      scenarios: mockScenarios,
      defaultScenarioId: 'default',
    });
    expect(configWithDefaults[property]).toBe(defaultValue);
  });

  it('should require evaluated boolean for enabled property', () => {
    // Dynamic enabling must be evaluated BEFORE creating config (for serialization)
    const isEnabled = process.env.NODE_ENV !== 'production';
    const config = buildConfig({
      enabled: isEnabled,
      scenarios: mockScenarios,
      defaultScenarioId: 'default',
    });

    expect(config.enabled).toBe(isEnabled);
    expect(typeof config.enabled).toBe('boolean');
  });

  it('should allow partial override of headers while keeping defaults for others', () => {
    const config = buildConfig({
      enabled: true,
      scenarios: mockScenarios,
      defaultScenarioId: 'default',
      headers: {
        testId: 'x-my-test-id',
      },
    });

    expect(config.headers.testId).toBe('x-my-test-id');
  });

  it('should allow partial override of endpoints while keeping defaults for others', () => {
    const config = buildConfig({
      enabled: false,
      scenarios: mockScenarios,
      defaultScenarioId: 'default',
      endpoints: {
        setScenario: '/custom/set',
      },
    });

    expect(config.endpoints.setScenario).toBe('/custom/set');
    expect(config.endpoints.getScenario).toBe('/__scenario__');
  });
});
