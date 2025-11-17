import { describe, it, expect, beforeEach } from 'vitest';
import { createResponseSelector } from '../src/domain/response-selector.js';
import type { HttpRequestContext, ScenaristMock } from '../src/types/index.js';

describe('URL Matching in Response Selector', () => {
  let selector: ReturnType<typeof createResponseSelector>;
  let context: HttpRequestContext;

  beforeEach(() => {
    selector = createResponseSelector();
    context = {
      method: 'GET',
      url: '/api/users/123',
      body: undefined,
      headers: {},
      query: {},
    };
  });

  describe('String exact matching', () => {
    it('should match exact URL string', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: '/api/users/123',
          },
          response: { status: 200, body: { matched: true } },
        },
        {
          method: 'GET',
          url: '/api/users/123',
          response: { status: 200, body: { fallback: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ matched: true });
      }
    });

    it('should not match different URL', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users',
          match: {
            url: '/api/products',
          },
          response: { status: 200, body: { specific: true } },
        },
        {
          method: 'GET',
          url: '/api/users',
          response: { status: 200, body: { fallback: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', {
        ...context,
        url: '/api/users',
      }, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should use fallback since match.url doesn't match
        expect(result.data.body).toEqual({ fallback: true });
      }
    });
  });

  describe('String strategy matching (contains, startsWith, endsWith)', () => {
    it('should match URL with contains strategy', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: { contains: '/users/' },
          },
          response: { status: 200, body: { contains: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ contains: true });
      }
    });

    it('should match URL with startsWith strategy', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: { startsWith: '/api/' },
          },
          response: { status: 200, body: { starts: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ starts: true });
      }
    });

    it('should match URL with endsWith strategy', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: { endsWith: '/123' },
          },
          response: { status: 200, body: { ends: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ ends: true });
      }
    });
  });

  describe('Native RegExp matching', () => {
    it('should match URL with native RegExp', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: /\/api\/users\/\d+/,
          },
          response: { status: 200, body: { regex: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ regex: true });
      }
    });

    it('should match URL with native RegExp and flags', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: /\/API\/USERS\/\d+/i,
          },
          response: { status: 200, body: { caseInsensitive: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ caseInsensitive: true });
      }
    });

    it('should not match when RegExp does not match', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: /\/api\/products\/\d+/,
          },
          response: { status: 200, body: { regex: true } },
        },
        {
          method: 'GET',
          url: '/api/users/123',
          response: { status: 200, body: { fallback: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ fallback: true });
      }
    });
  });

  describe('Serialized regex matching', () => {
    it('should match URL with serialized regex', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: { regex: { source: '/api/users/\\d+' } },
          },
          response: { status: 200, body: { serializedRegex: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ serializedRegex: true });
      }
    });

    it('should match URL with serialized regex and flags', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: { regex: { source: '/API/USERS/\\d+', flags: 'i' } },
          },
          response: { status: 200, body: { serializedCaseInsensitive: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', context, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ serializedCaseInsensitive: true });
      }
    });
  });

  describe('Specificity with URL matching', () => {
    it('should add +1 to specificity when match.url is present', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            headers: { 'x-user-tier': 'premium' },
          },
          response: { status: 200, body: { headerOnly: true } },
        },
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: '/api/users/123',
            headers: { 'x-user-tier': 'premium' },
          },
          response: { status: 200, body: { urlAndHeader: true } },
        },
      ];

      // Both match, but second is more specific (url + headers = 2)
      const result = selector.selectResponse('test-1', 'default', {
        ...context,
        headers: { 'x-user-tier': 'premium' },
      }, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ urlAndHeader: true });
      }
    });

    it('should prioritize URL match over body-only match', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'POST',
          url: '/api/products',
          match: {
            body: { tier: 'premium' },
          },
          response: { status: 200, body: { bodyOnly: true } },
        },
        {
          method: 'POST',
          url: '/api/products',
          match: {
            url: '/api/products',
            body: { tier: 'premium' },
          },
          response: { status: 200, body: { urlAndBody: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', {
        method: 'POST',
        url: '/api/products',
        body: { tier: 'premium' },
        headers: {},
        query: {},
      }, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ urlAndBody: true });
      }
    });
  });

  describe('Combined matching', () => {
    it('should match when both URL and headers match', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: { contains: '/users/' },
            headers: { 'x-user-tier': 'premium' },
          },
          response: { status: 200, body: { combined: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', {
        ...context,
        headers: { 'x-user-tier': 'premium' },
      }, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ combined: true });
      }
    });

    it('should not match when URL matches but header does not', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: { contains: '/users/' },
            headers: { 'x-user-tier': 'premium' },
          },
          response: { status: 200, body: { combined: true } },
        },
        {
          method: 'GET',
          url: '/api/users/123',
          response: { status: 200, body: { fallback: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', {
        ...context,
        headers: { 'x-user-tier': 'standard' },
      }, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ fallback: true });
      }
    });

    it('should not match when header matches but URL does not', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '/api/users/123',
          match: {
            url: { contains: '/products/' },
            headers: { 'x-user-tier': 'premium' },
          },
          response: { status: 200, body: { combined: true } },
        },
        {
          method: 'GET',
          url: '/api/users/123',
          response: { status: 200, body: { fallback: true } },
        },
      ];

      const result = selector.selectResponse('test-1', 'default', {
        ...context,
        headers: { 'x-user-tier': 'premium' },
      }, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toEqual({ fallback: true });
      }
    });
  });

  describe('MSW Weak Comparison Compatibility', () => {
    /**
     * MSW documentation states:
     * "Unlike paths, regular expressions use weak comparison, supporting partial matches.
     * When provided a regular expression, all request URLs that match that expression
     * will be captured, regardless of their origin."
     *
     * Example from MSW docs:
     * rest.delete(/\/posts\//, responseResolver)
     * // Matches:
     * // - DELETE http://localhost:8080/posts/
     * // - DELETE https://backend.dev/user/posts/
     *
     * These tests verify that Scenarist's response selector correctly handles
     * weak comparison semantics for URL matching.
     */

    it('should match RegExp patterns across different origins (weak comparison)', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'DELETE',
          url: '*',
          match: {
            url: /\/posts\//,
          },
          response: { status: 200, body: { matched: true } },
        },
      ];

      // Different origins, same path pattern - all should match (MSW behavior)
      const contexts = [
        {
          method: 'DELETE' as const,
          url: 'http://localhost:8080/posts/',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'DELETE' as const,
          url: 'https://backend.dev/user/posts/',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'DELETE' as const,
          url: 'https://api.example.com/posts/123',
          body: undefined,
          headers: {},
          query: {},
        },
      ];

      contexts.forEach(ctx => {
        const result = selector.selectResponse('test-1', 'default', ctx, mocks);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body).toEqual({ matched: true });
        }
      });
    });

    it('should match partial paths regardless of protocol', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '*',
          match: {
            url: /\/api\/v\d+\//,
          },
          response: { status: 200, body: { versioned: true } },
        },
      ];

      // Pattern matches substring, not full URL - origin-agnostic
      const contexts = [
        {
          method: 'GET' as const,
          url: 'http://localhost/api/v1/users',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'GET' as const,
          url: 'https://prod.example.com/api/v2/posts',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'GET' as const,
          url: 'http://staging.test.io/api/v3/data/123',
          body: undefined,
          headers: {},
          query: {},
        },
      ];

      contexts.forEach(ctx => {
        const result = selector.selectResponse('test-1', 'default', ctx, mocks);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body).toEqual({ versioned: true });
        }
      });
    });

    it('should match substring patterns in any part of URL', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '*',
          match: {
            url: /\/users\/\d+/,
          },
          response: { status: 200, body: { userPattern: true } },
        },
      ];

      // Pattern can match anywhere in the URL path
      const contexts = [
        {
          method: 'GET' as const,
          url: 'https://api.example.com/users/123',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'GET' as const,
          url: 'http://localhost/v1/users/456/profile',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'GET' as const,
          url: 'https://backend.dev/api/users/789/settings',
          body: undefined,
          headers: {},
          query: {},
        },
      ];

      contexts.forEach(ctx => {
        const result = selector.selectResponse('test-1', 'default', ctx, mocks);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body).toEqual({ userPattern: true });
        }
      });
    });

    it('should NOT match when pattern is not found in URL', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '*',
          match: {
            url: /\/products\/\d+/,
          },
          response: { status: 200, body: { productPattern: true } },
        },
        {
          method: 'GET',
          url: '*',
          response: { status: 200, body: { fallback: true } },
        },
      ];

      // Pattern must exist somewhere in the URL
      const contexts = [
        {
          method: 'GET' as const,
          url: 'https://api.example.com/users/123',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'GET' as const,
          url: 'http://localhost/posts/456',
          body: undefined,
          headers: {},
          query: {},
        },
      ];

      contexts.forEach(ctx => {
        const result = selector.selectResponse('test-1', 'default', ctx, mocks);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body).toEqual({ fallback: true });
        }
      });
    });

    it('should support weak comparison with query parameters', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '*',
          match: {
            url: /\/search\?/,
          },
          response: { status: 200, body: { searchPattern: true } },
        },
      ];

      // Pattern matches URLs with query params, any origin
      const contexts = [
        {
          method: 'GET' as const,
          url: 'http://localhost:3000/search?q=test',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'GET' as const,
          url: 'https://api.example.com/v1/search?filter=active',
          body: undefined,
          headers: {},
          query: {},
        },
      ];

      contexts.forEach(ctx => {
        const result = selector.selectResponse('test-1', 'default', ctx, mocks);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body).toEqual({ searchPattern: true });
        }
      });
    });

    it('should match case-insensitively when flag is set (weak + case-insensitive)', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '*',
          match: {
            url: /\/API\/USERS/i,
          },
          response: { status: 200, body: { caseInsensitiveWeak: true } },
        },
      ];

      // Weak comparison + case-insensitive flag
      const contexts = [
        {
          method: 'GET' as const,
          url: 'http://localhost/api/users/123',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'GET' as const,
          url: 'https://prod.example.com/v1/API/USERS',
          body: undefined,
          headers: {},
          query: {},
        },
        {
          method: 'GET' as const,
          url: 'https://backend.dev/Api/Users/data',
          body: undefined,
          headers: {},
          query: {},
        },
      ];

      contexts.forEach(ctx => {
        const result = selector.selectResponse('test-1', 'default', ctx, mocks);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.body).toEqual({ caseInsensitiveWeak: true });
        }
      });
    });

    it('should prioritize more specific match criteria with weak comparison', () => {
      const mocks: readonly ScenaristMock[] = [
        {
          method: 'GET',
          url: '*',
          match: {
            url: /\/api\/users/,  // Weak regex match (specificity = 101)
          },
          response: { status: 200, body: { urlOnly: true } },
        },
        {
          method: 'GET',
          url: '*',
          match: {
            url: /\/api\/users\/\d+/,  // More specific weak regex (specificity = 101)
            headers: { 'x-user-tier': 'premium' },  // + 1 = 102
          },
          response: { status: 200, body: { urlAndHeader: true } },
        },
      ];

      // Both mocks match the URL via weak comparison, but second has additional header criteria
      const result = selector.selectResponse('test-1', 'default', {
        method: 'GET',
        url: 'https://api.example.com/api/users/123',
        body: undefined,
        headers: { 'x-user-tier': 'premium' },
        query: {},
      }, mocks);

      expect(result.success).toBe(true);
      if (result.success) {
        // More specific match (URL + header = 102) wins over URL-only (101)
        expect(result.data.body).toEqual({ urlAndHeader: true });
      }
    });
  });
});
