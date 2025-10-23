import type { Request, Response, Router } from 'express';

/**
 * Weather routes - demonstrates calling external Weather API
 */
export const setupWeatherRoutes = (router: Router): void => {
  router.get('/api/weather/:city', async (req: Request, res: Response) => {
    const { city } = req.params;

    try {
      // Call external Weather API (will be mocked by Scenarist)
      // Forward query parameters for content matching
      const queryParams = new URLSearchParams(req.query as Record<string, string>);
      const queryString = queryParams.toString();
      const url = queryString
        ? `https://api.weather.com/v1/weather/${city}?${queryString}`
        : `https://api.weather.com/v1/weather/${city}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.json(data);
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch weather data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
