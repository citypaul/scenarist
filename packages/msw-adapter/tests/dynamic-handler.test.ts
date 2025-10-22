import { describe, it, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { createDynamicHandler } from '../src/handlers/dynamic-handler.js';
import type { ActiveScenario, ScenarioDefinition } from '@scenarist/core';
import { mockDefinition, mockScenario } from './factories.js';

describe('Dynamic Handler', () => {
  describe('Basic handler setup', () => {
    it('should return mocked response when mock matches request', async () => {
      const scenarios = new Map<string, ScenarioDefinition>([
        [
          'happy-path',
          mockScenario({
            id: 'happy-path',
            mocks: [
              mockDefinition({
                response: { status: 200, body: { users: [] } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => 'test-123';
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: 'happy-path',
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        defaultScenarioId: 'default',
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch('https://api.example.com/users');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ users: [] });

      server.close();
    });
  });

  describe('Default scenario fallback', () => {
    it('should fall back to default scenario when no mock in active scenario', async () => {
      const scenarios = new Map<string, ScenarioDefinition>([
        ['empty-scenario', mockScenario({ id: 'empty-scenario' })],
        [
          'default',
          mockScenario({
            id: 'default',
            mocks: [
              mockDefinition({
                response: { status: 200, body: { source: 'default' } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => 'test-123';
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: 'empty-scenario',
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        defaultScenarioId: 'default',
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch('https://api.example.com/users');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ source: 'default' });

      server.close();
    });

    it('should use default scenario when no active scenario is set', async () => {
      const scenarios = new Map<string, ScenarioDefinition>([
        [
          'default',
          mockScenario({
            id: 'default',
            mocks: [
              mockDefinition({
                response: { status: 200, body: { source: 'default' } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => 'test-123';
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        defaultScenarioId: 'default',
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch('https://api.example.com/users');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ source: 'default' });

      server.close();
    });
  });

  describe('Passthrough and strict mode', () => {
    it('should passthrough when no mock found and strictMode is false', async () => {
      const getTestId = () => 'test-123';
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        defaultScenarioId: 'default',
      });

      const server = setupServer(handler);
      server.listen();

      // Passthrough will attempt real network request which will fail for non-existent domain
      // This is expected behavior - passthrough means "let the real request happen"
      await expect(fetch('https://api.example.com/users')).rejects.toThrow();

      server.close();
    });

    it('should return error when no mock found and strictMode is true', async () => {
      const getTestId = () => 'test-123';
      const getActiveScenario = () => undefined;
      const getScenarioDefinition = () => undefined;

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: true,
        defaultScenarioId: 'default',
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch('https://api.example.com/users');

      expect(response.status).toBe(501);

      server.close();
    });
  });
});
