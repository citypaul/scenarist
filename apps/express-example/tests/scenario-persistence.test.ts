import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { scenarios } from "../src/scenarios.js";

import { createTestFixtures } from './test-helpers.js';
import { scenarios } from '../src/scenarios.js';

const fixtures = await createTestFixtures();

describe('Scenario Persistence Across Multiple Requests E2E', () => {
  

  

  afterAll(() => {
    fixtures.cleanup();
  });

  describe('Single scenario across multiple API calls', () => {
    it('should persist success scenario across multiple different API requests', async () => {
    if (!fixtures.scenarist) throw new Error('Scenarist not initialized');

      const testId = 'multi-request-success';

      // Set scenario once
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ scenario: 'success' });

      // Request 1: GitHub API
      const githubResponse = await request(fixtures.app)
        .get('/api/github/user/testuser')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(githubResponse.status).toBe(200);
      expect(githubResponse.body.login).toBe('testuser');
      expect(githubResponse.body.id).toBe(123);

      // Request 2: Weather API (same scenario, different endpoint)
      const weatherResponse = await request(fixtures.app)
        .get('/api/weather/sanfrancisco')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body.city).toBe('San Francisco');
      expect(weatherResponse.body.temperature).toBe(22);

      // Request 3: Stripe API (same scenario, third endpoint)
      const stripeResponse = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ amount: 5000, currency: 'usd' });

      expect(stripeResponse.status).toBe(200);
      expect(stripeResponse.body.id).toBe('ch_success123');
      expect(stripeResponse.body.status).toBe('succeeded');
    });

    it('should persist github-not-found scenario across multiple requests with fallback', async () => {
    if (!fixtures.scenarist) throw new Error('Scenarist not initialized');

      const testId = 'multi-request-github-error';

      // Set scenario once
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ scenario: 'github-not-found' });

      // Request 1: GitHub API (defined in scenario)
      const githubResponse1 = await request(fixtures.app)
        .get('/api/github/user/user1')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(githubResponse1.status).toBe(404);
      expect(githubResponse1.body.message).toBe('Not Found');

      // Request 2: GitHub API again (same scenario, different user)
      const githubResponse2 = await request(fixtures.app)
        .get('/api/github/user/user2')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(githubResponse2.status).toBe(404);
      expect(githubResponse2.body.message).toBe('Not Found');

      // Request 3: Weather API (falls back to default)
      const weatherResponse = await request(fixtures.app)
        .get('/api/weather/tokyo')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body.city).toBe('London'); // Default scenario
      expect(weatherResponse.body.temperature).toBe(18);

      // Request 4: Stripe API (falls back to default)
      const stripeResponse = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ amount: 1000, currency: 'usd' });

      expect(stripeResponse.status).toBe(200);
      expect(stripeResponse.body.id).toBe('ch_default123'); // Default scenario
    });

    it('should persist mixed-results scenario showing both errors and success', async () => {
    if (!fixtures.scenarist) throw new Error('Scenarist not initialized');

      const testId = 'multi-request-mixed';

      // Set scenario once
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ scenario: 'mixed-results' });

      // Request 1: GitHub succeeds
      const githubResponse = await request(fixtures.app)
        .get('/api/github/user/testuser')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(githubResponse.status).toBe(200);
      expect(githubResponse.body.login).toBe('mixeduser');

      // Request 2: Weather fails
      const weatherResponse = await request(fixtures.app)
        .get('/api/weather/city')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(weatherResponse.status).toBe(503);
      expect(weatherResponse.body.error).toBe('Service Unavailable');

      // Request 3: Stripe succeeds
      const stripeResponse = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ amount: 2500, currency: 'usd' });

      expect(stripeResponse.status).toBe(200);
      expect(stripeResponse.body.id).toBe('ch_mixed123');

      // Request 4: Weather fails again (consistent behavior)
      const weatherResponse2 = await request(fixtures.app)
        .get('/api/weather/anothercity')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(weatherResponse2.status).toBe(503);
      expect(weatherResponse2.body.error).toBe('Service Unavailable');
    });
  });

  describe('Simulating user journey with scenario persistence', () => {
    it('should maintain stripe-failure scenario throughout a payment flow', async () => {
    if (!fixtures.scenarist) throw new Error('Scenarist not initialized');

      const testId = 'payment-flow-failure';

      // User starts payment flow - set scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ scenario: 'stripe-failure' });

      // Step 1: User views their profile (falls back to default)
      const profileResponse = await request(fixtures.app)
        .get('/api/github/user/customer')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.login).toBe('octocat'); // Default

      // Step 2: User checks weather before ordering (falls back to default)
      const weatherResponse = await request(fixtures.app)
        .get('/api/weather/london')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body.city).toBe('London'); // Default

      // Step 3: User attempts payment (uses stripe-failure scenario)
      const paymentResponse = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ amount: 1000, currency: 'usd' });

      expect(paymentResponse.status).toBe(402);
      expect(paymentResponse.body.error.code).toBe('insufficient_funds');

      // Step 4: User tries payment again (still fails consistently)
      const retryResponse = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ amount: 500, currency: 'usd' });

      expect(retryResponse.status).toBe(402);
      expect(retryResponse.body.error.code).toBe('insufficient_funds');
    });

    it('should maintain success scenario throughout a complete user journey', async () => {
    if (!fixtures.scenarist) throw new Error('Scenarist not initialized');

      const testId = 'complete-journey-success';

      // Set scenario at the start of the journey
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ scenario: 'success' });

      // Page 1: User profile page
      const profileResponse = await request(fixtures.app)
        .get('/api/github/user/activeuser')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.login).toBe('testuser');
      expect(profileResponse.body.followers).toBe(1337);

      // Page 2: Weather dashboard
      const weatherResponse = await request(fixtures.app)
        .get('/api/weather/newyork')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body.city).toBe('San Francisco');
      expect(weatherResponse.body.conditions).toBe('Sunny');

      // Page 3: Payment page - first attempt
      const payment1 = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ amount: 3000, currency: 'usd' });

      expect(payment1.status).toBe(200);
      expect(payment1.body.status).toBe('succeeded');

      // Page 4: Payment confirmation page - check user again
      const confirmProfile = await request(fixtures.app)
        .get('/api/github/user/activeuser')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(confirmProfile.status).toBe(200);
      expect(confirmProfile.body.login).toBe('testuser');

      // Page 5: Another payment (subscription perhaps)
      const payment2 = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ amount: 999, currency: 'usd' });

      expect(payment2.status).toBe(200);
      expect(payment2.body.status).toBe('succeeded');
    });
  });

  describe('Scenario persistence with no scenario set', () => {
    it('should consistently use default scenario across multiple requests', async () => {
    if (!fixtures.scenarist) throw new Error('Scenarist not initialized');

      const testId = 'no-scenario-multi-request';

      // Don't set any scenario - should use default for everything

      // Request 1: GitHub
      const github1 = await request(fixtures.app)
        .get('/api/github/user/user1')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(github1.status).toBe(200);
      expect(github1.body.login).toBe('octocat'); // Default

      // Request 2: Weather
      const weather1 = await request(fixtures.app)
        .get('/api/weather/paris')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(weather1.status).toBe(200);
      expect(weather1.body.city).toBe('London'); // Default

      // Request 3: Payment
      const payment1 = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ amount: 1000, currency: 'usd' });

      expect(payment1.status).toBe(200);
      expect(payment1.body.id).toBe('ch_default123'); // Default

      // Request 4: GitHub again
      const github2 = await request(fixtures.app)
        .get('/api/github/user/user2')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(github2.status).toBe(200);
      expect(github2.body.login).toBe('octocat'); // Still default

      // Request 5: Weather again
      const weather2 = await request(fixtures.app)
        .get('/api/weather/berlin')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(weather2.status).toBe(200);
      expect(weather2.body.city).toBe('London'); // Still default
    });
  });

  describe('Scenario switching during a session', () => {
    it('should allow switching scenarios mid-session and persist new scenario', async () => {
    if (!fixtures.scenarist) throw new Error('Scenarist not initialized');

      const testId = 'scenario-switch-mid-session';

      // Start with success scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ scenario: 'success' });

      // Request 1: GitHub with success
      const github1 = await request(fixtures.app)
        .get('/api/github/user/test')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(github1.status).toBe(200);
      expect(github1.body.login).toBe('testuser');

      // Switch to github-not-found scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, testId)
        .send({ scenario: 'github-not-found' });

      // Request 2: GitHub now returns 404
      const github2 = await request(fixtures.app)
        .get('/api/github/user/test')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(github2.status).toBe(404);
      expect(github2.body.message).toBe('Not Found');

      // Request 3: GitHub still returns 404 (new scenario persists)
      const github3 = await request(fixtures.app)
        .get('/api/github/user/anotheruser')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(github3.status).toBe(404);
      expect(github3.body.message).toBe('Not Found');

      // Request 4: Weather falls back to default (not in github-not-found scenario)
      const weather = await request(fixtures.app)
        .get('/api/weather/rome')
        .set(fixtures.scenarist.config.headers.testId, testId);

      expect(weather.status).toBe(200);
      expect(weather.body.city).toBe('London'); // Default
    });
  });
});
