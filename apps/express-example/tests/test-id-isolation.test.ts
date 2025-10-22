import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server.js';

describe('Test ID Isolation E2E', () => {
  const { app, scenarist } = createApp();

  beforeAll(() => {
    scenarist.start();
  });

  afterAll(() => {
    scenarist.stop();
  });

  it('should allow different test IDs to use different scenarios concurrently', async () => {
    // Test ID 1: Set to success scenario
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-id-1')
      .send({ scenario: 'success' });

    // Test ID 2: Set to github-not-found scenario
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-id-2')
      .send({ scenario: 'github-not-found' });

    // Test ID 3: Set to weather-error scenario
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-id-3')
      .send({ scenario: 'weather-error' });

    // Verify Test ID 1 gets success scenario data
    const response1 = await request(app)
      .get('/api/github/user/testuser')
      .set('x-test-id', 'test-id-1');

    expect(response1.status).toBe(200);
    expect(response1.body.login).toBe('testuser');
    expect(response1.body.id).toBe(123);

    // Verify Test ID 2 gets 404 error
    const response2 = await request(app)
      .get('/api/github/user/testuser')
      .set('x-test-id', 'test-id-2');

    expect(response2.status).toBe(404);
    expect(response2.body.message).toBe('Not Found');

    // Verify Test ID 3 still uses success for GitHub (weather-error scenario doesn't define GitHub mock)
    // Should fall back to default scenario for GitHub
    const response3 = await request(app)
      .get('/api/github/user/testuser')
      .set('x-test-id', 'test-id-3');

    expect(response3.status).toBe(200);
    expect(response3.body.login).toBe('octocat'); // Default scenario

    // But weather should fail for Test ID 3
    const weatherResponse3 = await request(app)
      .get('/api/weather/tokyo')
      .set('x-test-id', 'test-id-3');

    expect(weatherResponse3.status).toBe(500);
    expect(weatherResponse3.body.error).toBe('Internal Server Error');
  });

  it('should not leak scenario state between test IDs', async () => {
    // Set test-id-A to stripe-failure
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-id-A')
      .send({ scenario: 'stripe-failure' });

    // Set test-id-B to success
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'test-id-B')
      .send({ scenario: 'success' });

    // Verify test-id-A sees failure
    const responseA = await request(app)
      .post('/api/payment')
      .set('x-test-id', 'test-id-A')
      .send({ amount: 1000, currency: 'usd' });

    expect(responseA.status).toBe(402);
    expect(responseA.body.error.code).toBe('insufficient_funds');

    // Verify test-id-B sees success
    const responseB = await request(app)
      .post('/api/payment')
      .set('x-test-id', 'test-id-B')
      .send({ amount: 1000, currency: 'usd' });

    expect(responseB.status).toBe(200);
    expect(responseB.body.status).toBe('succeeded');
    expect(responseB.body.id).toBe('ch_success123');

    // Verify test-id-A still sees failure (not affected by test-id-B)
    const responseA2 = await request(app)
      .post('/api/payment')
      .set('x-test-id', 'test-id-A')
      .send({ amount: 1000, currency: 'usd' });

    expect(responseA2.status).toBe(402);
  });

  it('should allow test IDs to get their own current scenarios', async () => {
    // Set different scenarios for different test IDs
    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'isolation-test-1')
      .send({ scenario: 'success' });

    await request(app)
      .post('/__scenario__')
      .set('x-test-id', 'isolation-test-2')
      .send({ scenario: 'slow-network' });

    // Get scenario for test-1
    const getResponse1 = await request(app)
      .get('/__scenario__')
      .set('x-test-id', 'isolation-test-1');

    expect(getResponse1.body.scenarioId).toBe('success');

    // Get scenario for test-2
    const getResponse2 = await request(app)
      .get('/__scenario__')
      .set('x-test-id', 'isolation-test-2');

    expect(getResponse2.body.scenarioId).toBe('slow-network');

    // Verify they're different
    expect(getResponse1.body.scenarioId).not.toBe(getResponse2.body.scenarioId);
  });

  it('should handle many concurrent test IDs without conflicts', async () => {
    // Set up 10 different test IDs with different scenarios
    const testIds = Array.from({ length: 10 }, (_, i) => `concurrent-test-${i}`);
    const scenarios = ['success', 'github-not-found', 'weather-error', 'stripe-failure'];

    // Set scenarios for all test IDs
    await Promise.all(
      testIds.map((testId, index) =>
        request(app)
          .post('/__scenario__')
          .set('x-test-id', testId)
          .send({ scenario: scenarios[index % scenarios.length] })
      )
    );

    // Make concurrent requests with different test IDs
    const responses = await Promise.all(
      testIds.map((testId) =>
        request(app).get('/api/github/user/testuser').set('x-test-id', testId)
      )
    );

    // Verify each test ID got the expected response
    responses.forEach((response, index) => {
      const expectedScenario = scenarios[index % scenarios.length];

      if (expectedScenario === 'success') {
        expect(response.status).toBe(200);
        expect(response.body.login).toBe('testuser');
      } else if (expectedScenario === 'github-not-found') {
        expect(response.status).toBe(404);
      } else {
        // weather-error and stripe-failure don't define GitHub mock,
        // so should fall back to default
        expect(response.status).toBe(200);
        expect(response.body.login).toBe('octocat');
      }
    });
  });
});
