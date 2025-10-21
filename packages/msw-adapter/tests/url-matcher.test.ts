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
});
