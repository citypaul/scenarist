import { Router } from 'express';
import { z } from 'zod';
import type { ScenarioManager, ScenaristConfig } from '@scenarist/core';
import { ExpressRequestContext } from '../context/express-request-context.js';

const scenarioRequestSchema = z.object({
  scenario: z.string().min(1),
  variant: z.string().optional(),
});

export const createScenarioEndpoints = (
  manager: ScenarioManager,
  config: ScenaristConfig
): Router => {
  const router = Router();

  // POST /__scenario__ - Set scenario
  router.post(config.endpoints.setScenario, (req, res) => {
    try {
      const { scenario, variant } = scenarioRequestSchema.parse(req.body);
      const context = new ExpressRequestContext(req, config);
      const testId = context.getTestId();

      const result = manager.switchScenario(testId, scenario, variant);

      if (!result.success) {
        return res.status(400).json({
          error: result.error.message,
        });
      }

      return res.status(200).json({
        success: true,
        testId,
        scenario,
        ...(variant && { variant }),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request body',
          details: error.errors,
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  // GET /__scenario__ - Get active scenario
  router.get(config.endpoints.getScenario, (req, res) => {
    const context = new ExpressRequestContext(req, config);
    const testId = context.getTestId();

    const activeScenario = manager.getActiveScenario(testId);

    if (!activeScenario) {
      return res.status(404).json({
        error: 'No active scenario for this test ID',
        testId,
      });
    }

    const scenarioDefinition = manager.getScenarioById(activeScenario.scenarioId);

    return res.status(200).json({
      testId,
      scenarioId: activeScenario.scenarioId,
      ...(scenarioDefinition && { scenarioName: scenarioDefinition.name }),
      ...(activeScenario.variantName && { variantName: activeScenario.variantName }),
    });
  });

  return router;
};
