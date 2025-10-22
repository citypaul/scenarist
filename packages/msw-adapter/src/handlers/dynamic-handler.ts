import { http, passthrough } from 'msw';
import type { HttpHandler } from 'msw';
import type { ActiveScenario, ScenarioDefinition } from '@scenarist/core';
import { findMatchingMock } from '../matching/mock-matcher.js';
import { buildResponse } from '../conversion/response-builder.js';

export type DynamicHandlerOptions = {
  readonly getTestId: () => string;
  readonly getActiveScenario: (testId: string) => ActiveScenario | undefined;
  readonly getScenarioDefinition: (
    scenarioId: string
  ) => ScenarioDefinition | undefined;
  readonly strictMode: boolean;
  readonly defaultScenarioId: string;
};

const findMockInScenarios = (
  activeScenario: ActiveScenario | undefined,
  getScenarioDefinition: (scenarioId: string) => ScenarioDefinition | undefined,
  defaultScenarioId: string,
  method: string,
  url: string
) => {
  if (activeScenario) {
    const scenarioDefinition = getScenarioDefinition(activeScenario.scenarioId);
    if (scenarioDefinition) {
      const mock = findMatchingMock(scenarioDefinition.mocks, method, url);
      if (mock) {
        return mock;
      }
    }
  }

  const defaultScenario = getScenarioDefinition(defaultScenarioId);
  if (defaultScenario) {
    return findMatchingMock(defaultScenario.mocks, method, url);
  }

  return undefined;
};

export const createDynamicHandler = (
  options: DynamicHandlerOptions
): HttpHandler => {
  return http.all('*', async ({ request }) => {
    const testId = options.getTestId();
    const activeScenario = options.getActiveScenario(testId);

    const mock = findMockInScenarios(
      activeScenario,
      options.getScenarioDefinition,
      options.defaultScenarioId,
      request.method,
      request.url
    );

    if (mock) {
      return buildResponse(mock);
    }

    if (options.strictMode) {
      return new Response(null, { status: 501 });
    }

    return passthrough();
  });
};
