import {
  ScenarioRequestSchema,
  type ScenarioManager,
  type ScenaristConfig,
} from "@scenarist/core";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { ExpressRequestContext } from "../context/express-request-context.js";

const handleSetScenario = (
  manager: ScenarioManager,
  config: ScenaristConfig,
) => {
  return (req: Request, res: Response): void => {
    try {
      const { scenario } = ScenarioRequestSchema.parse(req.body);
      const context = new ExpressRequestContext(req, config);
      const testId = context.getTestId();

      const result = manager.switchScenario(testId, scenario);

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
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Invalid request body",
          details: error.issues,
        });
        return;
      }

      res.status(500).json({
        error: "Internal server error",
      });
    }
  };
};

const handleGetScenario = (
  manager: ScenarioManager,
  config: ScenaristConfig,
) => {
  return (req: Request, res: Response): void => {
    const context = new ExpressRequestContext(req, config);
    const testId = context.getTestId();

    const activeScenario = manager.getActiveScenario(testId);

    if (!activeScenario) {
      res.status(404).json({
        error: "No active scenario for this test ID",
        testId,
      });
      return;
    }

    const scenarioDefinition = manager.getScenarioById(
      activeScenario.scenarioId,
    );

    res.status(200).json({
      testId,
      scenarioId: activeScenario.scenarioId,
      ...(scenarioDefinition && { scenarioName: scenarioDefinition.name }),
    });
  };
};

const handleGetState = (manager: ScenarioManager, config: ScenaristConfig) => {
  return (req: Request, res: Response): void => {
    const context = new ExpressRequestContext(req, config);
    const testId = context.getTestId();
    const state = manager.getState(testId);

    res.status(200).json({
      testId,
      state,
    });
  };
};

export const createScenarioEndpoints = (
  manager: ScenarioManager,
  config: ScenaristConfig,
): Router => {
  const router = Router();

  router.post(config.endpoints.setScenario, handleSetScenario(manager, config));
  router.get(config.endpoints.getScenario, handleGetScenario(manager, config));
  router.get(config.endpoints.getState, handleGetState(manager, config));

  return router;
};
