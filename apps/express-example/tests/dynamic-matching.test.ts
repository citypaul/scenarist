import { SCENARIST_TEST_ID_HEADER } from '@scenarist/express-adapter';
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';

import { createTestFixtures } from './test-helpers.js';
import { scenarios } from '../src/scenarios.js';

const fixtures = await createTestFixtures();

describe('Dynamic Content Matching E2E (Phase 1)', () => {
  

  

  afterAll(async () => {
    await fixtures.cleanup();
  });

  describe('Request Body Matching', () => {
    it('should match premium items and apply discount', async () => {

      // Switch to content-matching scenario
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'body-match-test-1')
        .send({ scenario: scenarios.contentMatching.id });

      // Make payment request with premium item
      const response = await request(fixtures.app)
        .post('/api/payment')
        .set(SCENARIST_TEST_ID_HEADER, 'body-match-test-1')
        .send({
          amount: 10000,
          currency: 'usd',
          itemType: 'premium'  // Matches the body criteria
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'ch_premium123',
        status: 'succeeded',
        amount: 8000,  // Discounted price
        currency: 'usd',
        discount: 'premium_item_discount'
      });
    });

    it('should match standard items with regular pricing', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'body-match-test-2')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .post('/api/payment')
        .set(SCENARIST_TEST_ID_HEADER, 'body-match-test-2')
        .send({
          amount: 5000,
          currency: 'usd',
          itemType: 'standard'  // Matches standard criteria
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'ch_standard123',
        status: 'succeeded',
        amount: 5000,
        currency: 'usd',
      });
    });

    it('should use fallback when no body criteria matches', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'body-match-test-3')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .post('/api/payment')
        .set(SCENARIST_TEST_ID_HEADER, 'body-match-test-3')
        .send({
          amount: 1000,
          currency: 'usd',
          itemType: 'other'  // Doesn't match any criteria, uses fallback
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'ch_fallback123',
        status: 'succeeded',
        amount: 1000,
        currency: 'usd',
      });
    });

    it('should support partial body matching (extra fields ignored)', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'body-match-test-4')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .post('/api/payment')
        .set(SCENARIST_TEST_ID_HEADER, 'body-match-test-4')
        .send({
          amount: 10000,
          currency: 'usd',
          itemType: 'premium',  // Matches
          extraField: 'ignored',  // Extra field doesn't prevent match
          metadata: { foo: 'bar' }
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('ch_premium123');
      expect(response.body.discount).toBe('premium_item_discount');
    });
  });

  describe('Request Header Matching', () => {
    it('should match premium tier header and return enhanced data', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'header-match-test-1')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .get('/api/github/user/testuser')
        .set(SCENARIST_TEST_ID_HEADER, 'header-match-test-1')
        .set('x-user-tier', 'premium');  // Matches premium tier

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        login: 'premium-user',
        id: 999,
        name: 'Premium User',
        bio: 'Premium tier access',
        public_repos: 100,
        followers: 5000,
        private_repos: 50,  // Extra field for premium users
        total_private_repos: 50,
      });
    });

    it('should match standard tier header and return basic data', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'header-match-test-2')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .get('/api/github/user/testuser')
        .set(SCENARIST_TEST_ID_HEADER, 'header-match-test-2')
        .set('x-user-tier', 'standard');  // Matches standard tier

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        login: 'standard-user',
        id: 100,
        name: 'Standard User',
        bio: 'Standard tier access',
        public_repos: 20,
        followers: 100,
      });
    });

    it('should use fallback when no tier header present', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'header-match-test-3')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .get('/api/github/user/testuser')
        .set(SCENARIST_TEST_ID_HEADER, 'header-match-test-3');
        // No x-user-tier header, uses fallback

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        login: 'guest-user',
        id: 1,
        name: 'Guest User',
        bio: 'No tier specified',
        public_repos: 5,
        followers: 10,
      });
    });
  });

  describe('Query Parameter Matching', () => {
    it('should match multiple query params and return detailed data', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'query-match-test-1')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .get('/api/weather/paris')
        .query({ units: 'metric', detailed: 'true' })  // Matches both params
        .set(SCENARIST_TEST_ID_HEADER, 'query-match-test-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        city: 'Paris',
        temperature: 20,
        conditions: 'Partly Cloudy',
        humidity: 60,
        windSpeed: 15,  // Extra detail when detailed=true
        pressure: 1013,
        visibility: 10,
      });
    });

    it('should match single query param when subset matches', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'query-match-test-2')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .get('/api/weather/newyork')
        .query({ units: 'imperial' })  // Matches units param only
        .set(SCENARIST_TEST_ID_HEADER, 'query-match-test-2');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        city: 'New York',
        temperature: 68,
        conditions: 'Sunny',
        humidity: 50,
      });
    });

    it('should not match when only one of multiple required params present', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'query-match-test-3')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .get('/api/weather/london')
        .query({ units: 'metric' })  // Missing 'detailed' param, doesn't match first mock
        .set(SCENARIST_TEST_ID_HEADER, 'query-match-test-3');

      expect(response.status).toBe(200);
      // Should use fallback since first mock requires both units AND detailed
      expect(response.body).toEqual({
        city: 'Default City',
        temperature: 15,
        conditions: 'Clear',
        humidity: 55,
      });
    });

    it('should use fallback when no query params match', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'query-match-test-4')
        .send({ scenario: scenarios.contentMatching.id });

      const response = await request(fixtures.app)
        .get('/api/weather/tokyo')
        // No query params at all
        .set(SCENARIST_TEST_ID_HEADER, 'query-match-test-4');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        city: 'Default City',
        temperature: 15,
        conditions: 'Clear',
        humidity: 55,
      });
    });
  });

  describe('First Matching Mock Wins (Precedence)', () => {
    it('should use first matching mock when multiple could match', async () => {

      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'precedence-test-1')
        .send({ scenario: scenarios.contentMatching.id });

      // Payment with standard itemType should match the FIRST standard mock, not fallback
      const response = await request(fixtures.app)
        .post('/api/payment')
        .set(SCENARIST_TEST_ID_HEADER, 'precedence-test-1')
        .send({
          amount: 5000,
          currency: 'usd',
          itemType: 'standard'
        });

      expect(response.status).toBe(200);
      // Should get the standard-specific response, not the fallback
      expect(response.body.id).toBe('ch_standard123');
      expect(response.body.amount).toBe(5000);
    });
  });

  describe('Test ID Isolation with Content Matching', () => {
    it('should maintain separate matching state per test ID', async () => {

      // Test ID 1: Premium tier
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'isolation-test-1')
        .send({ scenario: scenarios.contentMatching.id });

      // Test ID 2: Also content matching but different requests
      await request(fixtures.app)
        .post(fixtures.scenarist.config.endpoints.setScenario)
        .set(SCENARIST_TEST_ID_HEADER, 'isolation-test-2')
        .send({ scenario: scenarios.contentMatching.id });

      // Test ID 1 with premium header
      const response1 = await request(fixtures.app)
        .get('/api/github/user/user1')
        .set(SCENARIST_TEST_ID_HEADER, 'isolation-test-1')
        .set('x-user-tier', 'premium');

      // Test ID 2 with standard header
      const response2 = await request(fixtures.app)
        .get('/api/github/user/user2')
        .set(SCENARIST_TEST_ID_HEADER, 'isolation-test-2')
        .set('x-user-tier', 'standard');

      // Each test ID gets its matched response independently
      expect(response1.body.name).toBe('Premium User');
      expect(response2.body.name).toBe('Standard User');
    });
  });
});
