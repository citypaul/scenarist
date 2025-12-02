import type { Request, Response, Router } from "express";

/**
 * State-Aware Mocking Routes (ADR-0019)
 *
 * Demonstrates the three state-aware mocking capabilities:
 * 1. stateResponse - Conditional responses based on current state
 * 2. afterResponse.setState - Mutate state after returning a response
 * 3. match.state - Select mocks based on current state
 *
 * These routes call external APIs which MSW intercepts via Scenarist.
 */

const LOAN_API_URL = "https://api.loans.com";
const FEATURES_API_URL = "https://api.features.com";
const PRICING_API_URL = "https://api.pricing.com";

export const setupStateAwareRoutes = (router: Router): void => {
  /**
   * GET /api/loan/status
   *
   * Returns loan application status. Uses stateResponse to return
   * different responses based on workflow state.
   */
  router.get("/api/loan/status", async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${LOAN_API_URL}/loan/status`);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to get loan status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/loan/submit
   *
   * Submits a loan application. Uses afterResponse.setState to
   * advance the workflow state to "submitted".
   */
  router.post("/api/loan/submit", async (req: Request, res: Response) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Valid amount is required",
      });
    }

    try {
      const response = await fetch(`${LOAN_API_URL}/loan/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to submit loan application",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/loan/review
   *
   * Completes loan review. Uses afterResponse.setState to
   * advance the workflow state to "reviewed".
   */
  router.post("/api/loan/review", async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${LOAN_API_URL}/loan/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to complete loan review",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/features
   *
   * Sets a feature flag. Uses captureState to store the
   * feature flag value in test state.
   */
  router.post("/api/features", async (req: Request, res: Response) => {
    const { flag, enabled } = req.body;

    if (!flag || enabled === undefined) {
      return res.status(400).json({
        error: "Invalid request",
        message: "flag and enabled are required",
      });
    }

    try {
      const response = await fetch(`${FEATURES_API_URL}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag, enabled }),
      });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to set feature flag",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/pricing
   *
   * Returns pricing information. Uses match.state to select
   * the appropriate mock based on feature flag state.
   */
  router.get("/api/pricing", async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${PRICING_API_URL}/pricing`);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to get pricing",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
};
