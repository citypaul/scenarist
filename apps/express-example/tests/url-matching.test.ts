import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server.js';
import { scenarios } from '../src/scenarios.js';

/**
 * URL Matching Strategies - ATDD Acceptance Tests (Express)
 *
 * These tests verify that URL matching works end-to-end with Express:
 * - Native RegExp patterns for URL matching
 * - String strategies (contains, startsWith, endsWith, equals) for URLs
 * - Combined matching (URL + headers)
 * - Automatic default fallback behavior
 *
 * Test approach:
 * - Uses Express routes that make server-side fetch calls
 * - Tests URL matching through external API mocks
 * - Verifies specificity-based selection
 */
describe('URL Matching Strategies - Express', () => {
  const { app, scenarist } = createApp();

  beforeAll(() => {
    scenarist.start();
  });

  afterAll(() => {
    scenarist.stop();
  });

  /**
   * Test 1: Native RegExp - Numeric ID Filtering
   *
   * Scenario mock matches when URL ends with numeric ID:
   * - Match: { url: /\/users\/\d+$/ }
   *
   * Should match:
   * - '/users/123' (ends with digits)
   * - '/users/456' (ends with digits)
   *
   * Should NOT match:
   * - '/users/octocat' (ends with string, not numeric)
   */
  it('should match URL with numeric ID using native RegExp', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-1')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/numeric-id/123')
      .set(scenarist.config.headers.testId, 'url-test-1');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('regexNumericId');
    expect(response.body.login).toBe('user-numeric-id');
    expect(response.body.followers).toBe(500);
  });

  it('should NOT match non-numeric ID (fallback to default)', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-2')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/numeric-id/octocat')
      .set(scenarist.config.headers.testId, 'url-test-2');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('fallback');
    expect(response.body.login).toBe('fallback-user');
    expect(response.body.followers).toBe(50);
  });

  /**
   * Test 2: Contains Strategy - URLs containing '/weather/'
   *
   * Scenario mock matches when URL contains '/weather/':
   * - Match: { url: { contains: '/weather/' } }
   *
   * Should match:
   * - 'https://api.weather.com/v1/weather/london' (contains '/weather/')
   *
   * Should NOT match:
   * - URLs without '/weather/' substring
   */
  it('should match URL containing "/weather/" using contains strategy', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-3')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/contains-api/london')
      .set(scenarist.config.headers.testId, 'url-test-3');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('containsWeather');
    expect(response.body.city).toBe('Weather Match City');
    expect(response.body.conditions).toBe('Weather route matched');
  });

  /**
   * Test 3: StartsWith Strategy - API Versioning
   *
   * Scenario mock matches when URL starts with v2:
   * - Match: { url: { startsWith: 'https://api.weather.com/v2' } }
   *
   * Should match:
   * - 'https://api.weather.com/v2/weather/london' (starts with v2 base)
   *
   * Should NOT match:
   * - 'https://api.weather.com/v1/weather/london' (starts with v1, not v2)
   */
  it('should match v2 API URL using startsWith strategy', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-4')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/version/v2/newyork')
      .set(scenarist.config.headers.testId, 'url-test-4');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('startsWithV2');
    expect(response.body.city).toBe('Version 2 City');
    expect(response.body.conditions).toBe('V2 API matched');
  });

  it('should NOT match v1 API URL (fallback)', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-5')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/version/v1/paris')
      .set(scenarist.config.headers.testId, 'url-test-5');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('fallback');
    expect(response.body.city).toBe('Fallback City');
  });

  /**
   * Test 4: EndsWith Strategy - File Extension Filtering
   *
   * Scenario mock matches when URL ends with '.json':
   * - Match: { url: { endsWith: '.json' } }
   *
   * Should match:
   * - '/repos/owner/repo/contents/data.json' (ends with .json)
   *
   * Should NOT match:
   * - '/repos/owner/repo/contents/readme.txt' (ends with .txt)
   */
  it('should match .json file extension using endsWith strategy', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-6')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/file-extension/config.json')
      .set(scenarist.config.headers.testId, 'url-test-6');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('endsWithJson');
    expect(response.body.name).toBe('data.json');
    expect(response.body.type).toBe('file');
  });

  it('should NOT match non-.json file (fallback)', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-7')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/file-extension/readme.txt')
      .set(scenarist.config.headers.testId, 'url-test-7');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('fallback');
    expect(response.body.name).toBe('unknown.txt');
  });

  /**
   * Test 5: Combined Matching - URL Pattern + Header
   *
   * Scenario mock matches when BOTH URL and header match:
   * - Match: { url: /\/v1\/charges$/, headers: { 'x-api-version': '2023-10-16' } }
   *
   * Should match when both conditions met
   * Should NOT match when only URL matches (header mismatch)
   */
  it('should match when both URL and header match', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-8')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/combined')
      .query({ apiVersion: '2023-10-16' })
      .set(scenarist.config.headers.testId, 'url-test-8');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('combinedUrlHeader');
    expect(response.body.amount).toBe(2000);
  });

  it('should NOT match when URL matches but header does not (fallback)', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-9')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/combined')
      .query({ apiVersion: '2022-11-15' }) // Different version
      .set(scenarist.config.headers.testId, 'url-test-9');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('fallback');
    expect(response.body.amount).toBe(1000);
  });

  /**
   * Test 6: Exact URL Match (Backward Compatible)
   *
   * Scenario mock matches exact URL string:
   * - Match: { url: 'https://api.github.com/users/exactuser' }
   *
   * Should match only the exact URL
   */
  it('should match exact URL string', async () => {
    await request(app)
      .post(scenarist.config.endpoints.setScenario)
      .set(scenarist.config.headers.testId, 'url-test-10')
      .send({ scenario: scenarios.urlMatching.id });

    const response = await request(app)
      .get('/api/test-url-match/exact/exactuser')
      .set(scenarist.config.headers.testId, 'url-test-10');

    expect(response.status).toBe(200);
    expect(response.body.matchedBy).toBe('exactUrl');
    expect(response.body.login).toBe('exactuser');
    expect(response.body.followers).toBe(100);
  });
});
