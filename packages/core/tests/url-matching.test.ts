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
});
