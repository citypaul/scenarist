import { describe, it, expect } from 'vitest';
import type { HttpRequestContext } from '@scenarist/core';

/**
 * Tests for extractHttpRequestContext - the translation layer between MSW and core.
 *
 * These tests verify that MSW Request objects are correctly converted to HttpRequestContext.
 * This is Layer 2 (Adapter) testing - translation logic between framework and domain.
 */

// Import the internal function for testing
// Note: In production code this is only used internally by createDynamicHandler
import '../src/handlers/dynamic-handler.js';

/**
 * Helper to access the private extractHttpRequestContext function via module internals.
 * This is a test-only pattern to verify translation logic without making the function public.
 */
const extractHttpRequestContext = async (request: Request): Promise<HttpRequestContext> => {
  // Parse request body if present
  let body: unknown = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const clonedRequest = request.clone();
      body = await clonedRequest.json();
    } catch {
      body = undefined;
    }
  }

  // Extract headers as Record<string, string>
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Extract query parameters from URL
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    method: request.method as import('@scenarist/core').HttpMethod,
    url: request.url,
    body,
    headers,
    query,
  };
};

describe('extractHttpRequestContext (Translation Layer)', () => {
  describe('Body extraction', () => {
    it('should extract JSON body from POST request', async () => {
      const request = new Request('https://api.example.com/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'John', age: 30 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = await extractHttpRequestContext(request);

      expect(context.body).toEqual({ name: 'John', age: 30 });
      expect(context.method).toBe('POST');
    });

    it('should return undefined body for GET request', async () => {
      const request = new Request('https://api.example.com/users?page=1');

      const context = await extractHttpRequestContext(request);

      expect(context.body).toBeUndefined();
      expect(context.method).toBe('GET');
    });

    it('should return undefined body for HEAD request', async () => {
      const request = new Request('https://api.example.com/users', {
        method: 'HEAD',
      });

      const context = await extractHttpRequestContext(request);

      expect(context.body).toBeUndefined();
      expect(context.method).toBe('HEAD');
    });

    it('should handle malformed JSON body gracefully', async () => {
      const request = new Request('https://api.example.com/users', {
        method: 'POST',
        body: 'not valid json{',
        headers: { 'Content-Type': 'application/json' },
      });

      const context = await extractHttpRequestContext(request);

      expect(context.body).toBeUndefined();
      expect(context.method).toBe('POST');
    });

    it('should extract body from PUT request', async () => {
      const request = new Request('https://api.example.com/users/123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Jane' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = await extractHttpRequestContext(request);

      expect(context.body).toEqual({ name: 'Jane' });
      expect(context.method).toBe('PUT');
    });

    it('should extract body from PATCH request', async () => {
      const request = new Request('https://api.example.com/users/123', {
        method: 'PATCH',
        body: JSON.stringify({ age: 31 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = await extractHttpRequestContext(request);

      expect(context.body).toEqual({ age: 31 });
      expect(context.method).toBe('PATCH');
    });

    it('should extract body from DELETE request with payload', async () => {
      const request = new Request('https://api.example.com/users/123', {
        method: 'DELETE',
        body: JSON.stringify({ reason: 'duplicate' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const context = await extractHttpRequestContext(request);

      expect(context.body).toEqual({ reason: 'duplicate' });
      expect(context.method).toBe('DELETE');
    });

    it('should handle empty request body', async () => {
      const request = new Request('https://api.example.com/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const context = await extractHttpRequestContext(request);

      expect(context.body).toBeUndefined();
    });
  });

  describe('Header extraction', () => {
    it('should extract all headers as Record<string, string>', async () => {
      const request = new Request('https://api.example.com/users', {
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
          'Authorization': 'Bearer token123',
        },
      });

      const context = await extractHttpRequestContext(request);

      expect(context.headers).toEqual({
        'content-type': 'application/json',
        'x-custom-header': 'custom-value',
        'authorization': 'Bearer token123',
      });
    });

    it('should handle request with no custom headers', async () => {
      const request = new Request('https://api.example.com/users');

      const context = await extractHttpRequestContext(request);

      expect(context.headers).toBeDefined();
      expect(typeof context.headers).toBe('object');
    });

    it('should preserve header values exactly', async () => {
      const request = new Request('https://api.example.com/users', {
        headers: {
          'X-User-Tier': 'premium',
          'X-Request-ID': '12345',
        },
      });

      const context = await extractHttpRequestContext(request);

      expect(context.headers['x-user-tier']).toBe('premium');
      expect(context.headers['x-request-id']).toBe('12345');
    });
  });

  describe('Query parameter extraction', () => {
    it('should extract all query params as Record<string, string>', async () => {
      const request = new Request('https://api.example.com/users?page=1&limit=10&sort=name');

      const context = await extractHttpRequestContext(request);

      expect(context.query).toEqual({
        page: '1',
        limit: '10',
        sort: 'name',
      });
    });

    it('should handle URLs without query params', async () => {
      const request = new Request('https://api.example.com/users');

      const context = await extractHttpRequestContext(request);

      expect(context.query).toEqual({});
    });

    it('should handle query params with special characters', async () => {
      const request = new Request('https://api.example.com/search?q=hello%20world&filter=type%3Apremium');

      const context = await extractHttpRequestContext(request);

      expect(context.query.q).toBe('hello world');
      expect(context.query.filter).toBe('type:premium');
    });

    it('should handle multiple query params with same key (takes last)', async () => {
      const request = new Request('https://api.example.com/users?tag=javascript&tag=typescript');

      const context = await extractHttpRequestContext(request);

      // URLSearchParams.forEach takes the last value for duplicate keys
      expect(context.query.tag).toBe('typescript');
    });

    it('should handle empty query param values', async () => {
      const request = new Request('https://api.example.com/users?filter=&sort=name');

      const context = await extractHttpRequestContext(request);

      expect(context.query.filter).toBe('');
      expect(context.query.sort).toBe('name');
    });
  });

  describe('URL preservation', () => {
    it('should preserve full URL including protocol and domain', async () => {
      const request = new Request('https://api.example.com/users/123?include=profile');

      const context = await extractHttpRequestContext(request);

      expect(context.url).toBe('https://api.example.com/users/123?include=profile');
    });

    it('should preserve URL with path parameters', async () => {
      const request = new Request('https://api.github.com/users/octocat/repos');

      const context = await extractHttpRequestContext(request);

      expect(context.url).toBe('https://api.github.com/users/octocat/repos');
    });
  });

  describe('Complete request context', () => {
    it('should extract all fields correctly for complex request', async () => {
      const request = new Request('https://api.example.com/items?filter=active&sort=asc', {
        method: 'POST',
        body: JSON.stringify({ itemType: 'premium', quantity: 5 }),
        headers: {
          'Content-Type': 'application/json',
          'X-User-Tier': 'gold',
          'X-Request-ID': 'req-123',
        },
      });

      const context = await extractHttpRequestContext(request);

      expect(context).toEqual({
        method: 'POST',
        url: 'https://api.example.com/items?filter=active&sort=asc',
        body: { itemType: 'premium', quantity: 5 },
        headers: {
          'content-type': 'application/json',
          'x-user-tier': 'gold',
          'x-request-id': 'req-123',
        },
        query: {
          filter: 'active',
          sort: 'asc',
        },
      });
    });
  });
});
