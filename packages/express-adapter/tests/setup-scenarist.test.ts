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
});
