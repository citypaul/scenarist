import type { Request, Response, Router } from 'express';

/**
 * Weather routes - demonstrates calling external Weather API
 */
export const setupWeatherRoutes = (router: Router): void => {
  router.get('/api/weather/:city', async (req: Request, res: Response) => {
    const { city } = req.params;

    try {
      // Call external Weather API (will be mocked by Scenarist)
      const response = await fetch(`https://api.weather.com/v1/weather/${city}`);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch weather data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
