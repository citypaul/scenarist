import type { ScenarioManager, ScenaristConfig } from '@scenarist/core';
import { AppRequestContext } from './context.js';
import { handlePostLogic, handleGetLogic } from '../common/endpoint-handlers.js';

/**
 * Handle POST request to switch scenarios.
 *
 * Thin wrapper that adapts Next.js App Router Request/Response
 * to shared business logic.
 */
const handlePost = (manager: ScenarioManager, config: ScenaristConfig) => {
  return async (req: Request): Promise<Response> => {
    const body = await req.json();
    const context = new AppRequestContext(req, config);
    const result = await handlePostLogic(body, context, manager);

    if (!result.success) {
      const response: { error: string; details?: unknown } = {
        error: result.error,
      };
      if (result.details) {
        response.details = result.details;
      }
      return Response.json(response, { status: result.status });
    }

    return Response.json(
      {
        success: true,
        testId: result.testId,
        scenarioId: result.scenarioId,
        ...(result.variant && { variant: result.variant }),
      },
      { status: 200 }
    );
  };
};

/**
 * Handle GET request to retrieve active scenario.
 *
 * Thin wrapper that adapts Next.js App Router Request/Response
 * to shared business logic.
 */
const handleGet = (manager: ScenarioManager, config: ScenaristConfig) => {
  return async (req: Request): Promise<Response> => {
    const context = new AppRequestContext(req, config);
    const result = handleGetLogic(context, manager);

    if (!result.success) {
      return Response.json(
        {
          error: result.error,
          testId: result.testId,
        },
        { status: result.status }
      );
    }

    return Response.json(
      {
        testId: result.testId,
        scenarioId: result.scenarioId,
        ...(result.scenarioName && { scenarioName: result.scenarioName }),
        ...(result.variantName && { variantName: result.variantName }),
      },
      { status: 200 }
    );
  };
};

/**
 * Create scenario endpoint handler for Next.js App Router.
 *
 * Returns a Web standard Request/Response handler that supports:
 * - POST: Switch scenario
 * - GET: Retrieve active scenario
 *
 * @example
 * ```typescript
 * // app/api/%5F%5Fscenario%5F%5F/route.ts
 * import { createScenarioEndpoint } from '@scenarist/nextjs-adapter/app';
 * import { scenarist } from '@/lib/scenarist';
 *
 * export const POST = scenarist.createScenarioEndpoint();
 * export const GET = scenarist.createScenarioEndpoint();
 * ```
 */
export const createScenarioEndpoint = (
  manager: ScenarioManager,
  config: ScenaristConfig
) => {
  const postHandler = handlePost(manager, config);
  const getHandler = handleGet(manager, config);

  return async (req: Request): Promise<Response> => {
    if (req.method === 'POST') {
      return postHandler(req);
    }

    if (req.method === 'GET') {
      return getHandler(req);
    }

    return Response.json(
      {
        error: 'Method not allowed',
      },
      { status: 405 }
    );
  };
};
