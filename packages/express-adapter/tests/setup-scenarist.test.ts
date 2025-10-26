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

  it('should switch scenario programmatically', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
    });

    const testScenario: ScenarioDefinition = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'Test scenario',
      mocks: [],
    };

    scenarist.registerScenario(testScenario);

    const result = scenarist.switchScenario('test-123', 'test-scenario');

    expect(result.success).toBe(true);

    const activeScenario = scenarist.getActiveScenario('test-123');
    expect(activeScenario).toEqual({ scenarioId: 'test-scenario' });
  });

  it('should retrieve scenario by ID', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
    });

    const testScenario: ScenarioDefinition = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'Test scenario',
      mocks: [],
    };

    scenarist.registerScenario(testScenario);

    const scenario = scenarist.getScenarioById('test-scenario');

    expect(scenario).toEqual(testScenario);
  });

  it('should clear active scenario for a test ID', () => {
    const scenarist = createScenarist({
      enabled: true,
      defaultScenario: mockDefaultScenario,
    });

    const testScenario: ScenarioDefinition = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'Test scenario',
      mocks: [],
    };

    scenarist.registerScenario(testScenario);
    scenarist.switchScenario('test-123', 'test-scenario');

    const beforeClear = scenarist.getActiveScenario('test-123');
    expect(beforeClear).toEqual({ scenarioId: 'test-scenario' });

    scenarist.clearScenario('test-123');

    const afterClear = scenarist.getActiveScenario('test-123');
    expect(afterClear).toBeUndefined();
  });

  describe('Phase 3: Stateful Mocks', () => {
    it('should capture state from request and inject into response template', async () => {
      const scenarist = createScenarist({
        enabled: true,
        defaultScenario: mockDefaultScenario,
      });

      scenarist.registerScenario({
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
        .set(scenarist.config.headers.testId, 'test-state-1')
        .send({ scenario: 'stateful' });

      await request(app)
        .post('/capture')
        .set(scenarist.config.headers.testId, 'test-state-1')
        .send({ name: 'Alice', email: 'alice@example.com' });

      const response = await request(app)
        .get('/inject')
        .set(scenarist.config.headers.testId, 'test-state-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Alice');
      expect(response.body.email).toBe('alice@example.com');
    });

    it('should reset state when switching scenarios', async () => {
      const scenarist = createScenarist({
        enabled: true,
        defaultScenario: mockDefaultScenario,
      });

      scenarist.registerScenario({
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
      });

      scenarist.registerScenario({
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
        .set(scenarist.config.headers.testId, 'test-reset-1')
        .send({ scenario: 'scenario-with-capture' });

      await request(app)
        .post('/data')
        .set(scenarist.config.headers.testId, 'test-reset-1')
        .send({ value: 'captured-data' });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, 'test-reset-1')
        .send({ scenario: 'scenario-with-injection' });

      const response = await request(app)
        .get('/data')
        .set(scenarist.config.headers.testId, 'test-reset-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.value).toBe('{{state.capturedValue}}');
    });

    it('should isolate state per test ID', async () => {
      const scenarist = createScenarist({
        enabled: true,
        defaultScenario: mockDefaultScenario,
      });

      scenarist.registerScenario({
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
        .set(scenarist.config.headers.testId, 'test-isolation-1')
        .send({ scenario: 'isolated-state' });

      await request(app)
        .post(scenarist.config.endpoints.setScenario)
        .set(scenarist.config.headers.testId, 'test-isolation-2')
        .send({ scenario: 'isolated-state' });

      await request(app)
        .post('/user')
        .set(scenarist.config.headers.testId, 'test-isolation-1')
        .send({ name: 'Alice' });

      await request(app)
        .post('/user')
        .set(scenarist.config.headers.testId, 'test-isolation-2')
        .send({ name: 'Bob' });

      const response1 = await request(app)
        .get('/user')
        .set(scenarist.config.headers.testId, 'test-isolation-1');

      const response2 = await request(app)
        .get('/user')
        .set(scenarist.config.headers.testId, 'test-isolation-2');

      await scenarist.stop();

      expect(response1.status).toBe(200);
      expect(response1.body.name).toBe('Alice');

      expect(response2.status).toBe(200);
      expect(response2.body.name).toBe('Bob');
    });

    it('should support array append syntax for state capture', async () => {
      const scenarist = createScenarist({
        enabled: true,
        defaultScenario: mockDefaultScenario,
      });

      scenarist.registerScenario({
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
        .set(scenarist.config.headers.testId, 'test-array-1')
        .send({ scenario: 'array-append' });

      await request(app)
        .post('/cart/add')
        .set(scenarist.config.headers.testId, 'test-array-1')
        .send({ item: 'Apple' });

      await request(app)
        .post('/cart/add')
        .set(scenarist.config.headers.testId, 'test-array-1')
        .send({ item: 'Banana' });

      await request(app)
        .post('/cart/add')
        .set(scenarist.config.headers.testId, 'test-array-1')
        .send({ item: 'Cherry' });

      const response = await request(app)
        .get('/cart')
        .set(scenarist.config.headers.testId, 'test-array-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('should support array length templates', async () => {
      const scenarist = createScenarist({
        enabled: true,
        defaultScenario: mockDefaultScenario,
      });

      scenarist.registerScenario({
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
        .set(scenarist.config.headers.testId, 'test-length-1')
        .send({ scenario: 'array-length' });

      await request(app)
        .post('/items/add')
        .set(scenarist.config.headers.testId, 'test-length-1')
        .send({ item: 'Item1' });

      await request(app)
        .post('/items/add')
        .set(scenarist.config.headers.testId, 'test-length-1')
        .send({ item: 'Item2' });

      await request(app)
        .post('/items/add')
        .set(scenarist.config.headers.testId, 'test-length-1')
        .send({ item: 'Item3' });

      const response = await request(app)
        .get('/items/count')
        .set(scenarist.config.headers.testId, 'test-length-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
      expect(response.body.items).toEqual(['Item1', 'Item2', 'Item3']);
    });

    it('should support nested path templates', async () => {
      const scenarist = createScenarist({
        enabled: true,
        defaultScenario: mockDefaultScenario,
      });

      scenarist.registerScenario({
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
        .set(scenarist.config.headers.testId, 'test-nested-1')
        .send({ scenario: 'nested-paths' });

      await request(app)
        .post('/form/step1')
        .set(scenarist.config.headers.testId, 'test-nested-1')
        .send({ name: 'Charlie', email: 'charlie@example.com' });

      await request(app)
        .post('/form/step2')
        .set(scenarist.config.headers.testId, 'test-nested-1')
        .send({ street: '123 Main St', city: 'Springfield' });

      const response = await request(app)
        .get('/form/summary')
        .set(scenarist.config.headers.testId, 'test-nested-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.userName).toBe('Charlie');
      expect(response.body.userEmail).toBe('charlie@example.com');
      expect(response.body.userStreet).toBe('123 Main St');
      expect(response.body.userCity).toBe('Springfield');
    });

    it('should handle missing state keys gracefully (templates remain as-is)', async () => {
      const scenarist = createScenarist({
        enabled: true,
        defaultScenario: mockDefaultScenario,
      });

      scenarist.registerScenario({
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
        .set(scenarist.config.headers.testId, 'test-missing-1')
        .send({ scenario: 'missing-keys' });

      const response = await request(app)
        .get('/profile')
        .set(scenarist.config.headers.testId, 'test-missing-1');

      await scenarist.stop();

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('{{state.userName}}');
      expect(response.body.email).toBe('{{state.userEmail}}');
      expect(response.body.address).toBe('{{state.userAddress}}');
    });
  });
});
