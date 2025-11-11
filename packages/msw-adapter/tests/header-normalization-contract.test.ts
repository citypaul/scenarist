import { describe, it, expect } from 'vitest';

/**
 * This test documents the header normalization contract between MSW adapter and Core.
 * 
 * CONTRACT:
 * - MSW adapter MUST normalize all request header keys to lowercase
 * - Core ResponseSelector expects lowercase header keys
 * - This ensures case-insensitive header matching works correctly
 * 
 * WHY THIS MATTERS:
 * - HTTP headers are case-insensitive per RFC 2616
 * - Browsers can send headers with any casing (Authorization, AUTHORIZATION, authorization)
 * - Without normalization, header matching would fail
 * 
 * CURRENT STATE:
 * - The Fetch API Headers object automatically normalizes keys to lowercase
 * - We still normalize explicitly for: defense in depth, documentation, future-proofing
 */
describe('Header normalization contract', () => {
  it('documents that Headers API normalizes keys automatically', () => {
    // Fetch API Headers object automatically normalizes to lowercase
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('X-CUSTOM-HEADER', 'test-value');
    headers.set('UPPERCASE-HEADER', 'uppercase-value');

    // All keys are automatically lowercase
    const keys: string[] = [];
    headers.forEach((value, key) => {
      keys.push(key);
    });

    // Check all keys are lowercase (order may vary)
    expect(keys).toContain('content-type');
    expect(keys).toContain('x-custom-header');
    expect(keys).toContain('uppercase-header');
    expect(keys.every(key => key === key.toLowerCase())).toBe(true);
  });

  it('documents the contract with core ResponseSelector', () => {
    // Core expects lowercase header keys in HttpRequestContext
    const requestContext = {
      method: 'GET' as const,
      url: 'https://api.example.com/test',
      body: undefined,
      headers: {
        'content-type': 'application/json',  // Lowercase
        'x-custom-header': 'test-value',     // Lowercase
      },
      query: {},
    };

    // Core normalizes criteria keys to lowercase and matches against request headers
    const criteriaHeaders = {
      'Content-Type': 'application/json',    // Mixed case in criteria
      'X-Custom-Header': 'test-value',       // Mixed case in criteria
    };

    // Simulate core's matching logic (from response-selector.ts:306-309)
    const matches = Object.entries(criteriaHeaders).every(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      return requestContext.headers[normalizedKey] === value;
    });

    expect(matches).toBe(true);
  });

  it('shows why normalization is needed for defense in depth', () => {
    // Even though Headers API normalizes, we should explicitly normalize for:
    // 1. Defense in depth - don't rely on external behavior
    // 2. Documentation - makes contract explicit
    // 3. Future-proofing - in case we use different environments

    // Mock scenario where headers might NOT be normalized (hypothetical)
    const rawHeaders: Record<string, string> = {
      'Content-Type': 'application/json',    // Mixed case
      'X-Custom-Header': 'test-value',       // Mixed case
    };

    // Without normalization, matching would fail
    const criteriaKey = 'x-custom-header';
    expect(rawHeaders[criteriaKey]).toBeUndefined();  // Case mismatch

    // With normalization, matching succeeds
    const normalizedHeaders: Record<string, string> = {};
    Object.entries(rawHeaders).forEach(([key, value]) => {
      normalizedHeaders[key.toLowerCase()] = value;
    });
    expect(normalizedHeaders[criteriaKey]).toBe('test-value');  // Match!
  });
});
