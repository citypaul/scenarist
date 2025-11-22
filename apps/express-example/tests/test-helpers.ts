import type { Express } from 'express';
import type { ExpressScenarist } from '@scenarist/express-adapter';
import { createApp } from '../src/server.js';
import { scenarios } from '../src/scenarios.js';

/**
 * Create test fixtures for Express integration tests.
 *
 * This factory function:
 * 1. Creates the Express app with Scenarist configured
 * 2. Starts the MSW server if Scenarist is enabled
 * 3. Returns cleanup function to stop MSW after tests
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
 *     await request(fixtures.app).get('/api/test')...
 *   });
 * });
 * ```
 */
export const createTestFixtures = async (): Promise<{
  app: Express;
  scenarist: ExpressScenarist<typeof scenarios> | undefined;
  cleanup: () => void;
}> => {
  const setup = await createApp();

  if (setup.scenarist) {
    setup.scenarist.start();
  }

  return {
    app: setup.app,
    scenarist: setup.scenarist,
    cleanup: () => {
      if (setup.scenarist) {
        setup.scenarist.stop();
      }
    },
  };
};
