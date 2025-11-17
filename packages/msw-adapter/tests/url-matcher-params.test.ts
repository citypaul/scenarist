import { describe, it, expect } from 'vitest';
import { matchesUrl } from '../src/matching/url-matcher.js';

/**
 * Comprehensive path parameter tests for MSW path-to-regexp v6 compatibility.
 *
 * MSW 2.x uses path-to-regexp@^6.3.0 for path parameter extraction.
 * These tests ensure our implementation matches MSW's behavior exactly.
 *
 * MSW documented param types (from https://mswjs.io/docs/http/intercepting-requests/path-parameters):
 * - :param - simple named parameter
 * - :param? - optional parameter
 * - :param+ - one or more segments (returns array)
 *
 * path-to-regexp v6 additional features (we test these for compatibility):
 * - :param* - zero or more segments
 * - :param(\\d+) - custom regex patterns
 * - Unnamed groups (filtered from results)
 */

describe('URL Matcher - Path Parameters (MSW v6 Compatibility)', () => {
  describe('Category A: Basic Param Extraction', () => {
    it('should extract simple param :id correctly', () => {
      const result = matchesUrl(
        '/users/:id',
        '/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '123' });
    });

    it('should extract multiple params :userId/:postId', () => {
      const result = matchesUrl(
        '/users/:userId/posts/:postId',
        '/users/alice/posts/42'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ userId: 'alice', postId: '42' });
    });

    it('should preserve case in param names', () => {
      const result = matchesUrl(
        '/users/:userId/posts/:postID',
        '/users/123/posts/456'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ userId: '123', postID: '456' });
    });

    it('should preserve case in param values', () => {
      const result = matchesUrl(
        '/users/:username',
        '/users/AliceBob'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ username: 'AliceBob' });
    });

    it('should handle special chars in values (@, ., -)', () => {
      const result = matchesUrl(
        '/users/:email',
        '/users/alice@example.com'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ email: 'alice@example.com' });
    });

    it('should keep numeric-only values as strings', () => {
      const result = matchesUrl(
        '/orders/:orderId',
        '/orders/12345'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ orderId: '12345' });
      expect(typeof result.params?.orderId).toBe('string');
    });

    it('should handle very long param values', () => {
      const longValue = 'a'.repeat(1000);
      const result = matchesUrl(
        '/data/:token',
        `/data/${longValue}`
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ token: longValue });
    });

    it('should decode URL-encoded values (%20 → space)', () => {
      const result = matchesUrl(
        '/search/:query',
        '/search/hello%20world'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ query: 'hello world' });
    });

    it('should decode special URL chars (%2F → /)', () => {
      const result = matchesUrl(
        '/files/:path',
        '/files/folder%2Ffile.txt'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ path: 'folder/file.txt' });
    });

    it('should decode unicode characters', () => {
      const result = matchesUrl(
        '/users/:name',
        '/users/%E4%BD%A0%E5%A5%BD' // "你好" in UTF-8
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ name: '你好' });
    });

    it('should handle plus signs in params', () => {
      const result = matchesUrl(
        '/search/:query',
        '/search/foo+bar'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ query: 'foo+bar' });
    });

    it('should handle trailing slash consistently', () => {
      const result1 = matchesUrl('/users/:id', '/users/123');
      const result2 = matchesUrl('/users/:id/', '/users/123/');

      expect(result1.matches).toBe(true);
      expect(result1.params).toEqual({ id: '123' });
      expect(result2.matches).toBe(true);
      expect(result2.params).toEqual({ id: '123' });
    });

    it('should extract params from different origins', () => {
      const result1 = matchesUrl(
        'http://localhost:3000/users/:id',
        'http://localhost:3000/users/123'
      );
      const result2 = matchesUrl(
        'https://api.example.com/users/:id',
        'https://api.example.com/users/456'
      );

      expect(result1.matches).toBe(true);
      expect(result1.params).toEqual({ id: '123' });
      expect(result2.matches).toBe(true);
      expect(result2.params).toEqual({ id: '456' });
    });

    it('should handle empty string param values', () => {
      // Note: path-to-regexp typically won't match empty segments
      // This tests the edge case where a param could theoretically be empty
      const result = matchesUrl(
        '/users/:id?/posts',
        '/users//posts'
      );

      // This might not match or might extract empty string depending on path-to-regexp behavior
      // We test to document actual behavior
      expect(result.matches).toBe(false); // Expected: path-to-regexp doesn't match empty segments
    });

    it('should extract params with underscores in names', () => {
      // path-to-regexp v6: Underscores are supported in param names
      // Hyphens are NOT supported (treated as delimiters)
      const result = matchesUrl(
        '/items/:item_id/sections/:section_name',
        '/items/123/sections/overview'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ item_id: '123', section_name: 'overview' });
    });
  });

  describe('Category B: Optional Parameters (:param?)', () => {
    it('should match :id? when param is present and extract value', () => {
      const result = matchesUrl(
        '/users/:id?',
        '/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '123' });
    });

    it('should match :id? when param is absent and omit from result', () => {
      const result = matchesUrl(
        '/users/:id?',
        '/users'
      );

      expect(result.matches).toBe(true);
      // MSW behavior: absent optional params are omitted, not undefined
      expect(result.params).toEqual({});
      expect(result.params).not.toHaveProperty('id');
    });

    it('should handle multiple optional params - all present', () => {
      const result = matchesUrl(
        '/posts/:year?/:month?/:day?',
        '/posts/2024/11/17'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ year: '2024', month: '11', day: '17' });
    });

    it('should handle multiple optional params - some present', () => {
      const result = matchesUrl(
        '/posts/:year?/:month?/:day?',
        '/posts/2024'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ year: '2024' });
      expect(result.params).not.toHaveProperty('month');
      expect(result.params).not.toHaveProperty('day');
    });

    it('should handle multiple optional params - all absent', () => {
      const result = matchesUrl(
        '/posts/:year?/:month?/:day?',
        '/posts'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({});
    });

    it('should handle optional param with custom regex :id(\\d+)?', () => {
      const result1 = matchesUrl(
        '/users/:id(\\d+)?',
        '/users/123'
      );
      const result2 = matchesUrl(
        '/users/:id(\\d+)?',
        '/users'
      );

      expect(result1.matches).toBe(true);
      expect(result1.params).toEqual({ id: '123' });
      expect(result2.matches).toBe(true);
      expect(result2.params).toEqual({});
    });

    it('should handle optional param at different positions in path', () => {
      const result1 = matchesUrl(
        '/users/:userId?/posts',
        '/users/123/posts'
      );
      const result2 = matchesUrl(
        '/users/:userId?/posts',
        '/users/posts'
      );

      expect(result1.matches).toBe(true);
      expect(result1.params).toEqual({ userId: '123' });
      expect(result2.matches).toBe(true);
      expect(result2.params).toEqual({});
    });

    it('should not include undefined for absent optional params', () => {
      const result = matchesUrl(
        '/items/:id?',
        '/items'
      );

      expect(result.matches).toBe(true);
      expect(result.params?.id).toBeUndefined();
      // But the key shouldn't exist in the object
      expect(Object.keys(result.params || {})).not.toContain('id');
    });
  });

  describe('Category C: Repeating Parameters (:param+)', () => {
    it('should match :path+ with single segment and return array', () => {
      const result = matchesUrl(
        '/files/:path+',
        '/files/document.txt'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ path: ['document.txt'] });
      expect(Array.isArray(result.params?.path)).toBe(true);
    });

    it('should match :path+ with multiple segments and return array', () => {
      const result = matchesUrl(
        '/files/:path+',
        '/files/folder/subfolder/document.txt'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ path: ['folder', 'subfolder', 'document.txt'] });
      expect(Array.isArray(result.params?.path)).toBe(true);
    });

    it('should preserve segment order in :path+ array', () => {
      const result = matchesUrl(
        '/files/:path+',
        '/files/a/b/c/d'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ path: ['a', 'b', 'c', 'd'] });
      expect(result.params?.path).toEqual(['a', 'b', 'c', 'd']); // Order matters
    });

    it('should fail to match :path+ when no segments present', () => {
      const result = matchesUrl(
        '/files/:path+',
        '/files'
      );

      // :path+ requires at least one segment
      expect(result.matches).toBe(false);
    });

    it('should handle :path* with zero segments (returns undefined or empty array)', () => {
      const result = matchesUrl(
        '/files/:path*',
        '/files'
      );

      expect(result.matches).toBe(true);
      // path-to-regexp v6 behavior: :path* with 0 segments returns undefined
      // NOT an empty array (that's a common misconception)
      expect(result.params?.path).toBeUndefined();
    });

    it('should handle :path* with multiple segments and return array', () => {
      const result = matchesUrl(
        '/files/:path*',
        '/files/folder/file.txt'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ path: ['folder', 'file.txt'] });
    });

    it('should handle multiple repeating params', () => {
      const result = matchesUrl(
        '/api/:version+/resources/:path+',
        '/api/v1/v2/resources/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({
        version: ['v1', 'v2'],
        path: ['users', '123']
      });
    });

    it('should handle repeating param with custom regex :id(\\d+)+', () => {
      const result = matchesUrl(
        '/numbers/:id(\\d+)+',
        '/numbers/1/22/333'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: ['1', '22', '333'] });
    });

    it('should decode each segment in :path+ array separately', () => {
      const result = matchesUrl(
        '/files/:path+',
        '/files/hello%20world/foo%2Fbar'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ path: ['hello world', 'foo/bar'] });
    });

    it('should handle :path+ with special characters in segments', () => {
      const result = matchesUrl(
        '/files/:path+',
        '/files/@types/node/index.d.ts'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ path: ['@types', 'node', 'index.d.ts'] });
    });
  });

  describe('Category D: Custom Regex Patterns', () => {
    it('should match :id(\\d+) with numeric value and extract', () => {
      const result = matchesUrl(
        '/users/:id(\\d+)',
        '/users/12345'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '12345' });
    });

    it('should NOT match :id(\\d+) with non-numeric value', () => {
      const result = matchesUrl(
        '/users/:id(\\d+)',
        '/users/alice'
      );

      expect(result.matches).toBe(false);
    });

    it('should match :id([a-f0-9]{8}) hex UUID pattern', () => {
      const result = matchesUrl(
        '/items/:id([a-f0-9]{8})',
        '/items/abc12345'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: 'abc12345' });
    });

    it('should match :year(\\d{4}) for 4-digit year', () => {
      const result1 = matchesUrl('/posts/:year(\\d{4})', '/posts/2024');
      const result2 = matchesUrl('/posts/:year(\\d{4})', '/posts/24');

      expect(result1.matches).toBe(true);
      expect(result1.params).toEqual({ year: '2024' });
      expect(result2.matches).toBe(false); // Only 2 digits
    });

    it('should handle complex regex with character classes', () => {
      const result = matchesUrl(
        '/slugs/:slug([a-z0-9-]+)',
        '/slugs/my-blog-post-123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ slug: 'my-blog-post-123' });
    });

    it('should reject values not matching custom regex', () => {
      // path-to-regexp v6: Custom regex [a-z0-9-]+ should reject uppercase
      // But test must use a URL that actually doesn't match (segment boundary issue)
      const result = matchesUrl(
        '/slugs/:slug([a-z0-9-]+)',
        '/slugs/invalid_chars!' // Contains underscore and exclamation (not in pattern)
      );

      expect(result.matches).toBe(false);
    });

    it('should handle multiple params with different custom regexes', () => {
      const result = matchesUrl(
        '/posts/:year(\\d{4})/:month(\\d{2})/:slug([a-z0-9-]+)',
        '/posts/2024/11/my-post'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({
        year: '2024',
        month: '11',
        slug: 'my-post'
      });
    });

    it('should handle custom regex with special chars escaped', () => {
      const result = matchesUrl(
        '/files/:name([a-z]+\\.txt)',
        '/files/document.txt'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ name: 'document.txt' });
    });
  });

  describe('Category E: Unnamed Groups & Filtering', () => {
    it('should match unnamed group (user|u)/:id and only return named param', () => {
      const result1 = matchesUrl(
        '/(user|u)/:id',
        '/user/123'
      );
      const result2 = matchesUrl(
        '/(user|u)/:id',
        '/u/123'
      );

      expect(result1.matches).toBe(true);
      expect(result1.params).toEqual({ id: '123' });
      // Unnamed group '0' should be filtered out
      expect(result1.params).not.toHaveProperty('0');

      expect(result2.matches).toBe(true);
      expect(result2.params).toEqual({ id: '123' });
      expect(result2.params).not.toHaveProperty('0');
    });

    it('should filter numeric keys from params (only named params returned)', () => {
      // Unnamed groups create numeric keys like '0', '1', etc.
      // We filter these out to match MSW behavior
      const result = matchesUrl(
        '/(api|v1)/(users|posts)/:id',
        '/api/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '123' });
      // Should NOT have '0' or '1' keys
      expect(Object.keys(result.params || {})).toEqual(['id']);
    });

    it('should handle mixed named and unnamed - only return named', () => {
      const result = matchesUrl(
        '/api/(v1|v2)/users/:userId/posts/(published|draft)/:postId',
        '/api/v1/users/alice/posts/published/42'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ userId: 'alice', postId: '42' });
      // No '0', '1' keys from unnamed groups
      expect(Object.keys(result.params || {}).sort()).toEqual(['postId', 'userId']);
    });

    it('should filter multiple unnamed groups', () => {
      const result = matchesUrl(
        '/(a|b)/(c|d)/(e|f)/:id',
        '/a/c/e/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '123' });
      expect(Object.keys(result.params || {})).toEqual(['id']);
    });

    it('should document that quoted param names are NOT supported in v6', () => {
      // path-to-regexp v6: Quoted param names like :"0" are NOT supported
      // This feature was added in v8
      // v6 throws: TypeError: Missing parameter name at 7

      // Test that we handle the error gracefully
      expect(() => {
        matchesUrl(
          '/items/:"0"',  // Quoted param name '0' (v8 syntax)
          '/items/value'
        );
      }).toThrow(/Missing parameter name/);
    });
  });

  describe('Category F: Edge Cases & Compatibility', () => {
    it('should handle params with dots in values (semantic versioning)', () => {
      const result = matchesUrl(
        '/packages/:version',
        '/packages/1.2.3'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ version: '1.2.3' });
    });

    it('should document that @ is a delimiter (stops param matching)', () => {
      // path-to-regexp v6: @ is a delimiter (like /)
      // :name will match up to the @, then fail because pattern expects end
      // To match @scope/package, you need :scope/:package or a wildcard
      const result = matchesUrl(
        '/packages/:name',
        '/packages/@scope/package'
      );

      // Expected: doesn't match (@ is delimiter, pattern expects end after :name)
      expect(result.matches).toBe(false);
    });

    it('should handle params with @ using explicit pattern', () => {
      // To match @scope/package, use repeating param :parts+
      const result = matchesUrl(
        '/packages/:parts+',
        '/packages/@scope/package'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ parts: ['@scope', 'package'] });
    });

    it('should handle params at end of path without trailing slash', () => {
      const result = matchesUrl(
        '/users/:id',
        '/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '123' });
    });

    it('should handle params at end of path with trailing slash', () => {
      const result = matchesUrl(
        '/users/:id/',
        '/users/123/'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '123' });
    });

    it('should document that consecutive params require separators', () => {
      // path-to-regexp v6 requirement: Must have text between two parameters
      // Throws: TypeError: Must have text between two parameters, missing text after "id"

      expect(() => {
        matchesUrl(
          '/items/:id:name', // Invalid: no separator between :id and :name
          '/items/123abc'
        );
      }).toThrow(/Must have text between two parameters/);
    });

    it('should preserve exact param extraction across different delimiters', () => {
      const result = matchesUrl(
        '/files/:path+',
        '/files/folder/sub.folder/file-name_v2.txt'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ path: ['folder', 'sub.folder', 'file-name_v2.txt'] });
    });

    it('should handle very deeply nested paths', () => {
      const result = matchesUrl(
        '/a/:b/c/:d/e/:f/g/:h',
        '/a/1/c/2/e/3/g/4'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ b: '1', d: '2', f: '3', h: '4' });
    });

    it('should handle param extraction from pathname-only URLs', () => {
      const result = matchesUrl(
        '/users/:userId/posts/:postId',
        '/users/alice/posts/42'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ userId: 'alice', postId: '42' });
    });

    it('should handle param extraction from full URLs with protocol and origin', () => {
      const result = matchesUrl(
        'https://api.example.com/users/:id',
        'https://api.example.com/users/123'
      );

      expect(result.matches).toBe(true);
      expect(result.params).toEqual({ id: '123' });
    });

    it('should handle mixed required and optional params', () => {
      const result1 = matchesUrl(
        '/posts/:year/:month?',
        '/posts/2024/11'
      );
      const result2 = matchesUrl(
        '/posts/:year/:month?',
        '/posts/2024'
      );

      expect(result1.matches).toBe(true);
      expect(result1.params).toEqual({ year: '2024', month: '11' });
      expect(result2.matches).toBe(true);
      expect(result2.params).toEqual({ year: '2024' });
    });
  });
});
