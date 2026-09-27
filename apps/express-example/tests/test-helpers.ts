import { once } from "node:events";
import { createServer, type Server } from "node:http";
import type { Express } from "express";
import type { ExpressScenarist } from "@scenarist/express-adapter";
import { createApp } from "../src/app.js";
import { scenarios } from "../src/scenarios.js";

/**
 * Create test fixtures for Express integration tests.
 *
 * This factory function:
 * 1. Creates the Express app with Scenarist configured
 * 2. Starts the MSW server
 * 3. Starts one HTTP server bound to 127.0.0.1 for the whole test file
 * 4. Returns cleanup function to close the server and stop MSW after tests
 *
 * CRITICAL: Send requests to `fixtures.server`, never to `fixtures.app`.
 * Given an unbound app, supertest calls `app.listen(0)`, which binds the
 * dual-stack `::` address, and then dials `127.0.0.1:<port>`. On macOS another
 * process can already own `127.0.0.1:<port>`; the more specific binding wins, so
 * the request reaches that process instead (random 404s, 500s and timeouts).
 * Binding to 127.0.0.1 ourselves makes the OS reject any port already taken there.
 *
 * IMPORTANT: This is a test-only helper. Scenarist MUST be enabled in test environment.
 * If scenarist is undefined, this function will throw immediately.
 *
 * CRITICAL: The cleanup function is async and MUST be awaited in afterAll.
 * Not awaiting cleanup causes race conditions where the next test file starts
 * before the MSW server is fully stopped.
 *
 * Usage:
 * ```typescript
 * const fixtures = await createTestFixtures();
 *
 * describe('My Tests', () => {
 *   afterAll(async () => {
 *     await fixtures.cleanup();  // MUST await!
 *   });
 *
 *   it('should work', async () => {
 *     // No null checks needed - scenarist is guaranteed non-null
 *     await request(fixtures.server)
 *       .post(fixtures.scenarist.config.endpoints.setScenario)
 *       ...
 *   });
 * });
 * ```
 */
export const createTestFixtures = async (): Promise<{
  app: Express;
  server: Server;
  scenarist: ExpressScenarist<typeof scenarios>;
  cleanup: () => Promise<void>;
}> => {
  const setup = createApp();

  if (!setup.scenarist) {
    throw new Error(
      'Scenarist not initialized - ensure NODE_ENV is set to "test" or scenarist.enabled is true',
    );
  }

  setup.scenarist.start();

  const server = createServer(setup.app).listen(0, "127.0.0.1");
  await once(server, "listening");

  return {
    app: setup.app,
    server,
    scenarist: setup.scenarist,
    cleanup: async () => {
      server.closeAllConnections();
      server.close();
      await once(server, "close");
      await setup.scenarist?.stop();
    },
  };
};
