import { http } from 'msw';
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

    if (activeScenario) {
      const scenarioDefinition = options.getScenarioDefinition(
        activeScenario.scenarioId
      );
      if (scenarioDefinition) {
        const mock = findMatchingMock(
          scenarioDefinition.mocks,
          request.method,
          request.url
        );
        if (mock) {
          return buildResponse(mock);
        }
      }
    }

    return new Response(null, { status: 501 });
  });
};
