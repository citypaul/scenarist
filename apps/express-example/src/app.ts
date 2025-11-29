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
import { setupStringMatchingRoutes } from "./routes/string-matching.js";
import { setupUrlMatchingRoutes } from "./routes/url-matching.js";
import { setupHostnameMatchingRoutes } from "./routes/hostname-matching.js";
import { setupProductsRepoRoutes } from "./routes/products-repo.js";
import { scenarios } from "./scenarios.js";

/**
 * Create and configure the Express application with Scenarist
 *
 * **PRODUCTION TREE-SHAKING (Automatic):**
 *
 * Scenarist adapters automatically optimize for production:
 * - In production: `createScenarist()` returns `undefined`
 * - Bundlers detect this and eliminate ~300KB of test code
 * - No configuration needed - it just works!
 *
 * **How it works:**
 * 1. Adapter checks `process.env.NODE_ENV === 'production'`
 * 2. Returns `undefined` without loading any Scenarist code
 * 3. Bundlers perform dead code elimination
 * 4. Result: Zero test code in production bundles
 *
 * **Type safety:**
 * - Return type: `ExpressScenarist<typeof scenarios> | undefined`
 * - TypeScript enforces null checks via `if (scenarist)` guards
 *
 * **Learn more:** https://scenarist.io/introduction/production-safety
 */
export const createApp = async (): Promise<{
  app: Express;
  scenarist: ExpressScenarist<typeof scenarios> | undefined;
}> => {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Initialize Scenarist (automatically returns undefined in production)
  const scenarist = await createScenarist({
    enabled: true,
    scenarios, // All scenarios registered at initialization (must include 'default')
    strictMode: false, // Allow passthrough for unmocked requests
  });

  // Apply Scenarist middleware (only in non-production)
  if (scenarist) {
    app.use(scenarist.middleware);
  }

  // Setup application routes
  const router = express.Router();
  setupGitHubRoutes(router);
  setupWeatherRoutes(router);
  // adding a comment
  setupStripeRoutes(router);
  setupCartRoutes(router);
  setupFormRoutes(router);
  setupStringMatchingRoutes(router);
  setupUrlMatchingRoutes(router);
  setupHostnameMatchingRoutes(router);
  setupProductsRepoRoutes(router);
  app.use(router);

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return { app, scenarist };
};
