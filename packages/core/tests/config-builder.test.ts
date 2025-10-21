import { describe, it, expect } from 'vitest';
import { buildConfig } from '../src/domain/config-builder.js';

describe('buildConfig', () => {
  it('should apply default values for missing config properties', () => {
    const config = buildConfig({
      enabled: true,
    });

    expect(config.enabled).toBe(true);
    expect(config.headers.testId).toBe('x-test-id');
    expect(config.headers.mockEnabled).toBe('x-mock-enabled');
    expect(config.endpoints.setScenario).toBe('/__scenario__');
    expect(config.endpoints.getScenario).toBe('/__scenario__');
    expect(config.defaultScenario).toBe('default');
    expect(config.defaultTestId).toBe('default-test');
  });

  it('should allow overriding header config', () => {
    const config = buildConfig({
      enabled: true,
      headers: {
        testId: 'x-custom-test-id',
        mockEnabled: 'x-custom-mock',
      },
    });

    expect(config.headers.testId).toBe('x-custom-test-id');
    expect(config.headers.mockEnabled).toBe('x-custom-mock');
  });

  it('should allow overriding endpoint config', () => {
    const config = buildConfig({
      enabled: true,
      endpoints: {
        setScenario: '/api/scenario/set',
        getScenario: '/api/scenario/get',
      },
    });

    expect(config.endpoints.setScenario).toBe('/api/scenario/set');
    expect(config.endpoints.getScenario).toBe('/api/scenario/get');
  });

  it('should allow overriding default scenario', () => {
    const config = buildConfig({
      enabled: true,
      defaultScenario: 'happy-path',
    });

    expect(config.defaultScenario).toBe('happy-path');
  });

  it('should allow overriding default test ID', () => {
    const config = buildConfig({
      enabled: true,
      defaultTestId: 'my-test',
    });

    expect(config.defaultTestId).toBe('my-test');
  });

  it('should support function for enabled property', () => {
    const enabledFn = (): boolean => process.env.NODE_ENV !== 'production';
    const config = buildConfig({
      enabled: enabledFn,
    });

    expect(config.enabled).toBe(enabledFn);
    expect(typeof config.enabled).toBe('function');
  });

  it('should allow partial override of headers while keeping defaults for others', () => {
    const config = buildConfig({
      enabled: true,
      headers: {
        testId: 'x-my-test-id',
      },
    });

    expect(config.headers.testId).toBe('x-my-test-id');
    expect(config.headers.mockEnabled).toBe('x-mock-enabled');
  });

  it('should allow partial override of endpoints while keeping defaults for others', () => {
    const config = buildConfig({
      enabled: false,
      endpoints: {
        setScenario: '/custom/set',
      },
    });

    expect(config.endpoints.setScenario).toBe('/custom/set');
    expect(config.endpoints.getScenario).toBe('/__scenario__');
  });
});
