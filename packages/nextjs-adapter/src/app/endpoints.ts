import { z } from 'zod';
import type { ScenarioManager, ScenaristConfig } from '@scenarist/core';
import { AppRequestContext } from './context.js';

const scenarioRequestSchema = z.object({
  scenario: z.string().min(1),
  variant: z.string().optional(),
});

/**
 * Handle POST request to switch scenarios.
 */
const handlePost = (manager: ScenarioManager, config: ScenaristConfig) => {
  return async (req: Request): Promise<Response> => {
    try {
      const body = await req.json();
      const { scenario, variant } = scenarioRequestSchema.parse(body);
      const context = new AppRequestContext(req, config);
      const testId = context.getTestId();

      const result = manager.switchScenario(testId, scenario, variant);

      if (!result.success) {
        return Response.json(
          {
            error: result.error.message,
          },
          { status: 400 }
        );
      }

      return Response.json(
        {
          success: true,
          testId,
          scenarioId: scenario,
          ...(variant && { variant }),
        },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(
          {
            error: 'Invalid request body',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      return Response.json(
        {
          error: 'Internal server error',
        },
        { status: 500 }
      );
    }
  };
};

/**
 * Handle GET request to retrieve active scenario.
 */
const handleGet = (manager: ScenarioManager, config: ScenaristConfig) => {
  return async (req: Request): Promise<Response> => {
    const context = new AppRequestContext(req, config);
    const testId = context.getTestId();

    const activeScenario = manager.getActiveScenario(testId);

    if (!activeScenario) {
      return Response.json(
        {
          error: 'No active scenario for this test ID',
          testId,
        },
        { status: 404 }
      );
    }

    const scenarioDefinition = manager.getScenarioById(activeScenario.scenarioId);

    return Response.json(
      {
        testId,
        scenarioId: activeScenario.scenarioId,
        ...(scenarioDefinition && { scenarioName: scenarioDefinition.name }),
        ...(activeScenario.variantName && { variantName: activeScenario.variantName }),
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
 * // app/api/__scenario__/route.ts
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
