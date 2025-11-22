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
 * Usage:
 * ```typescript
 * const fixtures = await createTestFixtures();
 *
 * describe('My Tests', () => {
 *   afterAll(() => {
 *     fixtures.cleanup();
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
  cleanup: () => void;
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
    cleanup: () => {
      setup.scenarist?.stop();
    },
  };
};
