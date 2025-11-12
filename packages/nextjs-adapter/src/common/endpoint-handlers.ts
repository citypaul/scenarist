import { z } from 'zod';
import {
  ScenarioRequestSchema,
  type ScenarioManager,
  type RequestContext,
} from '@scenarist/core';

/**
 * Result type for POST endpoint business logic.
 *
 * Represents the outcome of attempting to switch scenarios,
 * with appropriate status codes for different failure modes.
 */
export type PostResult =
  | {
      readonly success: true;
      readonly testId: string;
      readonly scenarioId: string;
      readonly variant?: string;
    }
  | {
      readonly success: false;
      readonly status: 400 | 500;
      readonly error: string;
      readonly details?: unknown;
    };

/**
 * Business logic for POST scenario endpoint.
 *
 * Handles scenario switching with complete validation and error handling.
 * Framework-agnostic - can be used by any adapter (Pages, App, Express, etc.).
 *
 * Steps:
 * 1. Validate request body against schema
 * 2. Extract test ID from request context
 * 3. Attempt scenario switch via manager
 * 4. Return appropriate success/error result
 *
 * Error Handling:
 * - Zod validation error → 400 with validation details
 * - Scenario not found → 400 with error message
 * - Unexpected error → 500 with generic message
 *
 * @param body - Raw request body (to be validated)
 * @param context - Request context for test ID extraction
 * @param manager - Scenario manager for switching scenarios
 * @returns Result with success/failure status and appropriate data
 *
 * @example
 * ```typescript
 * // In framework-specific endpoint
 * const result = await handlePostLogic(req.body, context, manager);
 *
 * if (!result.success) {
 *   return res.status(result.status).json({ error: result.error });
 * }
 *
 * return res.status(200).json({ success: true, ...result });
 * ```
 */
export const handlePostLogic = async (
  body: unknown,
  context: RequestContext,
  manager: ScenarioManager
): Promise<PostResult> => {
  try {
    // Validate request body
    const { scenario, variant } = ScenarioRequestSchema.parse(body);

    // Extract test ID from context
    const testId = context.getTestId();

    // DEBUG: Log scenario switch attempt
    console.log('[Scenario Endpoint POST] Switching scenario');
    console.log('[Scenario Endpoint POST] testId:', testId);
    console.log('[Scenario Endpoint POST] scenarioId:', scenario);
    console.log('[Scenario Endpoint POST] variant:', variant);

    // Attempt scenario switch
    const result = manager.switchScenario(testId, scenario, variant);

    // DEBUG: Log result
    console.log('[Scenario Endpoint POST] Result:', result.success ? 'SUCCESS' : 'FAILED');
    if (result.success) {
      console.log('[Scenario Endpoint POST] Scenario is now active for test ID:', testId);
    } else {
      console.log('[Scenario Endpoint POST] Error:', result.error);
    }

    if (!result.success) {
      return {
        success: false,
        status: 400,
        error: result.error.message,
      };
    }

    return {
      success: true,
      testId,
      scenarioId: scenario,
      ...(variant && { variant }),
    };
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return {
        success: false,
        status: 400,
        error: 'Invalid request body',
        details: error.errors,
      };
    }

    // Unexpected error
    return {
      success: false,
      status: 500,
      error: 'Internal server error',
    };
  }
};

/**
 * Result type for GET endpoint business logic.
 *
 * Represents the outcome of attempting to retrieve active scenario,
 * with appropriate status code for not found case.
 */
export type GetResult =
  | {
      readonly success: true;
      readonly testId: string;
      readonly scenarioId: string;
      readonly scenarioName?: string;
      readonly variantName?: string;
    }
  | {
      readonly success: false;
      readonly status: 404;
      readonly error: string;
      readonly testId: string;
    };

/**
 * Business logic for GET scenario endpoint.
 *
 * Retrieves the active scenario for the current test ID.
 * Framework-agnostic - can be used by any adapter.
 *
 * Steps:
 * 1. Extract test ID from request context
 * 2. Get active scenario from manager
 * 3. If found, enrich with scenario name
 * 4. Return appropriate success/error result
 *
 * @param context - Request context for test ID extraction
 * @param manager - Scenario manager for retrieving active scenario
 * @returns Result with success/failure status and appropriate data
 *
 * @example
 * ```typescript
 * // In framework-specific endpoint
 * const result = handleGetLogic(context, manager);
 *
 * if (!result.success) {
 *   return res.status(result.status).json({ error: result.error });
 * }
 *
 * return res.status(200).json(result);
 * ```
 */
export const handleGetLogic = (
  context: RequestContext,
  manager: ScenarioManager
): GetResult => {
  const testId = context.getTestId();
  const activeScenario = manager.getActiveScenario(testId);

  if (!activeScenario) {
    return {
      success: false,
      status: 404,
      error: 'No active scenario for this test ID',
      testId,
    };
  }

  const scenarioDefinition = manager.getScenarioById(activeScenario.scenarioId);

  return {
    success: true,
    testId,
    scenarioId: activeScenario.scenarioId,
    ...(scenarioDefinition && { scenarioName: scenarioDefinition.name }),
    ...(activeScenario.variantName && { variantName: activeScenario.variantName }),
  };
};
