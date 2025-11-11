import { describe, it, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { createDynamicHandler } from '../src/handlers/dynamic-handler.js';
import type { ActiveScenario, ScenarioDefinition } from '@scenarist/core';
import { createResponseSelector } from '@scenarist/core';
import { mockDefinition, mockScenario } from './factories.js';

describe('Dynamic Handler', () => {
  // Create ResponseSelector once for all tests
  const responseSelector = createResponseSelector();

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
        responseSelector,
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
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch('https://api.example.com/users');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ source: 'default' });

      server.close();
    });

    it('should fall back to default mock when active scenario mock match criteria fail', async () => {
      // This test reproduces the root cause:
      // - premiumUser scenario has mock with match: { headers: { 'x-user-tier': 'premium' } }
      // - Request comes with 'x-user-tier': 'standard' (doesn't match)
      // - Should fall back to default mock (not passthrough)
      const scenarios = new Map<string, ScenarioDefinition>([
        [
          'default',
          mockScenario({
            id: 'default',
            mocks: [
              mockDefinition({
                method: 'GET',
                url: 'https://api.example.com/users',
                response: { status: 200, body: { source: 'default', users: [] } },
              }),
            ],
          }),
        ],
        [
          'premiumUser',
          mockScenario({
            id: 'premiumUser',
            mocks: [
              mockDefinition({
                method: 'GET',
                url: 'https://api.example.com/users',
                match: { headers: { 'x-user-tier': 'premium' } },
                response: {
                  status: 200,
                  body: { source: 'premium', users: ['premium-user'] },
                },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => 'test-123';
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: 'premiumUser',
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      // Request with 'standard' tier (doesn't match premium criteria)
      const response = await fetch('https://api.example.com/users', {
        headers: { 'x-user-tier': 'standard' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ source: 'default', users: [] });

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
        responseSelector,
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
        responseSelector,
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
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch('https://api.example.com/users');

      expect(response.status).toBe(501);

      server.close();
    });
  });

  describe('Request context extraction (body, headers, query)', () => {
    it('should match mock based on request body content', async () => {
      const scenarios = new Map<string, ScenarioDefinition>([
        [
          'premium-user',
          mockScenario({
            id: 'premium-user',
            mocks: [
              mockDefinition({
                method: 'POST',
                url: 'https://api.example.com/items',
                match: { body: { tier: 'premium' } },
                response: { status: 200, body: { price: 100 } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => 'test-123';
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: 'premium-user',
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch('https://api.example.com/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'premium', quantity: 5 }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ price: 100 });

      server.close();
    });

    it('should match mock based on request headers', async () => {
      const scenarios = new Map<string, ScenarioDefinition>([
        [
          'auth-scenario',
          mockScenario({
            id: 'auth-scenario',
            mocks: [
              mockDefinition({
                method: 'GET',
                url: 'https://api.example.com/protected',
                match: { headers: { authorization: 'Bearer secret-token' } },
                response: { status: 200, body: { access: 'granted' } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => 'test-123';
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: 'auth-scenario',
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch('https://api.example.com/protected', {
        headers: { authorization: 'Bearer secret-token' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ access: 'granted' });

      server.close();
    });

    it('should extract and match query parameters from URL', async () => {
      const scenarios = new Map<string, ScenarioDefinition>([
        [
          'default',
          mockScenario({
            id: 'default',
            mocks: [
              mockDefinition({
                method: 'GET',
                url: 'https://api.example.com/items*',
                response: { status: 200, body: { items: ['item1', 'item2'] } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => 'test-123';
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: 'default',
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch(
        'https://api.example.com/items?filter=active&sort=asc'
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ items: ['item1', 'item2'] });

      server.close();
    });

    it('should handle requests with malformed JSON body gracefully', async () => {
      const scenarios = new Map<string, ScenarioDefinition>([
        [
          'default',
          mockScenario({
            id: 'default',
            mocks: [
              mockDefinition({
                method: 'POST',
                url: 'https://api.example.com/items',
                response: { status: 200, body: { received: 'ok' } },
              }),
            ],
          }),
        ],
      ]);

      const getTestId = () => 'test-123';
      const getActiveScenario = (): ActiveScenario => ({
        scenarioId: 'default',
      });
      const getScenarioDefinition = (scenarioId: string) =>
        scenarios.get(scenarioId);

      const handler = createDynamicHandler({
        getTestId,
        getActiveScenario,
        getScenarioDefinition,
        strictMode: false,
        responseSelector,
      });

      const server = setupServer(handler);
      server.listen();

      const response = await fetch('https://api.example.com/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ received: 'ok' });

      server.close();
    });
  });
});
