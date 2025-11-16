import { describe, it, expect } from 'vitest';
import { matchesUrl } from '../src/matching/url-matcher.js';

describe('URL Matcher', () => {
  describe('Exact string matching', () => {
    it('should return true for exact match', () => {
      const result = matchesUrl(
        'https://api.example.com/users',
        'https://api.example.com/users'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it('should return false for different URL', () => {
      const result = matchesUrl(
        'https://api.example.com/users',
        'https://api.example.com/posts'
      );

      expect(result.matches).toBe(false);
      expect(result.params).toBeUndefined();
    });
  });

  describe('Glob patterns', () => {
    it('should match */users with any domain', () => {
      const result = matchesUrl(
        '*/users',
        'https://api.example.com/users'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it('should match */users/* with any domain and user ID', () => {
      const result = matchesUrl(
        '*/users/*',
        'https://api.example.com/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it('should not match when pattern differs', () => {
      const result = matchesUrl(
        '*/users',
        'https://api.example.com/posts'
      );

      expect(result.matches).toBe(false);
      expect(result.params).toBeUndefined();
    });
  });

  describe('Path parameters', () => {
    it('should match /users/:id pattern and extract parameter', () => {
      const result = matchesUrl(
        'https://api.example.com/users/:id',
        'https://api.example.com/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '123' });
    });

    it('should match multiple path parameters', () => {
      const result = matchesUrl(
        'https://api.example.com/users/:userId/posts/:postId',
        'https://api.example.com/users/123/posts/456'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ userId: '123', postId: '456' });
    });

    it('should not match when extra segments present', () => {
      const result = matchesUrl(
        'https://api.example.com/users/:id',
        'https://api.example.com/users/123/posts'
      );

      expect(result.matches).toBe(false);
    });

    it('should not match when pattern without params does not match', () => {
      const result = matchesUrl(
        'https://api.example.com/users/:id',
        'https://api.example.com/posts/123'
      );

      expect(result.matches).toBe(false);
    });

    it('should handle path-only patterns (no full URL)', () => {
      const result = matchesUrl(
        '/users/:id',
        '/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '123' });
    });
  });

  describe('Native RegExp patterns', () => {
    it('should match URL with native RegExp', () => {
      const result = matchesUrl(
        /\/api\/users\/\d+/,
        'https://api.example.com/api/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it('should match URL with native RegExp and flags (case-insensitive)', () => {
      const result = matchesUrl(
        /\/API\/USERS\/\d+/i,
        'https://api.example.com/api/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it('should not match when RegExp does not match', () => {
      const result = matchesUrl(
        /\/api\/products\/\d+/,
        'https://api.example.com/api/users/123'
      );

      expect(result.matches).toBe(false);
      expect(result.params).toBeUndefined();
    });

    it('should match pathname-only URLs with native RegExp', () => {
      const result = matchesUrl(
        /^\/users\/\d+$/,
        '/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });

    it('should match full URL patterns with protocol', () => {
      const result = matchesUrl(
        /^https:\/\/api\.example\.com\/users\/\d+$/,
        'https://api.example.com/users/456'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toBeUndefined();
    });
  });
});
