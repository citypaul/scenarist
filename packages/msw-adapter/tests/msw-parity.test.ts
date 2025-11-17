import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { matchesUrl } from '../src/matching/url-matcher.js';

/**
 * MSW Parity Tests - CRITICAL PROOF OF COMPATIBILITY
 *
 * These tests prove that our path parameter extraction matches MSW's actual behavior.
 *
 * Strategy:
 * 1. Set up real MSW server with handler
 * 2. Make real HTTP request
 * 3. Capture params MSW extracts
 * 4. Compare to our extraction
 * 5. Assert EXACT equality
 *
 * This is the ONLY way to prove we're compatible with MSW.
 * If these tests pass, we have proof. If they fail, we have a bug.
 */

describe('MSW Parity: Path Parameter Extraction', () => {
  let server: ReturnType<typeof setupServer>;
  let capturedMSWParams: any;

  beforeAll(() => {
    // Suppress MSW console output during tests
    server = setupServer();
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
    capturedMSWParams = undefined;
  });

  afterAll(() => {
    server.close();
  });

  /**
   * Helper to capture params from MSW handler
   */
  const setupMSWHandler = (pattern: string) => {
    server.use(
      http.get(pattern, ({ params }) => {
        capturedMSWParams = params;
        return HttpResponse.json({ ok: true });
      })
    );
  };

  /**
   * Helper to make request and compare params
   */
  const testParamParity = async (
    pattern: string,
    requestPath: string,
    description: string
  ) => {
    // Setup MSW handler with full URL pattern
    const fullPattern = `http://localhost${pattern}`;
    setupMSWHandler(fullPattern);

    // Make real request to MSW with full URL
    const fullUrl = `http://localhost${requestPath}`;
    await fetch(fullUrl);

    // Extract with our implementation (using pattern as-is)
    const ourResult = matchesUrl(pattern, requestPath);

    // PROOF: Our params must match MSW's params EXACTLY
    expect(ourResult.params).toEqual(capturedMSWParams);
  };

  describe('Category A: Simple Parameters', () => {
    it('should extract single param :id identically to MSW', async () => {
      await testParamParity(
        '/users/:id',
        '/users/123',
        'single param'
      );
    });

    it('should extract multiple params :userId/:postId identically to MSW', async () => {
      await testParamParity(
        '/users/:userId/posts/:postId',
        '/users/alice/posts/42',
        'multiple params'
      );
    });

    it('should extract params with underscores :user_id identically to MSW', async () => {
      await testParamParity(
        '/items/:item_id',
        '/items/item-123',
        'param with underscore'
      );
    });

    it('should preserve case in param names :userId vs :userid', async () => {
      await testParamParity(
        '/users/:userId/posts/:postID',
        '/users/alice/posts/42',
        'case-sensitive param names'
      );
    });

    it('should preserve case in param values', async () => {
      await testParamParity(
        '/users/:username',
        '/users/AliceBob',
        'case-sensitive param values'
      );
    });

    it('should extract params from pathname-only URLs', async () => {
      // MSW can match pathname-only patterns against full URLs
      setupMSWHandler('/users/:id');
      await fetch('http://localhost:3000/users/123');
      const ourResult = matchesUrl('/users/:id', 'http://localhost:3000/users/123');
      expect(ourResult.params).toEqual(capturedMSWParams);
    });

    it('should extract params from full URL patterns', async () => {
      await testParamParity(
        'http://localhost:3000/users/:id',
        'http://localhost:3000/users/456',
        'full URL pattern'
      );
    });

    it('should handle numeric-only param values as strings', async () => {
      await testParamParity(
        '/orders/:orderId',
        'http://localhost:3000/orders/12345',
        'numeric param value'
      );
    });

    it('should handle params with dots (semantic versioning)', async () => {
      await testParamParity(
        '/packages/:version',
        'http://localhost:3000/packages/1.2.3',
        'param with dots'
      );
    });

    it('should handle very long param values', async () => {
      const longValue = 'a'.repeat(500);
      await testParamParity(
        '/data/:token',
        `http://localhost:3000/data/${longValue}`,
        'very long param'
      );
    });
  });

  describe('Category B: Optional Parameters (:param?)', () => {
    it('should extract optional param when present', async () => {
      await testParamParity(
        '/users/:id?',
        'http://localhost:3000/users/123',
        'optional param present'
      );
    });

    it('should omit optional param when absent (NOT undefined)', async () => {
      await testParamParity(
        '/users/:id?',
        'http://localhost:3000/users',
        'optional param absent'
      );

      // CRITICAL: MSW omits the key entirely, doesn't set to undefined
      expect(capturedMSWParams).not.toHaveProperty('id');
      expect(capturedMSWParams?.id).toBeUndefined();
    });

    it('should handle multiple optional params - all present', async () => {
      await testParamParity(
        '/posts/:year?/:month?/:day?',
        'http://localhost:3000/posts/2024/11/17',
        'multiple optional - all present'
      );
    });

    it('should handle multiple optional params - some present', async () => {
      await testParamParity(
        '/posts/:year?/:month?/:day?',
        'http://localhost:3000/posts/2024',
        'multiple optional - some present'
      );
    });

    it('should handle multiple optional params - all absent', async () => {
      await testParamParity(
        '/posts/:year?/:month?/:day?',
        'http://localhost:3000/posts',
        'multiple optional - all absent'
      );
    });

    it('should handle optional param with custom regex', async () => {
      await testParamParity(
        '/users/:id(\\d+)?',
        'http://localhost:3000/users/123',
        'optional param with regex present'
      );
    });

    it('should handle optional param with custom regex when absent', async () => {
      await testParamParity(
        '/users/:id(\\d+)?',
        'http://localhost:3000/users',
        'optional param with regex absent'
      );
    });

    it('should handle mixed required and optional params', async () => {
      await testParamParity(
        '/posts/:year/:month?',
        'http://localhost:3000/posts/2024/11',
        'mixed required and optional'
      );
    });
  });

  describe('Category C: Repeating Parameters (:param+, :param*)', () => {
    it('should extract :path+ with single segment as array', async () => {
      await testParamParity(
        '/files/:path+',
        'http://localhost:3000/files/document.txt',
        'single segment repeating'
      );

      // CRITICAL: MSW returns array even for single segment
      expect(Array.isArray(capturedMSWParams?.path)).toBe(true);
      expect(capturedMSWParams?.path).toHaveLength(1);
    });

    it('should extract :path+ with multiple segments as array', async () => {
      await testParamParity(
        '/files/:path+',
        'http://localhost:3000/files/folder/subfolder/document.txt',
        'multiple segments repeating'
      );

      expect(Array.isArray(capturedMSWParams?.path)).toBe(true);
      expect(capturedMSWParams?.path?.length).toBeGreaterThan(1);
    });

    it('should preserve segment order in :path+ array', async () => {
      await testParamParity(
        '/files/:path+',
        'http://localhost:3000/files/a/b/c/d',
        'segment order preservation'
      );

      expect(capturedMSWParams?.path).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should handle :path* with zero segments', async () => {
      await testParamParity(
        '/files/:path*',
        'http://localhost:3000/files',
        'zero segments with asterisk'
      );

      // Document actual MSW behavior: undefined or empty array?
    });

    it('should handle :path* with multiple segments as array', async () => {
      await testParamParity(
        '/files/:path*',
        'http://localhost:3000/files/folder/file.txt',
        'multiple segments with asterisk'
      );

      expect(Array.isArray(capturedMSWParams?.path)).toBe(true);
    });

    it('should handle multiple repeating params', async () => {
      await testParamParity(
        '/api/:version+/resources/:path+',
        'http://localhost:3000/api/v1/v2/resources/users/123',
        'multiple repeating params'
      );

      expect(Array.isArray(capturedMSWParams?.version)).toBe(true);
      expect(Array.isArray(capturedMSWParams?.path)).toBe(true);
    });

    it('should decode each segment in :path+ array separately', async () => {
      await testParamParity(
        '/files/:path+',
        'http://localhost:3000/files/hello%20world/foo%2Fbar',
        'URL-encoded segments'
      );

      // Each segment should be decoded independently
      expect(capturedMSWParams?.path).toContain('hello world');
      expect(capturedMSWParams?.path).toContain('foo/bar');
    });

    it('should handle :path+ with special characters in segments', async () => {
      await testParamParity(
        '/files/:path+',
        'http://localhost:3000/files/@types/node/index.d.ts',
        'special chars in segments'
      );
    });
  });

  describe('Category D: Custom Regex Patterns', () => {
    it('should extract :id(\\d+) numeric param identically to MSW', async () => {
      await testParamParity(
        '/users/:id(\\d+)',
        'http://localhost:3000/users/12345',
        'numeric custom regex'
      );
    });

    it('should NOT match :id(\\d+) with non-numeric value (MSW behavior)', async () => {
      setupMSWHandler('/users/:id(\\d+)');

      // MSW should not match this
      const response = await fetch('http://localhost:3000/users/alice');

      // Our implementation should also not match
      const ourResult = matchesUrl('/users/:id(\\d+)', 'http://localhost:3000/users/alice');

      // Both should not match
      expect(ourResult.matches).toBe(false);
      expect(capturedMSWParams).toBeUndefined(); // MSW didn't call handler
    });

    it('should extract :year(\\d{4}) for 4-digit year', async () => {
      await testParamParity(
        '/posts/:year(\\d{4})',
        'http://localhost:3000/posts/2024',
        '4-digit year regex'
      );
    });

    it('should extract :slug([a-z0-9-]+) with character class', async () => {
      await testParamParity(
        '/slugs/:slug([a-z0-9-]+)',
        'http://localhost:3000/slugs/my-blog-post-123',
        'character class regex'
      );
    });

    it('should handle multiple params with different custom regexes', async () => {
      await testParamParity(
        '/posts/:year(\\d{4})/:month(\\d{2})/:slug([a-z0-9-]+)',
        'http://localhost:3000/posts/2024/11/my-post',
        'multiple custom regexes'
      );
    });

    it('should handle repeating param with custom regex :id(\\d+)+', async () => {
      await testParamParity(
        '/numbers/:id(\\d+)+',
        'http://localhost:3000/numbers/1/22/333',
        'repeating with custom regex'
      );

      expect(Array.isArray(capturedMSWParams?.id)).toBe(true);
    });
  });

  describe('Category E: Edge Cases & URL Encoding', () => {
    it('should decode %20 to space identically to MSW', async () => {
      await testParamParity(
        '/search/:query',
        'http://localhost:3000/search/hello%20world',
        'space encoding'
      );

      expect(capturedMSWParams?.query).toBe('hello world');
    });

    it('should decode %2F to forward slash identically to MSW', async () => {
      await testParamParity(
        '/files/:path',
        'http://localhost:3000/files/folder%2Ffile.txt',
        'forward slash encoding'
      );

      expect(capturedMSWParams?.path).toBe('folder/file.txt');
    });

    it('should decode Unicode characters identically to MSW', async () => {
      await testParamParity(
        '/users/:name',
        'http://localhost:3000/users/%E4%BD%A0%E5%A5%BD', // "你好"
        'unicode encoding'
      );

      expect(capturedMSWParams?.name).toBe('你好');
    });

    it('should handle plus signs in params', async () => {
      await testParamParity(
        '/search/:query',
        'http://localhost:3000/search/foo+bar',
        'plus sign handling'
      );
    });

    it('should handle params with @ symbols in repeating params', async () => {
      // @ is a delimiter, so use :parts+ to capture it
      await testParamParity(
        '/packages/:parts+',
        'http://localhost:3000/packages/@scope/package',
        '@ symbol in repeating param'
      );

      expect(capturedMSWParams?.parts).toContain('@scope');
      expect(capturedMSWParams?.parts).toContain('package');
    });

    it('should handle trailing slash consistently', async () => {
      await testParamParity(
        '/users/:id/',
        'http://localhost:3000/users/123/',
        'trailing slash'
      );
    });

    it('should handle deeply nested paths', async () => {
      await testParamParity(
        '/a/:b/c/:d/e/:f/g/:h',
        'http://localhost:3000/a/1/c/2/e/3/g/4',
        'deeply nested params'
      );
    });

    it('should handle params with dots and hyphens in values', async () => {
      await testParamParity(
        '/files/:name',
        'http://localhost:3000/files/my-file.v2.txt',
        'dots and hyphens'
      );
    });
  });

  describe('Category F: Unnamed Groups & Filtering', () => {
    it('should filter unnamed group (user|u) and return only named params', async () => {
      await testParamParity(
        '/(user|u)/:id',
        'http://localhost:3000/user/123',
        'unnamed group filtering'
      );

      // CRITICAL: MSW should NOT expose numeric key '0' for unnamed group
      expect(capturedMSWParams).toHaveProperty('id');
      expect(capturedMSWParams).not.toHaveProperty('0');
      expect(Object.keys(capturedMSWParams || {})).toEqual(['id']);
    });

    it('should filter multiple unnamed groups', async () => {
      await testParamParity(
        '/(api|v1)/(users|posts)/:id',
        'http://localhost:3000/api/users/123',
        'multiple unnamed groups'
      );

      // Should only have 'id', no '0' or '1'
      expect(Object.keys(capturedMSWParams || {})).toEqual(['id']);
    });

    it('should handle mixed named and unnamed groups correctly', async () => {
      await testParamParity(
        '/api/(v1|v2)/users/:userId/posts/(published|draft)/:postId',
        'http://localhost:3000/api/v1/users/alice/posts/published/42',
        'mixed named and unnamed'
      );

      // Should only have named params, no numeric keys
      const keys = Object.keys(capturedMSWParams || {}).sort();
      expect(keys).toEqual(['postId', 'userId']);
    });
  });
});
