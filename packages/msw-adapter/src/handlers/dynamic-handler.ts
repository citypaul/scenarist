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
};

export const createDynamicHandler = (
  options: DynamicHandlerOptions
): HttpHandler => {
  return http.all('*', async ({ request }) => {
    const testId = options.getTestId();
    const activeScenario = options.getActiveScenario(testId);

    let mock;

    if (activeScenario) {
      const scenarioDefinition = options.getScenarioDefinition(
        activeScenario.scenarioId
      );
      if (scenarioDefinition) {
        mock = findMatchingMock(
          scenarioDefinition.mocks,
          request.method,
          request.url
        );
      }
    }

    if (!mock) {
      const defaultScenario = options.getScenarioDefinition('default');
      if (defaultScenario) {
        mock = findMatchingMock(
          defaultScenario.mocks,
          request.method,
          request.url
        );
      }
    }

    if (mock) {
      return buildResponse(mock);
    }

    if (options.strictMode) {
      return new Response(null, { status: 501 });
    }

    return passthrough();
  });
};
