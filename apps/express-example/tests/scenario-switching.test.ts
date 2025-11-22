import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';

import { createTestFixtures } from './test-helpers.js';
import { scenarios } from '../src/scenarios.js';

const fixtures = await createTestFixtures();

describe('Scenario Switching E2E', () => {
  

  

  afterAll(() => {
    fixtures.cleanup();
  });

  describe('Default scenario', () => {
    it('should use default scenario when no scenario is set', async () => {

      const response = await request(fixtures.app)
        .get('/api/github/user/testuser')
        .set(fixtures.scenarist.config.headers.testId, 'default-test-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        login: 'octocat',
        id: 1,
        name: 'The Octocat',
        bio: 'GitHub mascot',
        public_repos: 8,
        followers: 1000,
      });
    });

    it('should use default scenario for weather API', async () => {

      const response = await request(fixtures.app)
        .get('/api/weather/london')
        .set(fixtures.scenarist.config.headers.testId, 'default-test-2');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        city: 'London',
        temperature: 18,
        conditions: 'Cloudy',
        humidity: 65,
      });
    });

    it('should use default scenario for stripe payment', async () => {

      const response = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, 'default-test-3')
        .send({ amount: 1000, currency: 'usd' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'ch_default123',
        status: 'succeeded',
        amount: 1000,
        currency: 'usd',
      });
    });
  });

  describe('Switching to success scenario', () => {
    it('should switch to success scenario via POST /__scenario__', async () => {

      // Switch scenario - type-safe with autocomplete!
      const switchResponse = await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, 'success-test-1')
        .send({ scenario: scenarios.success.id });

      expect(switchResponse.status).toBe(200);
      expect(switchResponse.body).toEqual({
        success: true,
        testId: 'success-test-1',
        scenarioId: 'success',
      });

      // Verify GitHub uses success scenario
      const githubResponse = await request(fixtures.app)
        .get('/api/github/user/testuser')
        .set(fixtures.scenarist.config.headers.testId, 'success-test-1');

      expect(githubResponse.status).toBe(200);
      expect(githubResponse.body).toEqual({
        login: 'testuser',
        id: 123,
        name: 'Test User',
        bio: 'Test bio',
        public_repos: 42,
        followers: 1337,
      });
    });

    it('should return success scenario data for weather', async () => {

      // Switch scenario - type-safe!
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, 'success-test-2')
        .send({ scenario: scenarios.success.id });

      // Verify weather uses success scenario
      const weatherResponse = await request(fixtures.app)
        .get('/api/weather/sanfrancisco')
        .set(fixtures.scenarist.config.headers.testId, 'success-test-2');

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body).toEqual({
        city: 'San Francisco',
        temperature: 22,
        conditions: 'Sunny',
        humidity: 45,
      });
    });
  });

  describe('Switching to error scenarios', () => {
    it('should return 404 when using github-not-found scenario', async () => {

      // Switch to github-not-found scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, 'github-404-test')
        .send({ scenario: scenarios.githubNotFound.id });

      // Verify GitHub returns 404
      const githubResponse = await request(fixtures.app)
        .get('/api/github/user/nonexistent')
        .set(fixtures.scenarist.config.headers.testId, 'github-404-test');

      expect(githubResponse.status).toBe(404);
      expect(githubResponse.body).toEqual({
        message: 'Not Found',
        documentation_url: 'https://docs.github.com',
      });
    });

    it('should return 500 when using weather-error scenario', async () => {

      // Switch to weather-error scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, 'weather-error-test')
        .send({ scenario: scenarios.weatherError.id });

      // Verify weather returns 500
      const weatherResponse = await request(fixtures.app)
        .get('/api/weather/tokyo')
        .set(fixtures.scenarist.config.headers.testId, 'weather-error-test');

      expect(weatherResponse.status).toBe(500);
      expect(weatherResponse.body).toEqual({
        error: 'Internal Server Error',
        message: 'Weather service temporarily unavailable',
      });
    });

    it('should return 402 when using stripe-failure scenario', async () => {

      // Switch to stripe-failure scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, 'stripe-failure-test')
        .send({ scenario: scenarios.stripeFailure.id });

      // Verify payment fails
      const paymentResponse = await request(fixtures.app)
        .post('/api/payment')
        .set(fixtures.scenarist.config.headers.testId, 'stripe-failure-test')
        .send({ amount: 5000, currency: 'usd' });

      expect(paymentResponse.status).toBe(402);
      expect(paymentResponse.body).toEqual({
        error: {
          type: 'card_error',
          code: 'insufficient_funds',
          message: 'Your card has insufficient funds.',
        },
      });
    });
  });

  describe('Getting current scenario', () => {
    it('should return current scenario via GET /__scenario__', async () => {

      // Switch to a scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(fixtures.scenarist.config.headers.testId, 'get-scenario-test')
        .send({ scenario: scenarios.success.id });

      // Get current scenario
      const getResponse = await request(fixtures.app)
        .get(fixtures.scenarist.config.endpoints.getScenario)
        .set(fixtures.scenarist.config.headers.testId, 'get-scenario-test');

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.testId).toBe('get-scenario-test');
      expect(getResponse.body.scenarioId).toBe('success');
      expect(getResponse.body.scenarioName).toBe('Success Scenario');
    });

    it('should return 404 when no scenario is set', async () => {

      const getResponse = await request(fixtures.app)
        .get(fixtures.scenarist.config.endpoints.getScenario)
        .set(fixtures.scenarist.config.headers.testId, 'no-scenario-test');

      expect(getResponse.status).toBe(404);
      expect(getResponse.body.error).toBe('No active scenario for this test ID');
      expect(getResponse.body.testId).toBe('no-scenario-test');
    });
  });
});
