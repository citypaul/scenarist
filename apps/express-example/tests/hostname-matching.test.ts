import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';
import type { ExpressScenarist } from '@scenarist/express-adapter';
import request from 'supertest';
import { createApp } from '../src/server.js';
import { scenarios } from '../src/scenarios.js';

/**
 * Hostname Matching - ATDD Acceptance Tests (Express)
 *
 * These tests verify the three URL pattern types and their hostname matching behavior:
 * - Pathname-only patterns (/api/data) - Origin-agnostic (match ANY hostname)
 * - Full URL patterns (http://localhost:3000/api/data) - Hostname-specific (match ONLY specified hostname)
 * - Native RegExp patterns (/\/api\/data/) - Origin-agnostic (MSW weak comparison)
 */
const createTestFixtures = async (): Promise<{
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

const fixtures = await createTestFixtures();

describe('Hostname Matching - Express', () => {
  

  

  afterAll(() => {
    fixtures.cleanup();
  });

  /**
   * Test 1: Pathname-Only Pattern - Origin-Agnostic Behavior
   *
   * Pattern: '/api/origin-agnostic'
   * Should match requests to ANY hostname (localhost, api.github.com, api.stripe.com, etc.)
   */
  it('should match pathname-only pattern at ANY hostname', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-1')
      .send({ scenario: scenarios.hostnameMatching.id });

    const response = await request(fixtures.app)
      .get('/api/test-hostname-match/pathname-only')
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-1');

    expect(response.status).toBe(200);
    expect(response.body.patternType).toBe('pathname-only');
    expect(response.body.behavior).toBe('origin-agnostic');
    expect(response.body.message).toContain('ANY hostname');
  });

  /**
   * Test 2: Full URL Pattern with GitHub - Hostname-Specific
   *
   * Pattern: 'https://api.github.com/api/github-only'
   * Should ONLY match api.github.com requests
   */
  it('should match full URL pattern ONLY for GitHub hostname', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-2')
      .send({ scenario: scenarios.hostnameMatching.id });

    const response = await request(fixtures.app)
      .get('/api/test-hostname-match/github-full')
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-2');

    expect(response.status).toBe(200);
    expect(response.body.patternType).toBe('full-url');
    expect(response.body.hostname).toBe('api.github.com');
    expect(response.body.behavior).toBe('hostname-specific');
    expect(response.body.message).toContain('ONLY matches api.github.com');
  });

  /**
   * Test 3: Full URL Pattern with Stripe - Hostname-Specific
   *
   * Pattern: 'https://api.stripe.com/api/stripe-only'
   * Should ONLY match api.stripe.com requests
   */
  it('should match full URL pattern ONLY for Stripe hostname', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-3')
      .send({ scenario: scenarios.hostnameMatching.id });

    const response = await request(fixtures.app)
      .get('/api/test-hostname-match/stripe-full')
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-3');

    expect(response.status).toBe(200);
    expect(response.body.patternType).toBe('full-url');
    expect(response.body.hostname).toBe('api.stripe.com');
    expect(response.body.behavior).toBe('hostname-specific');
    expect(response.body.message).toContain('ONLY matches api.stripe.com');
  });

  /**
   * Test 4: Native RegExp Pattern - Origin-Agnostic
   *
   * Pattern: /\/api\/regex-pattern$/
   * Should match the pathname pattern at ANY hostname (MSW weak comparison)
   */
  it('should match native RegExp pattern at ANY hostname', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-4')
      .send({ scenario: scenarios.hostnameMatching.id });

    const response = await request(fixtures.app)
      .get('/api/test-hostname-match/regexp')
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-4');

    expect(response.status).toBe(200);
    expect(response.body.patternType).toBe('native-regexp');
    expect(response.body.behavior).toContain('origin-agnostic');
    expect(response.body.message).toContain('ANY hostname');
  });

  /**
   * Test 5: Pathname with Path Parameters - Origin-Agnostic + Param Extraction
   *
   * Pattern: '/api/users/:userId/posts/:postId'
   * Should extract params AND match ANY hostname
   */
  it('should extract path params from pathname pattern (origin-agnostic)', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-5')
      .send({ scenario: scenarios.hostnameMatching.id });

    const response = await request(fixtures.app)
      .get('/api/test-hostname-match/pathname-params/789/321')
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-5');

    expect(response.status).toBe(200);
    expect(response.body.patternType).toBe('pathname-only with params');
    expect(response.body.behavior).toContain('origin-agnostic');
    expect(response.body.userId).toBe('789');
    expect(response.body.postId).toBe('321');
  });

  /**
   * Test 6: Full URL with Path Parameters - Hostname-Specific + Param Extraction
   *
   * Pattern: 'https://api.github.com/api/github-users/:userId'
   * Should extract params but ONLY match api.github.com
   */
  it('should extract path params from full URL pattern (hostname-specific)', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-6')
      .send({ scenario: scenarios.hostnameMatching.id });

    const response = await request(fixtures.app)
      .get('/api/test-hostname-match/full-params/999')
      .set(fixtures.scenarist.config.headers.testId, 'hostname-test-6');

    expect(response.status).toBe(200);
    expect(response.body.patternType).toBe('full-url with params');
    expect(response.body.hostname).toBe('api.github.com');
    expect(response.body.behavior).toContain('hostname-specific');
    expect(response.body.userId).toBe('999');
  });
});
