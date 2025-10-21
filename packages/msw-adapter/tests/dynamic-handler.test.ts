import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { createDynamicHandler } from '../src/handlers/dynamic-handler.js';
import type { ActiveScenario, ScenarioDefinition } from '@scenarist/core';

describe('Dynamic Handler', () => {
  describe('Basic handler setup', () => {
    it('should return mocked response when mock matches request', async () => {
      const getTestId = vi.fn(() => 'test-123');
      const getActiveScenario = vi.fn((): ActiveScenario => ({
        scenarioId: 'happy-path',
      }));
      const getScenarioDefinition = vi.fn(
        (scenarioId: string): ScenarioDefinition | undefined => {
          if (scenarioId === 'happy-path') {
            return {
              id: 'happy-path',
              name: 'Happy Path',
              description: 'All requests succeed',
              devToolEnabled: false,
              mocks: [
                {
                  method: 'GET',
                  url: 'https://api.example.com/users',
                  response: {
                    status: 200,
                    body: { users: [] },
                  },
                },
              ],
            };
          }
          return undefined;
        }
      );

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
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
      const getTestId = vi.fn(() => 'test-123');
      const getActiveScenario = vi.fn((): ActiveScenario => ({
        scenarioId: 'empty-scenario',
      }));
      const getScenarioDefinition = vi.fn(
        (scenarioId: string): ScenarioDefinition | undefined => {
          if (scenarioId === 'empty-scenario') {
            return {
              id: 'empty-scenario',
              name: 'Empty Scenario',
              description: 'No mocks',
              devToolEnabled: false,
              mocks: [],
            };
          }
          if (scenarioId === 'default') {
            return {
              id: 'default',
              name: 'Default',
              description: 'Default mocks',
              devToolEnabled: false,
              mocks: [
                {
                  method: 'GET',
                  url: 'https://api.example.com/users',
                  response: {
                    status: 200,
                    body: { source: 'default' },
                  },
                },
              ],
            };
          }
          return undefined;
        }
      );

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
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
});
