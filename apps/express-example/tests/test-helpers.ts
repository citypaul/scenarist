import type { Express } from 'express';
import type { ExpressScenarist } from '@scenarist/express-adapter';
import { createApp } from '../src/app.js';
import { scenarios } from '../src/scenarios.js';

/**
 * Create test fixtures for Express integration tests.
 *
 * This factory function:
 * 1. Creates the Express app with Scenarist configured
 * 2. Starts the MSW server
 * 3. Returns cleanup function to stop MSW after tests
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
 *     await request(fixtures.app)
 *       .post(fixtures.scenarist.config.endpoints.setScenario)
 *       ...
 *   });
 * });
 * ```
 */
export const createTestFixtures = async (): Promise<{
  app: Express;
  scenarist: ExpressScenarist<typeof scenarios>;
  cleanup: () => Promise<void>;
}> => {
  const setup = await createApp();

  if (!setup.scenarist) {
    throw new Error(
      'Scenarist not initialized - ensure NODE_ENV is set to "test" or scenarist.enabled is true'
    );
  }

  setup.scenarist.start();

  return {
    app: setup.app,
    scenarist: setup.scenarist,
    cleanup: async () => {
      await setup.scenarist?.stop();
    },
  };
};
