import type { Request, Response, Router } from "express";

/**
 * Multi-step form routes - demonstrates stateful mock with state accumulation
 */
export const setupFormRoutes = (router: Router): void => {
  router.post("/api/form/step1", async (req: Request, res: Response) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Name and email are required",
      });
    }

    try {
      // Call external form API (will be mocked by Scenarist with state capture)
      const response = await fetch("https://api.forms.com/form/step1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to submit step 1",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  router.post("/api/form/step2", async (req: Request, res: Response) => {
    const { address, city } = req.body;

    if (!address || !city) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Address and city are required",
      });
    }

    try {
      // Call external form API (will be mocked by Scenarist with state capture)
      const response = await fetch("https://api.forms.com/form/step2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, city }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to submit step 2",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  router.post("/api/form/submit", async (_req: Request, res: Response) => {
    try {
      // Call external form API (will be mocked by Scenarist with state injection)
      const response = await fetch("https://api.forms.com/form/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: "Failed to submit form",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
};
