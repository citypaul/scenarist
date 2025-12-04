import type { Request, Response, Router } from "express";

/**
 * Issue #328 Bug Reproduction Routes
 *
 * These routes reproduce the exact pattern from plum-bff that fails:
 * - GET /applications/:id is mocked by BOTH default (sequence) and active (stateResponse)
 * - POST /eligibility sets state for stateResponse conditions
 *
 * @see https://github.com/citypaul/scenarist/issues/328
 */

const ISSUE328_API_URL = "https://api.issue328.com";

export const setupIssue328Routes = (router: Router): void => {
  /**
   * GET /api/issue328/applications/:id
   *
   * Fetches application status. In the bug scenario:
   * - Default scenario has SEQUENCE mock for this endpoint
   * - Active scenario has STATERESPONSE mock for this endpoint
   * - The stateResponse mock should win (last-wins), but bug causes default to win
   */
  router.get(
    "/api/issue328/applications/:id",
    async (req: Request, res: Response) => {
      const { id } = req.params;

      try {
        const response = await fetch(`${ISSUE328_API_URL}/applications/${id}`);
        const data = await response.json();

        if (!response.ok) {
          return res.status(response.status).json(data);
        }

        return res.json(data);
      } catch (error) {
        return res.status(500).json({
          error: "Failed to get application",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  /**
   * POST /api/issue328/applications/:id/eligibility
   *
   * Submits eligibility check. Uses afterResponse.setState to set
   * { phase: 'quoteAccept' } which should be matched by stateResponse.
   */
  router.post(
    "/api/issue328/applications/:id/eligibility",
    async (req: Request, res: Response) => {
      const { id } = req.params;

      try {
        const response = await fetch(
          `${ISSUE328_API_URL}/applications/${id}/eligibility`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
          },
        );
        const data = await response.json();

        if (!response.ok) {
          return res.status(response.status).json(data);
        }

        return res.json(data);
      } catch (error) {
        return res.status(500).json({
          error: "Failed to submit eligibility",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );
};
