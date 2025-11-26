import { test, expect } from '@playwright/test';

/**
 * Custom server verification test
 *
 * This test verifies that the custom Express server (server.cjs) is running
 * rather than the standard Next.js dev server.
 *
 * The /__server-type endpoint only exists in the custom server, so this test
 * will fail if accidentally running with `pnpm dev` instead of `node server.cjs`.
 */
test.describe('Custom Server Verification', () => {
  test('should be running custom Express server', async ({ request }) => {
    const response = await request.get('/__server-type');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      serverType: 'custom',
      framework: 'express',
    });
  });
});
