import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import {
  ScenarioRequestSchema,
  type ScenarioManager,
  type ScenaristConfig,
} from '@scenarist/core';
import { PagesRequestContext } from './context.js';

/**
 * Handle POST request to switch scenarios.
 */
const handlePost = (manager: ScenarioManager, config: ScenaristConfig) => {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
      const { scenario, variant } = ScenarioRequestSchema.parse(req.body);
      const context = new PagesRequestContext(req, config);
      const testId = context.getTestId();

      const result = manager.switchScenario(testId, scenario, variant);

      if (!result.success) {
        res.status(400).json({
          error: result.error.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        testId,
        scenarioId: scenario,
        ...(variant && { variant }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request body',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
      });
    }
  };
};

/**
 * Handle GET request to retrieve active scenario.
 */
const handleGet = (manager: ScenarioManager, config: ScenaristConfig) => {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const context = new PagesRequestContext(req, config);
    const testId = context.getTestId();

    const activeScenario = manager.getActiveScenario(testId);

    if (!activeScenario) {
      res.status(404).json({
        error: 'No active scenario for this test ID',
        testId,
      });
      return;
    }

    const scenarioDefinition = manager.getScenarioById(activeScenario.scenarioId);

    res.status(200).json({
      testId,
      scenarioId: activeScenario.scenarioId,
      ...(scenarioDefinition && { scenarioName: scenarioDefinition.name }),
      ...(activeScenario.variantName && { variantName: activeScenario.variantName }),
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
