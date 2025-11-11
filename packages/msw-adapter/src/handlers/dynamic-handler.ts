import { http, passthrough } from 'msw';
import type { HttpHandler } from 'msw';
import type {
  ActiveScenario,
  ScenaristScenario,
  HttpRequestContext,
  HttpMethod,
  ResponseSelector,
} from '@scenarist/core';
import { buildResponse } from '../conversion/response-builder.js';
import { matchesUrl } from '../matching/url-matcher.js';

export type DynamicHandlerOptions = {
  readonly getTestId: (request: Request) => string;
  readonly getActiveScenario: (testId: string) => ActiveScenario | undefined;
  readonly getScenarioDefinition: (
    scenarioId: string
  ) => ScenaristScenario | undefined;
  readonly strictMode: boolean;
  readonly responseSelector: ResponseSelector;
};

/**
 * Extract HttpRequestContext from MSW Request object.
 * Converts MSW request to the format expected by ResponseSelector.
 */
const extractHttpRequestContext = async (
  request: Request
): Promise<HttpRequestContext> => {
  // Parse request body if present
  let body: unknown = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const clonedRequest = request.clone();
      body = await clonedRequest.json();
    } catch {
      // Body is not JSON or doesn't exist
      body = undefined;
    }
  }

  // Extract headers as Record<string, string>
  // Normalize header keys to lowercase (HTTP headers are case-insensitive)
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // Extract query parameters from URL
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    method: request.method as HttpMethod,
    url: request.url,
    body,
    headers,
    query,
  };
};

/**
 * Get mocks from active scenario, with default scenario mocks as fallback.
 * Returns URL-matching mocks for ResponseSelector to evaluate.
 *
 * Default mocks are ALWAYS included (if they match URL+method).
 * Active scenario mocks are added after defaults, allowing them to override
 * based on specificity (mocks with match criteria have higher specificity).
 */
const getMocksFromScenarios = (
  activeScenario: ActiveScenario | undefined,
  getScenarioDefinition: (scenarioId: string) => ScenaristScenario | undefined,
  method: string,
  url: string
): ReadonlyArray<import('@scenarist/core').ScenaristMock> => {
  const mocks: Array<import('@scenarist/core').ScenaristMock> = [];

  // Step 1: ALWAYS include default scenario mocks first
  // These act as fallback when active scenario mocks don't match
  const defaultScenario = getScenarioDefinition('default');
  if (defaultScenario) {
    let defaultAdded = 0;
    defaultScenario.mocks.forEach((mock) => {
      const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
      const urlMatch = matchesUrl(mock.url, url);
      if (methodMatches && urlMatch.matches) {
        mocks.push(mock);
        defaultAdded++;
      }
    });
    console.log(`[MSW] Default scenario: added ${defaultAdded}/${defaultScenario.mocks.length} mocks for ${method} ${url}`);
  } else {
    console.log(`[MSW] WARNING: Default scenario not found!`);
  }

  // Step 2: Add active scenario mocks (if any)
  // These override defaults based on specificity (via ResponseSelector)
  if (activeScenario) {
    const scenarioDefinition = getScenarioDefinition(activeScenario.scenarioId);
    if (scenarioDefinition) {
      let activeAdded = 0;
      scenarioDefinition.mocks.forEach((mock) => {
        const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
        const urlMatch = matchesUrl(mock.url, url);
        if (methodMatches && urlMatch.matches) {
          mocks.push(mock);
          activeAdded++;
        }
      });
      console.log(`[MSW] Active scenario (${activeScenario.scenarioId}): added ${activeAdded}/${scenarioDefinition.mocks.length} mocks`);
    }
  }

  console.log(`[MSW] Total mocks collected: ${mocks.length}`);
  return mocks;
};

export const createDynamicHandler = (
  options: DynamicHandlerOptions
): HttpHandler => {
  return http.all('*', async ({ request }) => {
    const testId = options.getTestId(request);
    const activeScenario = options.getActiveScenario(testId);
    const scenarioId = activeScenario?.scenarioId ?? 'default';

    // Extract request context for matching
    const context = await extractHttpRequestContext(request);

    // Get candidate mocks from active or default scenario
    const mocks = getMocksFromScenarios(
      activeScenario,
      options.getScenarioDefinition,
      request.method,
      request.url
    );

    // Use injected ResponseSelector to find matching mock
    const result = options.responseSelector.selectResponse(testId, scenarioId, context, mocks);

    if (result.success) {
      console.log(`[MSW] ✅ Mock matched for ${request.method} ${request.url}`);
      return buildResponse(result.data);
    }

    console.log(`[MSW] ❌ No mock matched for ${request.method} ${request.url}`);
    console.log(`[MSW] Error: ${result.error.message}`);

    if (options.strictMode) {
      console.log(`[MSW] Returning 501 (strict mode)`);
      return new Response(null, { status: 501 });
    }

    console.log(`[MSW] Passing through to real server`);
    return passthrough();
  });
};
