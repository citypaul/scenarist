import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Express } from 'express';
import type { ExpressScenarist } from '@scenarist/express-adapter';
import request from 'supertest';
import { createApp } from '../src/server.js';
import { scenarios } from '../src/scenarios.js';

/**
 * Regex Matching Tests - Server-Side Pattern Matching
 *
 * This test file validates regex pattern matching for SERVER-SIDE MSW interception:
 * - Match x-campaign header against regex pattern (server → API fetch)
 * - Case-insensitive matching with flags
 * - Multiple pattern alternatives (premium|vip)
 * - Fallback to default when pattern doesn't match
 *
 * Use Case (Server-Side):
 * Marketing campaign tracking - server extracts campaign from query param,
 * adds as header to external API call. MSW intercepts that fetch and matches
 * against regex pattern.
 *
 * Flow:
 * 1. Client → GET /api/github/user/:username?campaign=summer-premium-sale
 * 2. API route extracts campaign, adds to fetch headers
 * 3. API route → fetch('https://api.github.com/users/:username', { headers: { 'x-campaign': 'summer-premium-sale' } })
 * 4. MSW intercepts, matches x-campaign against /premium|vip/i
 * 5. Returns premium user data
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

describe('Regex Pattern Matching E2E (Server-Side)', () => {
  

  

  afterAll(() => {
    fixtures.cleanup();
  });

  it('should match premium user data when campaign contains "premium"', async () => {
    // Switch to campaignRegex scenario
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-1')
      .send({ scenario: scenarios.campaignRegex.id });

    // Make request with campaign query param
    // API route will extract this and add as x-campaign header to the fetch
    const response = await request(fixtures.app)
      .get('/api/github/user/testuser')
      .query({ campaign: 'summer-premium-sale' })
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-1');

    // Expected: Premium user data (regex matched on x-campaign header in server-side fetch)
    // Pattern: /premium|vip/i should match "premium" in "summer-premium-sale"
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      login: 'premium-campaign-user',
      id: 9999,
      name: 'Premium Campaign User',
      bio: 'VIP access via marketing campaign',
      public_repos: 200,
      followers: 10000,
      private_repos: 100,
      total_private_repos: 100,
    });
  });

  it('should match premium user data when campaign contains "vip" (case insensitive)', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-2')
      .send({ scenario: scenarios.campaignRegex.id });

    // Test case-insensitive flag: "VIP" should match /premium|vip/i
    const response = await request(fixtures.app)
      .get('/api/github/user/testuser')
      .query({ campaign: 'early-VIP-access' })
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-2');

    // Expected: Premium user data (regex matched "VIP" with 'i' flag)
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Premium Campaign User');
    expect(response.body.private_repos).toBe(100);
  });

  it('should fallback to guest user when campaign does NOT match pattern', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-3')
      .send({ scenario: scenarios.campaignRegex.id });

    // Campaign that does NOT match /premium|vip/i
    const response = await request(fixtures.app)
      .get('/api/github/user/testuser')
      .query({ campaign: 'summer-sale' })
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-3');

    // Expected: Guest user (no regex match, fallback to default scenario)
    expect(response.status).toBe(200);
    expect(response.body.login).toBe('octocat');  // Default scenario response
    expect(response.body.name).toBe('The Octocat');
  });

  it('should fallback to guest user when campaign param is missing', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-4')
      .send({ scenario: scenarios.campaignRegex.id });

    // No campaign param - x-campaign header won't be added to fetch
    const response = await request(fixtures.app)
      .get('/api/github/user/testuser')
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-4');

    // Expected: Guest user (no x-campaign header = no match, fallback to default)
    expect(response.status).toBe(200);
    expect(response.body.login).toBe('octocat');
    expect(response.body.name).toBe('The Octocat');
  });

  it('should demonstrate partial match within campaign string', async () => {
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-5')
      .send({ scenario: scenarios.campaignRegex.id });

    // Pattern should match "premium" anywhere in the campaign string
    const response = await request(fixtures.app)
      .get('/api/github/user/testuser')
      .query({ campaign: 'partners-premium-tier' })
      .set(fixtures.scenarist.config.headers.testId, 'regex-test-5');

    // Expected: Premium user data (regex finds "premium" in middle of string)
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Premium Campaign User');
    expect(response.body.followers).toBe(10000);
  });

  it('should maintain test ID isolation with regex matching', async () => {
    // Test ID 1: Premium campaign
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'regex-isolation-1')
      .send({ scenario: scenarios.campaignRegex.id });

    // Test ID 2: Non-matching campaign
    await request(fixtures.app)
      .post(fixtures.scenarist.config.endpoints.setScenario)
      .set(fixtures.scenarist.config.headers.testId, 'regex-isolation-2')
      .send({ scenario: scenarios.campaignRegex.id });

    // Test ID 1 with premium campaign
    const response1 = await request(fixtures.app)
      .get('/api/github/user/user1')
      .query({ campaign: 'premium-2024' })
      .set(fixtures.scenarist.config.headers.testId, 'regex-isolation-1');

    // Test ID 2 with standard campaign
    const response2 = await request(fixtures.app)
      .get('/api/github/user/user2')
      .query({ campaign: 'standard-2024' })
      .set(fixtures.scenarist.config.headers.testId, 'regex-isolation-2');

    // Each test ID gets its matched response independently
    expect(response1.body.name).toBe('Premium Campaign User');
    expect(response2.body.name).toBe('The Octocat');  // Fallback
  });
});
