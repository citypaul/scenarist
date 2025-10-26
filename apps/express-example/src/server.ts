import {
  createScenarist,
  type ExpressScenarist,
} from "@scenarist/express-adapter";
import express, { type Express } from "express";
import { setupGitHubRoutes } from "./routes/github.js";
import { setupStripeRoutes } from "./routes/stripe.js";
import { setupWeatherRoutes } from "./routes/weather.js";
import { setupCartRoutes } from "./routes/cart.js";
import { setupFormRoutes } from "./routes/form.js";
import { defaultScenario, scenarios } from "./scenarios.js";

/**
 * Create and configure the Express application with Scenarist
 */
export const createApp = (): { app: Express; scenarist: ExpressScenarist } => {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Initialize Scenarist
  const scenarist = createScenarist({
    enabled: true,
    defaultScenario: defaultScenario, // Required - used as fallback for all unmocked requests
    strictMode: false, // Allow passthrough for unmocked requests
  });

  // Register additional scenarios (default is auto-registered)
  scenarist.registerScenarios(Object.values(scenarios));

  // Apply Scenarist middleware (includes test ID extraction and scenario endpoints)
  app.use(scenarist.middleware);

  // Setup application routes
  const router = express.Router();
  setupGitHubRoutes(router);
  setupWeatherRoutes(router);
  setupStripeRoutes(router);
  setupCartRoutes(router);
  setupFormRoutes(router);
  app.use(router);

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
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
