import type { NextApiRequest, NextApiResponse } from 'next';
import type { ScenarioManager, ScenaristConfig } from '@scenarist/core';
import { PagesRequestContext } from './context.js';
import { handlePostLogic, handleGetLogic } from '../common/endpoint-handlers.js';

/**
 * Handle POST request to switch scenarios.
 *
 * Thin wrapper that adapts Next.js Pages Router Request/Response
 * to shared business logic.
 */
const handlePost = (manager: ScenarioManager, config: ScenaristConfig) => {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const context = new PagesRequestContext(req, config);
    const result = await handlePostLogic(req.body, context, manager);

    if (!result.success) {
      const response: { error: string; details?: unknown } = {
        error: result.error,
      };
      if (result.details) {
        response.details = result.details;
      }
      res.status(result.status).json(response);
      return;
    }

    res.status(200).json({
      success: true,
      testId: result.testId,
      scenarioId: result.scenarioId,
    });
  };
};

/**
 * Handle GET request to retrieve active scenario.
 *
 * Thin wrapper that adapts Next.js Pages Router Request/Response
 * to shared business logic.
 */
const handleGet = (manager: ScenarioManager, config: ScenaristConfig) => {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const context = new PagesRequestContext(req, config);
    const result = handleGetLogic(context, manager);

    if (!result.success) {
      res.status(result.status).json({
        error: result.error,
        testId: result.testId,
      });
      return;
    }

    res.status(200).json({
      testId: result.testId,
      scenarioId: result.scenarioId,
      ...(result.scenarioName && { scenarioName: result.scenarioName }),
    });
  };
};

/**
 * Create scenario endpoint handler for Next.js Pages Router.
 *
 * Returns a Next.js API route handler that supports:
 * - POST: Switch scenario
 * - GET: Retrieve active scenario
 *
 * @example
 * ```typescript
 * // pages/api/__scenario__.ts
 * import { createScenarioEndpoint } from '@scenarist/nextjs-adapter/pages';
 * import { scenarist } from '../../lib/scenarist';
 *
 * export default createScenarioEndpoint(scenarist.manager, scenarist.config);
 * ```
 */
export const createScenarioEndpoint = (
  manager: ScenarioManager,
  config: ScenaristConfig
) => {
  const postHandler = handlePost(manager, config);
  const getHandler = handleGet(manager, config);

  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    if (req.method === 'POST') {
      return postHandler(req, res);
    }

    if (req.method === 'GET') {
      return getHandler(req, res);
    }

    res.status(405).json({
      error: 'Method not allowed',
    });
  };
};
