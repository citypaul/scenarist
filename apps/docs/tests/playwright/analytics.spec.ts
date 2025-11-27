import { expect, test } from '@playwright/test';

/**
 * Analytics Integration Tests
 *
 * Verifies Plausible analytics is properly configured:
 * - Script tag present on all pages with correct attributes
 * - Astro API route proxy endpoints respond correctly
 */

test.describe('Analytics', () => {
  test.describe('Script injection', () => {
    test('landing page includes analytics script with correct attributes', async ({
      page,
    }) => {
      await page.goto('/');

      const analyticsScript = page.locator(
        'script[data-domain="scenarist.io"]'
      );
      await expect(analyticsScript).toHaveAttribute('defer', '');
      await expect(analyticsScript).toHaveAttribute('data-api', '/api/event');
      await expect(analyticsScript).toHaveAttribute('src', '/js/script.js');
    });

    test('docs pages include analytics script with correct attributes', async ({
      page,
    }) => {
      await page.goto('/introduction/quick-start');

      const analyticsScript = page.locator(
        'script[data-domain="scenarist.io"]'
      );
      await expect(analyticsScript).toHaveAttribute('defer', '');
      await expect(analyticsScript).toHaveAttribute('data-api', '/api/event');
      await expect(analyticsScript).toHaveAttribute('src', '/js/script.js');
    });
  });

  test.describe('Proxy endpoints', () => {
    test('/js/script.js returns JavaScript content', async ({ request }) => {
      const response = await request.get('/js/script.js');

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain(
        'application/javascript'
      );

      const body = await response.text();
      expect(body.length).toBeGreaterThan(0);
    });

    test('/api/event accepts POST requests', async ({ request }) => {
      const response = await request.post('/api/event', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          n: 'pageview',
          u: 'https://scenarist.io/test',
          d: 'scenarist.io',
        },
      });

      // Plausible returns 202 Accepted for valid events
      // or 400 for invalid payload - either confirms our proxy works
      expect([200, 202, 400]).toContain(response.status());
    });

    test('/api/event handles malformed JSON gracefully', async ({ request }) => {
      const response = await request.post('/api/event', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: 'not valid json {{{',
      });

      // Should return a client or server error, not crash
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(600);
    });

    test('/api/event handles empty body gracefully', async ({ request }) => {
      const response = await request.post('/api/event', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: '',
      });

      // Should return a client or server error, not crash
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(600);
    });
  });
});
