import { describe, it, expect } from 'vitest';
import {
  MatchValueSchema,
  ScenaristMatchSchema,
  ScenaristMockSchema,
} from '../../src/schemas/scenario-definition.js';

describe('URL Matching Schema Validation', () => {
  describe('MatchValueSchema with native RegExp', () => {
    it('should accept native RegExp', () => {
      const result = MatchValueSchema.safeParse(/\/users\/\d+/);
      expect(result.success).toBe(true);
    });

    it('should accept native RegExp with flags', () => {
      const result = MatchValueSchema.safeParse(/\/api\/v[12]/i);
      expect(result.success).toBe(true);
    });

    it('should accept serialized regex form (backward compatible)', () => {
      const result = MatchValueSchema.safeParse({
        regex: { source: '/users/\\d+', flags: 'i' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ScenaristMatchSchema with url field', () => {
    it('should accept url field with string value', () => {
      const result = ScenaristMatchSchema.safeParse({
        url: '/api/products',
      });
      expect(result.success).toBe(true);
    });

    it('should accept url field with native RegExp', () => {
      const result = ScenaristMatchSchema.safeParse({
        url: /\/api\/v\d+/,
      });
      expect(result.success).toBe(true);
    });

    it('should accept url field with string strategy', () => {
      const result = ScenaristMatchSchema.safeParse({
        url: { contains: '/api/' },
      });
      expect(result.success).toBe(true);
    });

    it('should accept url field with serialized regex', () => {
      const result = ScenaristMatchSchema.safeParse({
        url: { regex: { source: '/users/\\d+' } },
      });
      expect(result.success).toBe(true);
    });

    it('should accept match criteria with multiple fields including url', () => {
      const result = ScenaristMatchSchema.safeParse({
        url: { contains: '/api/' },
        headers: { 'x-user-tier': 'premium' },
        query: { filter: 'active' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ScenaristMockSchema enforcement rules', () => {
    it('should accept mock with match.url and url field', () => {
      const result = ScenaristMockSchema.safeParse({
        method: 'GET',
        url: '/api/products',
        match: {
          url: { contains: '/premium' },
        },
        response: { status: 200, body: {} },
      });
      expect(result.success).toBe(true);
    });

    it('should accept mock with match.url and url: "*"', () => {
      const result = ScenaristMockSchema.safeParse({
        method: 'GET',
        url: '*',
        match: {
          url: { contains: '/api/' },
        },
        response: { status: 200, body: {} },
      });
      expect(result.success).toBe(true);
    });

    it('should reject mock with match.url but no url field', () => {
      const result = ScenaristMockSchema.safeParse({
        method: 'GET',
        match: {
          url: { contains: '/api/' },
        },
        response: { status: 200, body: {} },
      });
      // url field is required by schema - mock without url is invalid
      expect(result.success).toBe(false);
    });
  });

  describe('UrlPatternSchema with native RegExp', () => {
    it('should accept string URL patterns', () => {
      const result = ScenaristMockSchema.safeParse({
        method: 'GET',
        url: '/api/products',
        response: { status: 200, body: {} },
      });
      expect(result.success).toBe(true);
    });

    it('should accept native RegExp URL patterns', () => {
      const result = ScenaristMockSchema.safeParse({
        method: 'GET',
        url: /\/api\/v\d+\/products/,
        response: { status: 200, body: {} },
      });
      expect(result.success).toBe(true);
    });

    it('should accept path param patterns', () => {
      const result = ScenaristMockSchema.safeParse({
        method: 'GET',
        url: '/users/:id',
        response: { status: 200, body: {} },
      });
      expect(result.success).toBe(true);
    });

    it('should accept wildcard pattern', () => {
      const result = ScenaristMockSchema.safeParse({
        method: 'GET',
        url: '*',
        response: { status: 200, body: {} },
      });
      expect(result.success).toBe(true);
    });
  });
});
