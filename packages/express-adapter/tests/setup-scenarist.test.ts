import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createScenarist } from '../src/setup/setup-scenarist.js';
import type { ScenarioDefinition } from '@scenarist/core';

const mockDefaultScenario: ScenarioDefinition = {
  id: 'default',
  name: 'Default Scenario',
  description: 'Default test scenario',
  mocks: [],
};

describe('createScenarist', () => {
  it('should return object with all expected properties', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
      strictMode: false,
    });

    expect(scenarist).toHaveProperty('config');
    expect(scenarist).toHaveProperty('middleware');
    expect(scenarist).toHaveProperty('registerScenario');
    expect(scenarist).toHaveProperty('registerScenarios');
    expect(scenarist).toHaveProperty('switchScenario');
    expect(scenarist).toHaveProperty('getActiveScenario');
    expect(scenarist).toHaveProperty('getScenarioById');
    expect(scenarist).toHaveProperty('listScenarios');
    expect(scenarist).toHaveProperty('clearScenario');
    expect(scenarist).toHaveProperty('start');
    expect(scenarist).toHaveProperty('stop');
  });

  it('should expose config with correct default values', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
    });

    expect(scenarist.config.endpoints.setScenario).toBe('/__scenario__');
    expect(scenarist.config.endpoints.getScenario).toBe('/__scenario__');
    expect(scenarist.config.headers.testId).toBe('x-test-id');
    expect(scenarist.config.headers.mockEnabled).toBe('x-mock-enabled');
    expect(scenarist.config.defaultScenarioId).toBe('default');
    expect(scenarist.config.strictMode).toBe(false);
  });

  it('should expose config with custom values when provided', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
      endpoints: {
        setScenario: '/custom-set',
        getScenario: '/custom-get',
      },
      headers: {
        testId: 'x-custom-test',
        mockEnabled: 'x-custom-mock',
      },
      strictMode: true,
    });

    expect(scenarist.config.endpoints.setScenario).toBe('/custom-set');
    expect(scenarist.config.endpoints.getScenario).toBe('/custom-get');
    expect(scenarist.config.headers.testId).toBe('x-custom-test');
    expect(scenarist.config.headers.mockEnabled).toBe('x-custom-mock');
    expect(scenarist.config.strictMode).toBe(true);
  });

  it('should create working middleware that uses config values', async () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
      strictMode: false,
    });

    scenarist.registerScenario({
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'Test',
      mocks: [],
    });

    const app = express();
    app.use(express.json());
    app.use(scenarist.middleware);

    const response = await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'test-123')
      .send({ scenario: 'test-scenario' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.testId).toBe('test-123');
  });

  it('should intercept external API calls based on registered scenario', async () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
      strictMode: false,
    });

    scenarist.registerScenario({
      id: 'api-success',
      name: 'API Success',
      description: 'External API returns success',
      mocks: [
        {
          method: 'GET',
          url: 'https://api.example.com/data',
          response: {
            status: 200,
            body: { message: 'mocked response' },
          },
        },
      ],
    });

    scenarist.start();

    const app = express();
    app.use(express.json());
    app.use(scenarist.middleware);

    app.get('/test-route', async (_req, res) => {
      const response = await fetch('https://api.example.com/data');
      const data = await response.json();
      res.json(data);
    });

    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'test-456')
      .send({ scenario: 'api-success' });

    const response = await request(app)
      .get('/test-route')
      .set(scenarist.config.headers.testId, 'test-456');

    await scenarist.stop();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('mocked response');
  });

  it('should register multiple scenarios at once', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
    });

    const scenario1: ScenarioDefinition = {
      id: 'scenario-1',
      name: 'Scenario 1',
      description: 'First test scenario',
      mocks: [],
    };

    const scenario2: ScenarioDefinition = {
      id: 'scenario-2',
      name: 'Scenario 2',
      description: 'Second test scenario',
      mocks: [],
    };

    const scenario3: ScenarioDefinition = {
      id: 'scenario-3',
      name: 'Scenario 3',
      description: 'Third test scenario',
      mocks: [],
    };

    scenarist.registerScenarios([scenario1, scenario2, scenario3]);

    const scenarios = scenarist.listScenarios();
    expect(scenarios).toHaveLength(4); // default + 3 registered
    expect(scenarios.find((s) => s.id === 'scenario-1')).toBeDefined();
    expect(scenarios.find((s) => s.id === 'scenario-2')).toBeDefined();
    expect(scenarios.find((s) => s.id === 'scenario-3')).toBeDefined();
  });

  it('should throw error when registering duplicate scenario ID', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
    });

    const scenario1: ScenarioDefinition = {
      id: 'duplicate',
      name: 'First',
      description: 'First scenario',
      mocks: [],
    };

    const scenario2: ScenarioDefinition = {
      id: 'duplicate',
      name: 'Second',
      description: 'Second scenario',
      mocks: [],
    };

    scenarist.registerScenario(scenario1);

    expect(() => scenarist.registerScenario(scenario2)).toThrow(
      "Scenario 'duplicate' is already registered"
    );
  });

  it('should throw error when batch registering with duplicate IDs', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
    });

    const scenario1: ScenarioDefinition = {
      id: 'unique-1',
      name: 'Unique 1',
      description: 'First unique scenario',
      mocks: [],
    };

    const scenario2: ScenarioDefinition = {
      id: 'duplicate',
      name: 'Duplicate',
      description: 'Duplicate scenario',
      mocks: [],
    };

    scenarist.registerScenario(scenario1);
    scenarist.registerScenario(scenario2);

    const scenario3: ScenarioDefinition = {
      id: 'unique-2',
      name: 'Unique 2',
      description: 'Second unique scenario',
      mocks: [],
    };

    const scenario4: ScenarioDefinition = {
      id: 'duplicate',
      name: 'Duplicate Again',
      description: 'Attempting to register duplicate',
      mocks: [],
    };

    expect(() => scenarist.registerScenarios([scenario3, scenario4])).toThrow(
      "Scenario 'duplicate' is already registered"
    );
  });

  it('should allow batch registering scenarios including default (idempotent)', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
    });

    const scenario1: ScenarioDefinition = {
      id: 'scenario-1',
      name: 'Scenario 1',
      description: 'First scenario',
      mocks: [],
    };

    const scenario2: ScenarioDefinition = {
      id: 'scenario-2',
      name: 'Scenario 2',
      description: 'Second scenario',
      mocks: [],
    };

    // This is the real-world use case: Object.values(scenarios) includes default
    const allScenarios = [mockDefaultScenario, scenario1, scenario2];

    // Should not throw even though default is already registered
    expect(() => scenarist.registerScenarios(allScenarios)).not.toThrow();

    const scenarios = scenarist.listScenarios();
    expect(scenarios).toHaveLength(3); // default + 2 new scenarios
    expect(scenarios.find((s) => s.id === 'default')).toBeDefined();
    expect(scenarios.find((s) => s.id === 'scenario-1')).toBeDefined();
    expect(scenarios.find((s) => s.id === 'scenario-2')).toBeDefined();
  });
});
