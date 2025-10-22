import express from 'express';
import { createScenarist } from '@scenarist/express-adapter';
import {
  defaultScenario,
  successScenario,
  githubNotFoundScenario,
  weatherErrorScenario,
  stripeFailureScenario,
  slowNetworkScenario,
  mixedResultsScenario,
} from './scenarios.js';
import { setupGitHubRoutes } from './routes/github.js';
import { setupWeatherRoutes } from './routes/weather.js';
import { setupStripeRoutes } from './routes/stripe.js';

/**
 * Create and configure the Express application with Scenarist
 */
export const createApp = () => {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Initialize Scenarist
  const scenarist = createScenarist({
    enabled: true,
    strictMode: false, // Allow passthrough for unmocked requests
  });

  // Register all scenarios
  scenarist.registerScenario(defaultScenario);
  scenarist.registerScenario(successScenario);
  scenarist.registerScenario(githubNotFoundScenario);
  scenarist.registerScenario(weatherErrorScenario);
  scenarist.registerScenario(stripeFailureScenario);
  scenarist.registerScenario(slowNetworkScenario);
  scenarist.registerScenario(mixedResultsScenario);

  // Apply Scenarist middleware (includes test ID extraction and scenario endpoints)
  app.use(scenarist.middleware);

  // Setup application routes
  const router = express.Router();
  setupGitHubRoutes(router);
  setupWeatherRoutes(router);
  setupStripeRoutes(router);
  app.use(router);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return { app, scenarist };
};

/**
 * Start the server (only if running directly, not when imported for tests)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { app, scenarist } = createApp();

  // Start MSW
  scenarist.start();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Scenario control: POST http://localhost:${PORT}/__scenario__`);
  });
}
