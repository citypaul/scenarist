import { http, passthrough } from "msw";
import type { HttpHandler } from "msw";
import type {
  ActiveScenario,
  ScenaristScenario,
  ScenaristMockWithParams,
  HttpRequestContext,
  HttpMethod,
  ResponseSelector,
  ErrorBehaviors,
  Logger,
} from "@scenarist/core";
import { ScenaristError, ErrorCodes, LogCategories } from "@scenarist/core";
import { buildResponse } from "../conversion/response-builder.js";
import { matchesUrl } from "../matching/url-matcher.js";

export type DynamicHandlerOptions = {
  readonly getTestId: (request: Request) => string;
  readonly getActiveScenario: (testId: string) => ActiveScenario | undefined;
  readonly getScenarioDefinition: (
    scenarioId: string,
  ) => ScenaristScenario | undefined;
  readonly strictMode: boolean;
  readonly responseSelector: ResponseSelector;
  readonly errorBehaviors?: ErrorBehaviors;
  readonly logger?: Logger;
};

/**
 * Extract HttpRequestContext from MSW Request object.
 * Converts MSW request to the format expected by ResponseSelector.
 */
const extractHttpRequestContext = async (
  request: Request,
): Promise<HttpRequestContext> => {
  // Parse request body if present
  let body: unknown = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const clonedRequest = request.clone();
      body = await clonedRequest.json();
    } catch {
      // Body is not JSON or doesn't exist
      body = undefined;
    }
  }

  // Extract headers as Record<string, string>
  // Headers are passed through as-is; normalization is core's responsibility.
  // The Fetch API Headers object already normalizes keys to lowercase,
  // but even if it didn't, core would handle normalization.
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
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
 * Returns URL-matching mocks with their extracted params for ResponseSelector to evaluate.
 *
 * Default mocks are ALWAYS included (if they match URL+method).
 * Active scenario mocks are added after defaults, allowing them to override
 * based on specificity (mocks with match criteria have higher specificity).
 *
 * Each mock is paired with params extracted from its URL pattern.
 * After ResponseSelector chooses a mock, we use THAT mock's params.
 */
const getMocksFromScenarios = (
  activeScenario: ActiveScenario | undefined,
  getScenarioDefinition: (scenarioId: string) => ScenaristScenario | undefined,
  method: string,
  url: string,
): ReadonlyArray<ScenaristMockWithParams> => {
  const mocksWithParams: Array<ScenaristMockWithParams> = [];

  // Step 1: ALWAYS include default scenario mocks first
  // These act as fallback when active scenario mocks don't match
  const defaultScenario = getScenarioDefinition("default");
  if (defaultScenario) {
    defaultScenario.mocks.forEach((mock) => {
      const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
      const urlMatch = matchesUrl(mock.url, url);
      if (methodMatches && urlMatch.matches) {
        mocksWithParams.push({ mock, params: urlMatch.params });
      }
    });
  }

  // Step 2: Add active scenario mocks (if any)
  // These override defaults based on specificity (via ResponseSelector)
  if (activeScenario) {
    const scenarioDefinition = getScenarioDefinition(activeScenario.scenarioId);
    if (scenarioDefinition) {
      scenarioDefinition.mocks.forEach((mock) => {
        const methodMatches =
          mock.method.toUpperCase() === method.toUpperCase();
        const urlMatch = matchesUrl(mock.url, url);
        if (methodMatches && urlMatch.matches) {
          mocksWithParams.push({ mock, params: urlMatch.params });
        }
      });
    }
  }

  return mocksWithParams;
};

export const createDynamicHandler = (
  options: DynamicHandlerOptions,
): HttpHandler => {
  return http.all("*", async ({ request }) => {
    const testId = options.getTestId(request);

    try {
      // Check for missing test ID
      if (!testId) {
        if (options.errorBehaviors?.onMissingTestId === "throw") {
          throw new ScenaristError(
            "Missing test ID header. Ensure your test setup sends the x-scenarist-test-id header with each request.",
            {
              code: ErrorCodes.MISSING_TEST_ID,
              context: {
                requestInfo: {
                  method: request.method,
                  url: request.url,
                },
                hint: "This typically means: 1) Test didn't call switchScenario() before making requests, 2) Request originated outside the test context, or 3) Header forwarding is misconfigured.",
              },
            },
          );
        }

        if (
          options.errorBehaviors?.onMissingTestId === "warn" &&
          options.logger
        ) {
          options.logger.warn(
            LogCategories.REQUEST,
            "Missing test ID header. Using default scenario.",
            {
              requestUrl: request.url,
              requestMethod: request.method,
            },
          );
        }
        // For 'ignore' or when no errorBehaviors set, silently continue with empty testId
      }

      const activeScenario = options.getActiveScenario(testId);
      const scenarioId = activeScenario?.scenarioId ?? "default";

      // Extract request context for matching
      const context = await extractHttpRequestContext(request);

      // Get candidate mocks from active or default scenario
      const mocks = getMocksFromScenarios(
        activeScenario,
        options.getScenarioDefinition,
        request.method,
        request.url,
      );

      // Use injected ResponseSelector to find matching mock
      const result = options.responseSelector.selectResponse(
        testId,
        scenarioId,
        context,
        mocks,
      );

      if (result.success) {
        return buildResponse(result.data);
      }

      // Handle error based on configured behavior
      if (options.errorBehaviors?.onNoMockFound === "throw") {
        throw result.error;
      }

      if (options.errorBehaviors?.onNoMockFound === "warn" && options.logger) {
        options.logger.warn("matching", result.error.message, {
          testId,
          scenarioId,
          requestUrl: context.url,
          requestMethod: context.method,
        });
      }

      if (options.strictMode) {
        return new Response(null, { status: 501 });
      }

      return passthrough();
    } catch (error) {
      // Log the error via Logger if available
      if (options.logger) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        options.logger.error(
          LogCategories.REQUEST,
          `Handler error: ${errorMessage}`,
          {
            testId,
            requestUrl: request.url,
            requestMethod: request.method,
          },
          {
            errorName: error instanceof Error ? error.name : "Unknown",
            stack: error instanceof Error ? error.stack : undefined,
          },
        );
      }

      // Use specific error code from ScenaristError, or fallback to HANDLER_ERROR
      const errorCode =
        error instanceof ScenaristError ? error.code : "HANDLER_ERROR";

      // Return a 500 error response with error details
      return new Response(
        JSON.stringify({
          error: "Internal mock server error",
          message: error instanceof Error ? error.message : String(error),
          code: errorCode,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  });
};
