import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createTestScenarist } from './test-helpers.js';
import { SCENARIST_TEST_ID_HEADER, type ScenaristScenario, type ScenaristScenarios } from '@scenarist/core';

const mockDefaultScenario: ScenaristScenario = {
  id: 'default',
  name: 'Default Scenario',
  description: 'Default test scenario',
  mocks: [],
};

// Define all scenarios used in tests upfront
const testScenarios = {
  default: mockDefaultScenario,
  'test-scenario': {
    id: 'test-scenario',
    name: 'Test Scenario',
    description: 'Test',
    mocks: [],
  },
  'api-success': {
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
  },
  'scenario-1': {
    id: 'scenario-1',
    name: 'Scenario 1',
    description: 'First test scenario',
    mocks: [],
  },
  'scenario-2': {
    id: 'scenario-2',
    name: 'Scenario 2',
    description: 'Second test scenario',
    mocks: [],
  },
  'scenario-3': {
    id: 'scenario-3',
    name: 'Scenario 3',
    description: 'Third test scenario',
    mocks: [],
  },
  stateful: {
    id: 'stateful',
    name: 'Stateful Scenario',
    description: 'Captures and injects state',
    mocks: [
      {
        method: 'POST',
        url: 'https://api.example.com/user',
        captureState: {
          userName: 'body.name',
          userEmail: 'body.email',
        },
        response: {
          status: 201,
          body: { success: true },
        },
      },
      {
        method: 'GET',
        url: 'https://api.example.com/profile',
        response: {
          status: 200,
          body: {
            name: '{{state.userName}}',
            email: '{{state.userEmail}}',
          },
        },
      },
    ],
  },
  'scenario-with-capture': {
    id: 'scenario-with-capture',
    name: 'Scenario With Capture',
    description: 'Captures state',
    mocks: [
      {
        method: 'POST',
        url: 'https://api.example.com/data',
        captureState: {
          capturedValue: 'body.value',
        },
        response: {
          status: 200,
          body: { success: true },
        },
      },
    ],
  },
  'scenario-with-injection': {
    id: 'scenario-with-injection',
    name: 'Scenario With Injection',
    description: 'Uses state in template',
    mocks: [
      {
        method: 'GET',
        url: 'https://api.example.com/data',
        response: {
          status: 200,
          body: {
            value: '{{state.capturedValue}}',
          },
        },
      },
    ],
  },
  'isolated-state': {
    id: 'isolated-state',
    name: 'Isolated State',
    description: 'State isolated per test ID',
    mocks: [
      {
        method: 'POST',
        url: 'https://api.example.com/user',
        captureState: {
          userName: 'body.name',
        },
        response: {
          status: 200,
          body: { success: true },
        },
      },
      {
        method: 'GET',
        url: 'https://api.example.com/user',
        response: {
          status: 200,
          body: {
            name: '{{state.userName}}',
          },
        },
      },
    ],
  },
  'array-append': {
    id: 'array-append',
    name: 'Array Append',
    description: 'Appends items to array',
    mocks: [
      {
        method: 'POST',
        url: 'https://api.example.com/cart/add',
        captureState: {
          'items[]': 'body.item',
        },
        response: {
          status: 200,
          body: { success: true },
        },
      },
      {
        method: 'GET',
        url: 'https://api.example.com/cart',
        response: {
          status: 200,
          body: {
            items: '{{state.items}}',
          },
        },
      },
    ],
  },
  'array-length': {
    id: 'array-length',
    name: 'Array Length',
    description: 'Injects array length',
    mocks: [
      {
        method: 'POST',
        url: 'https://api.example.com/items/add',
        captureState: {
          'items[]': 'body.item',
        },
        response: {
          status: 200,
          body: { success: true },
        },
      },
      {
        method: 'GET',
        url: 'https://api.example.com/items/count',
        response: {
          status: 200,
          body: {
            count: '{{state.items.length}}',
            items: '{{state.items}}',
          },
        },
      },
    ],
  },
  'nested-paths': {
    id: 'nested-paths',
    name: 'Nested Paths',
    description: 'Injects nested object values',
    mocks: [
      {
        method: 'POST',
        url: 'https://api.example.com/form/step1',
        captureState: {
          'user.name': 'body.name',
          'user.email': 'body.email',
        },
        response: {
          status: 200,
          body: { success: true },
        },
      },
      {
        method: 'POST',
        url: 'https://api.example.com/form/step2',
        captureState: {
          'user.address.street': 'body.street',
          'user.address.city': 'body.city',
        },
        response: {
          status: 200,
          body: { success: true },
        },
      },
      {
        method: 'GET',
        url: 'https://api.example.com/form/summary',
        response: {
          status: 200,
          body: {
            userName: '{{state.user.name}}',
            userEmail: '{{state.user.email}}',
            userStreet: '{{state.user.address.street}}',
            userCity: '{{state.user.address.city}}',
          },
        },
      },
    ],
  },
  'missing-keys': {
    id: 'missing-keys',
    name: 'Missing Keys',
    description: 'Templates with missing keys remain unreplaced',
    mocks: [
      {
        method: 'GET',
        url: 'https://api.example.com/profile',
        response: {
          status: 200,
          body: {
            name: '{{state.userName}}',
            email: '{{state.userEmail}}',
            address: '{{state.userAddress}}',
          },
        },
      },
    ],
  },
} as const satisfies ScenaristScenarios;

describe('createScenarist', () => {
  it('should return object with all expected properties', async () => {
    const scenarist = await createTestScenarist({
      enabled: true,
      scenarios: testScenarios,
      strictMode: false,
    });

    expect(scenarist).toHaveProperty('config');
    expect(scenarist).toHaveProperty('middleware');
    expect(scenarist).toHaveProperty('switchScenario');
    expect(scenarist).toHaveProperty('getActiveScenario');
    expect(scenarist).toHaveProperty('getScenarioById');
    expect(scenarist).toHaveProperty('listScenarios');
    expect(scenarist).toHaveProperty('clearScenario');
    expect(scenarist).toHaveProperty('start');
    expect(scenarist).toHaveProperty('stop');
  });

  it('should expose config with correct default values', async () => {
    const scenarist = await createTestScenarist({
      enabled: true,
      scenarios: testScenarios,
    });

    expect(scenarist.config.endpoints.setScenario).toBe('/__scenario__');
    expect(scenarist.config.endpoints.getScenario).toBe('/__scenario__');
    expect(scenarist.config.strictMode).toBe(false);
  });

  it('should expose config with custom values when provided', async () => {
    const scenarist = await createTestScenarist({
      enabled: true,
      scenarios: testScenarios,
      endpoints: {
        setScenario: '/custom-set',
        getScenario: '/custom-get',
      },
      strictMode: true,
    });

    expect(scenarist.config.endpoints.setScenario).toBe('/custom-set');
    expect(scenarist.config.endpoints.getScenario).toBe('/custom-get');
    expect(scenarist.config.strictMode).toBe(true);
  });

  it('should create working middleware that uses config values', async () => {
    const scenarist = await createTestScenarist({
      enabled: true,
      scenarios: testScenarios,
      strictMode: false,
    });

    const app = express();
    app.use(express.json());
    app.use(scenarist.middleware);

    const response = await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(SCENARIST_TEST_ID_HEADER, 'test-123')
      .send({ scenario: 'test-scenario' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.testId).toBe('test-123');
  });

  it('should intercept external API calls based on registered scenario', async () => {
    const scenarist = await createTestScenarist({
      enabled: true,
      scenarios: testScenarios,
      strictMode: false,
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
      .set(SCENARIST_TEST_ID_HEADER, 'test-456')
      .send({ scenario: 'api-success' });

    const response = await request(app)
      .get('/test-route')
      .set(SCENARIST_TEST_ID_HEADER, 'test-456');

    await scenarist.stop();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('mocked response');
  });

  it('should have all scenarios registered at initialization', async () => {
    const scenarist = await createTestScenarist({
      enabled: true,
      scenarios: testScenarios,
    });

    const scenarios = scenarist.listScenarios();
    expect(scenarios).toHaveLength(14); // All test scenarios
    expect(scenarios.find((s) => s.id === 'scenario-1')).toBeDefined();
    expect(scenarios.find((s) => s.id === 'scenario-2')).toBeDefined();
    expect(scenarios.find((s) => s.id === 'scenario-3')).toBeDefined();
  });

  it('should switch scenario programmatically', async () => {
    const scenarist = await createTestScenarist({
      enabled: true,
      scenarios: testScenarios,
    });

    const result = scenarist.switchScenario('test-123', 'test-scenario');

    expect(result.success).toBe(true);

    const activeScenario = scenarist.getActiveScenario('test-123');
    expect(activeScenario).toEqual({ scenarioId: 'test-scenario' });
  });

  it('should retrieve scenario by ID', async () => {
    const scenarist = await createTestScenarist({
      enabled: true,
      scenarios: testScenarios,
    });

    const scenario = scenarist.getScenarioById('test-scenario');

    expect(scenario).toBeDefined();
    expect(scenario?.id).toBe('test-scenario');
  });

  it('should clear active scenario for a test ID', async () => {
    const scenarist = await createTestScenarist({
      enabled: true,
      scenarios: testScenarios,
    });

    scenarist.switchScenario('test-123', 'test-scenario');

    const beforeClear = scenarist.getActiveScenario('test-123');
    expect(beforeClear).toEqual({ scenarioId: 'test-scenario' });

    scenarist.clearScenario('test-123');

    const afterClear = scenarist.getActiveScenario('test-123');
    expect(afterClear).toBeUndefined();
  });

  describe('Phase 3: Stateful Mocks', () => {
    it('should capture state from request and inject into response template', async () => {
      const scenarist = await createTestScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      scenarist.start();

      const app = express();
      app.use(express.json());
      app.use(scenarist.middleware);

      app.post('/capture', async (req, res) => {
        const response = await fetch('https://api.example.com/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
      });

      app.get('/inject', async (_req, res) => {
        const response = await fetch('https://api.example.com/profile');
        const data = await response.json();
        res.json(data);
      });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'test-state-1')
        .send({ scenario: 'stateful' });

      await request(app)
        .post('/capture')
        .set(SCENARIST_TEST_ID_HEADER, 'test-state-1')
        .send({ name: 'Alice', email: 'alice@example.com' });

      const response = await request(app)
        .get('/inject')
        .set(SCENARIST_TEST_ID_HEADER, 'test-state-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Alice');
      expect(response.body.email).toBe('alice@example.com');
    });

    it('should reset state when switching scenarios', async () => {
      const scenarist = await createTestScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      scenarist.start();

      const app = express();
      app.use(express.json());
      app.use(scenarist.middleware);

      app.post('/data', async (req, res) => {
        const response = await fetch('https://api.example.com/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
      });

      app.get('/data', async (_req, res) => {
        const response = await fetch('https://api.example.com/data');
        const data = await response.json();
        res.json(data);
      });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'test-reset-1')
        .send({ scenario: 'scenario-with-capture' });

      await request(app)
        .post('/data')
        .set(SCENARIST_TEST_ID_HEADER, 'test-reset-1')
        .send({ value: 'captured-data' });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'test-reset-1')
        .send({ scenario: 'scenario-with-injection' });

      const response = await request(app)
        .get('/data')
        .set(SCENARIST_TEST_ID_HEADER, 'test-reset-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.value).toBeNull(); // Pure templates with missing state return null (JSON-safe)
    });

    it('should isolate state per test ID', async () => {
      const scenarist = await createTestScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      scenarist.start();

      const app = express();
      app.use(express.json());
      app.use(scenarist.middleware);

      app.post('/user', async (req, res) => {
        const response = await fetch('https://api.example.com/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
      });

      app.get('/user', async (_req, res) => {
        const response = await fetch('https://api.example.com/user');
        const data = await response.json();
        res.json(data);
      });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'test-isolation-1')
        .send({ scenario: 'isolated-state' });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'test-isolation-2')
        .send({ scenario: 'isolated-state' });

      await request(app)
        .post('/user')
        .set(SCENARIST_TEST_ID_HEADER, 'test-isolation-1')
        .send({ name: 'Alice' });

      await request(app)
        .post('/user')
        .set(SCENARIST_TEST_ID_HEADER, 'test-isolation-2')
        .send({ name: 'Bob' });

      const response1 = await request(app)
        .get('/user')
        .set(SCENARIST_TEST_ID_HEADER, 'test-isolation-1');

      const response2 = await request(app)
        .get('/user')
        .set(SCENARIST_TEST_ID_HEADER, 'test-isolation-2');

      await scenarist.stop();

      expect(response1.status).toBe(200);
      expect(response1.body.name).toBe('Alice');

      expect(response2.status).toBe(200);
      expect(response2.body.name).toBe('Bob');
    });

    it('should append items to array state', async () => {
      const scenarist = await createTestScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      scenarist.start();

      const app = express();
      app.use(express.json());
      app.use(scenarist.middleware);

      app.post('/cart/add', async (req, res) => {
        const response = await fetch('https://api.example.com/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
      });

      app.get('/cart', async (_req, res) => {
        const response = await fetch('https://api.example.com/cart');
        const data = await response.json();
        res.json(data);
      });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'test-array-1')
        .send({ scenario: 'array-append' });

      await request(app)
        .post('/cart/add')
        .set(SCENARIST_TEST_ID_HEADER, 'test-array-1')
        .send({ item: 'Apple' });

      await request(app)
        .post('/cart/add')
        .set(SCENARIST_TEST_ID_HEADER, 'test-array-1')
        .send({ item: 'Banana' });

      await request(app)
        .post('/cart/add')
        .set(SCENARIST_TEST_ID_HEADER, 'test-array-1')
        .send({ item: 'Cherry' });

      const response = await request(app)
        .get('/cart')
        .set(SCENARIST_TEST_ID_HEADER, 'test-array-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('should support array length templates', async () => {
      const scenarist = await createTestScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      scenarist.start();

      const app = express();
      app.use(express.json());
      app.use(scenarist.middleware);

      app.post('/items/add', async (req, res) => {
        const response = await fetch('https://api.example.com/items/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
      });

      app.get('/items/count', async (_req, res) => {
        const response = await fetch('https://api.example.com/items/count');
        const data = await response.json();
        res.json(data);
      });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'test-length-1')
        .send({ scenario: 'array-length' });

      await request(app)
        .post('/items/add')
        .set(SCENARIST_TEST_ID_HEADER, 'test-length-1')
        .send({ item: 'Item1' });

      await request(app)
        .post('/items/add')
        .set(SCENARIST_TEST_ID_HEADER, 'test-length-1')
        .send({ item: 'Item2' });

      await request(app)
        .post('/items/add')
        .set(SCENARIST_TEST_ID_HEADER, 'test-length-1')
        .send({ item: 'Item3' });

      const response = await request(app)
        .get('/items/count')
        .set(SCENARIST_TEST_ID_HEADER, 'test-length-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
      expect(response.body.items).toEqual(['Item1', 'Item2', 'Item3']);
    });

    it('should support nested path templates', async () => {
      const scenarist = await createTestScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      scenarist.start();

      const app = express();
      app.use(express.json());
      app.use(scenarist.middleware);

      app.post('/form/step1', async (req, res) => {
        const response = await fetch('https://api.example.com/form/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
      });

      app.post('/form/step2', async (req, res) => {
        const response = await fetch('https://api.example.com/form/step2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
      });

      app.get('/form/summary', async (_req, res) => {
        const response = await fetch('https://api.example.com/form/summary');
        const data = await response.json();
        res.json(data);
      });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'test-nested-1')
        .send({ scenario: 'nested-paths' });

      await request(app)
        .post('/form/step1')
        .set(SCENARIST_TEST_ID_HEADER, 'test-nested-1')
        .send({ name: 'Charlie', email: 'charlie@example.com' });

      await request(app)
        .post('/form/step2')
        .set(SCENARIST_TEST_ID_HEADER, 'test-nested-1')
        .send({ street: '123 Main St', city: 'Springfield' });

      const response = await request(app)
        .get('/form/summary')
        .set(SCENARIST_TEST_ID_HEADER, 'test-nested-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.userName).toBe('Charlie');
      expect(response.body.userEmail).toBe('charlie@example.com');
      expect(response.body.userStreet).toBe('123 Main St');
      expect(response.body.userCity).toBe('Springfield');
    });

    it('should handle missing state keys gracefully (templates remain as-is)', async () => {
      const scenarist = await createTestScenarist({
        enabled: true,
        scenarios: testScenarios,
      });

      scenarist.start();

      const app = express();
      app.use(express.json());
      app.use(scenarist.middleware);

      app.get('/profile', async (_req, res) => {
        const response = await fetch('https://api.example.com/profile');
        const data = await response.json();
        res.json(data);
      });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'test-missing-1')
        .send({ scenario: 'missing-keys' });

      const response = await request(app)
        .get('/profile')
        .set(SCENARIST_TEST_ID_HEADER, 'test-missing-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      // Pure templates with missing state keys return null (JSON-safe, not the template string)
      expect(response.body.name).toBeNull();
      expect(response.body.email).toBeNull();
      expect(response.body.address).toBeNull();
    });
  });
});
