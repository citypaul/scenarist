import { describe, it, expect } from 'vitest';
import { buildConfig } from '../src/domain/config-builder.js';
import type { ScenaristScenario, ScenaristScenarios } from '../src/types/index.js';

const mockDefaultScenario: ScenaristScenario = {
  id: 'default',
  name: 'Default Scenario',
  description: 'Default test scenario',
  mocks: [],
};

const mockScenarios = {
  default: mockDefaultScenario,
} as const satisfies ScenaristScenarios;

describe('buildConfig', () => {
  it('should apply default values for missing config properties', () => {
    const config = buildConfig({
      enabled: true,
      scenarios: mockScenarios,
    });

    expect(config.enabled).toBe(true);
    expect(config.endpoints.setScenario).toBe('/__scenario__');
    expect(config.endpoints.getScenario).toBe('/__scenario__');
    expect(config.defaultTestId).toBe('default-test');
    expect(config.strictMode).toBe(false);
  });

  it('should allow overriding endpoint config', () => {
    const config = buildConfig({
      enabled: true,
      scenarios: mockScenarios,
      endpoints: {
        setScenario: '/api/scenario/set',
        getScenario: '/api/scenario/get',
      },
    });

    expect(config.endpoints.setScenario).toBe('/api/scenario/set');
    expect(config.endpoints.getScenario).toBe('/api/scenario/get');
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
      [property]: value,
    });

    expect(config[property]).toBe(value);

    // Also verify default when not provided
    const configWithDefaults = buildConfig({
      enabled: true,
      scenarios: mockScenarios,
    });
    expect(configWithDefaults[property]).toBe(defaultValue);
  });

  it('should require evaluated boolean for enabled property', () => {
    // Dynamic enabling must be evaluated BEFORE creating config (for serialization)
    const isEnabled = process.env.NODE_ENV !== 'production';
    const config = buildConfig({
      enabled: isEnabled,
      scenarios: mockScenarios,
    });

    expect(config.enabled).toBe(isEnabled);
    expect(typeof config.enabled).toBe('boolean');
  });

  it('should allow partial override of endpoints while keeping defaults for others', () => {
    const config = buildConfig({
      enabled: false,
      scenarios: mockScenarios,
      endpoints: {
        setScenario: '/custom/set',
      },
    });

    expect(config.endpoints.setScenario).toBe('/custom/set');
    expect(config.endpoints.getScenario).toBe('/__scenario__');
  });

  describe('Default Key Enforcement', () => {
    it('should reject scenarios object without "default" key', () => {
      const scenariosWithoutDefault = {
        baseline: { id: 'baseline', name: 'Baseline', description: 'Test', mocks: [] },
        premium: { id: 'premium', name: 'Premium', description: 'Test', mocks: [] },
      } as const satisfies ScenaristScenarios;

      expect(() =>
        buildConfig({
          enabled: true,
          scenarios: scenariosWithoutDefault,
        })
      ).toThrow(/must have a 'default' key/i);
    });

    it('should accept scenarios object with "default" key', () => {
      const scenariosWithDefault = {
        default: { id: 'default', name: 'Default', description: 'Test', mocks: [] },
        premium: { id: 'premium', name: 'Premium', description: 'Test', mocks: [] },
      } as const satisfies ScenaristScenarios;

      expect(() =>
        buildConfig({
          enabled: true,
          scenarios: scenariosWithDefault,
        })
      ).not.toThrow();
    });

    it('should accept scenarios object with only "default" key', () => {
      const scenariosOnlyDefault = {
        default: { id: 'default', name: 'Default', description: 'Test', mocks: [] },
      } as const satisfies ScenaristScenarios;

      expect(() =>
        buildConfig({
          enabled: true,
          scenarios: scenariosOnlyDefault,
        })
      ).not.toThrow();
    });
  });
});
