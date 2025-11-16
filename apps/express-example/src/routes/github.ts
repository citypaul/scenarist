import type { Request, Response, Router } from 'express';

/**
 * GitHub routes - demonstrates calling external GitHub API
 */
export const setupGitHubRoutes = (router: Router): void => {
  router.get('/api/github/user/:username', async (req: Request, res: Response) => {
    const { username } = req.params;

    try {
      // Call external GitHub API (will be mocked by Scenarist)
      // Forward custom headers for content matching and regex matching
      const headers: HeadersInit = {};
      if (req.headers['x-user-tier']) {
        headers['x-user-tier'] = req.headers['x-user-tier'] as string;
      }

      // Extract campaign from query parameter and add as header
      // This enables regex matching on server-side fetch calls
      const campaign = req.query.campaign as string | undefined;
      if (campaign) {
        headers['x-campaign'] = campaign;
      }

      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers
      });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch GitHub user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
