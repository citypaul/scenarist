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

  // HTTP methods from Request.method are uppercase strings matching HttpMethod type
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Request.method is a string, HttpMethod is a string literal union; values align at runtime
  const method = request.method as HttpMethod;

  return {
    method,
    url: request.url,
    body,
    headers,
    query,
  };
};

type UrlParams = Readonly<Record<string, string | ReadonlyArray<string>>>;

/**
 * Check if a mock matches the request's method and URL.
 * Returns match result with extracted URL params if matching.
 */
const mockMatchesRequest = (
  mock: { readonly method: string; readonly url: string | RegExp },
  method: string,
  url: string,
): { readonly matches: boolean; readonly params: UrlParams } => {
  const methodMatches = mock.method.toUpperCase() === method.toUpperCase();
  if (!methodMatches) {
    return { matches: false, params: {} };
  }
  const urlMatch = matchesUrl(mock.url, url);
  return { matches: urlMatch.matches, params: urlMatch.params ?? {} };
};

/**
 * Get mocks from active scenario, with default scenario mocks as fallback.
 * Returns URL-matching mocks with their extracted params for ResponseSelector to evaluate.
 *
 * Mock selection priority (Issue #335):
 * 1. If no active scenario → use default scenario mocks
 * 2. If active scenario has a fallback mock (no match criteria) → use ONLY active mocks
 * 3. If active scenario has only conditional mocks → include default as backup
 *
 * A "fallback mock" is one without match criteria - it always matches if URL+method match.
 * When active scenario explicitly covers an endpoint with a fallback mock, we don't
 * include default's mock for that endpoint, preventing specificity-based conflicts.
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

  // Step 1: Check active scenario first
  // Track if active has a fallback mock (no match criteria) for this URL+method
  let activeHasFallbackMock = false;

  if (activeScenario) {
    const scenarioDefinition = getScenarioDefinition(activeScenario.scenarioId);
    if (scenarioDefinition) {
      scenarioDefinition.mocks.forEach((mock) => {
        const match = mockMatchesRequest(mock, method, url);
        if (match.matches) {
          mocksWithParams.push({ mock, params: match.params });
          // A mock without match criteria is a "fallback" - it always matches
          if (!mock.match) {
            activeHasFallbackMock = true;
          }
        }
      });
    }
  }

  // Step 2: Include default scenario mocks only if:
  // - No active scenario is set, OR
  // - Active scenario doesn't have a fallback mock for this URL+method
  //   (i.e., active only has conditional mocks, so default is needed as backup)
  if (!activeScenario || !activeHasFallbackMock) {
    const defaultScenario = getScenarioDefinition("default");
    if (defaultScenario) {
      defaultScenario.mocks.forEach((mock) => {
        const match = mockMatchesRequest(mock, method, url);
        if (match.matches) {
          mocksWithParams.push({ mock, params: match.params });
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

      // Determine which error behavior to use based on error code
      const errorCode = result.error.code;
      const errorBehavior =
        errorCode === ErrorCodes.SEQUENCE_EXHAUSTED
          ? options.errorBehaviors?.onSequenceExhausted
          : options.errorBehaviors?.onNoMockFound;

      // Handle error based on configured behavior
      if (errorBehavior === "throw") {
        throw result.error;
      }

      if (errorBehavior === "warn" && options.logger) {
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
        // Security: Only include stack traces in non-production environments
        // to prevent information exposure through log aggregation systems.
        // Stack traces can reveal internal file paths, dependency versions,
        // and implementation details that could aid attackers.
        const includeStack = process.env.NODE_ENV !== "production";
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
            stack:
              includeStack && error instanceof Error ? error.stack : undefined,
          },
        );
      }

      // Use specific error code from ScenaristError, or fallback to HANDLER_ERROR
      const errorCode =
        error instanceof ScenaristError ? error.code : "HANDLER_ERROR";

      // Return a 500 error response
      // Security: Only include message for ScenaristErrors (intentional, safe messages)
      // For unexpected errors (HANDLER_ERROR), do not expose internal error messages
      // which may contain sensitive information like file paths, credentials, etc.
      const responseBody =
        error instanceof ScenaristError
          ? {
              error: "Internal mock server error",
              message: error.message,
              code: errorCode,
            }
          : {
              error: "Internal mock server error",
              code: errorCode,
            };

      return new Response(JSON.stringify(responseBody), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  });
};
