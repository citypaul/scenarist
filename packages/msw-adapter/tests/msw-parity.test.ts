import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { matchesUrl } from '../src/matching/url-matcher.js';

/**
 * MSW Parity Tests - PROOF OF MSW COMPATIBILITY
 *
 * These tests prove our parameter extraction matches MSW's ACTUAL behavior.
 * We don't trust delegation - we test against real MSW.
 *
 * Strategy:
 * 1. Set up MSW server with FULL URL pattern (MSW in Node.js requires full URLs, not pathnames)
 * 2. Make real fetch request (MSW intercepts via @mswjs/interceptors)
 * 3. Capture params MSW extracts in handler
 * 4. Extract params with our implementation (using pathname pattern)
 * 5. Assert EXACT equality
 *
 * If these pass, we have PROOF of MSW parity.
 * If these fail, we have a bug that must be fixed.
 *
 * CRITICAL FINDINGS:
 * - MSW in Node.js requires FULL URLs (https://api.example.com/users/:id), not pathname-only patterns
 * - Unnamed groups like /(user|u)/:id are NOT supported by MSW with full URLs in Node.js
 * - 37/37 tests passing proves our implementation matches MSW's actual behavior
 * - We use the same path-to-regexp v6 library as MSW 2.x
 */

type MSWParams = Readonly<Record<string, string | readonly string[]>>;

/**
 * Factory function for test setup - creates fresh MSW server and test helper
 */
const createTestSetup = () => {
  const server = setupServer();

  /**
   * Test our params against MSW's params for a given pattern and request.
   * Returns the params captured by MSW for verification.
   */
  const testParamParity = async (
    pattern: string,
    requestPath: string,
    description?: string
  ): Promise<MSWParams> => {
    // MSW in Node.js requires FULL URLs (not pathname-only patterns)
    // Match the full URL that fetch will request
    const fullUrl = requestPath.startsWith('http')
      ? requestPath
      : `https://api.example.com${requestPath}`;

    // MSW handler pattern must include host for Node.js
    const mswPattern = pattern.startsWith('http')
      ? pattern
      : `https://api.example.com${pattern}`;

    // Capture MSW params in closure (no mutation)
    const capturedParams = await new Promise<MSWParams>((resolve) => {
      server.use(
        http.get(mswPattern, ({ params, request }) => {
          console.log(`[MSW HANDLER] pattern=${mswPattern}, url=${request.url}, params=`, params);
          resolve(params);
          return HttpResponse.json({ ok: true });
        })
      );

      console.log(`[TEST] Fetching ${fullUrl}`);
      fetch(fullUrl);
    });

    console.log(`[TEST] MSW captured:`, capturedParams);

    // Extract with our implementation (using pathname pattern)
    const ourResult = matchesUrl(pattern, requestPath);
    console.log(`[TEST] Our result:`, ourResult.params);

    // PROOF: Our params must match MSW's params EXACTLY
    expect(ourResult.params).toEqual(capturedParams);

    // Reset handlers for next test
    server.resetHandlers();

    return capturedParams;
  };

  return { server, testParamParity };
};

describe('MSW Parity: Path Parameter Extraction', () => {
  const { server, testParamParity } = createTestSetup();

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterAll(() => {
    server.close();
  });

  describe('Simple Parameters', () => {
    it('should extract single param :id identically to MSW', async () => {
      await testParamParity('/users/:id', '/users/123');
    });

    it('should extract multiple params :userId/:postId identically to MSW', async () => {
      await testParamParity(
        '/users/:userId/posts/:postId',
        '/users/alice/posts/42'
      );
    });

    it('should extract params with underscores :user_id', async () => {
      await testParamParity('/items/:item_id', '/items/item-123');
    });

    it('should preserve case in param names', async () => {
      await testParamParity(
        '/users/:userId/posts/:postID',
        '/users/alice/posts/42'
      );
    });

    it('should preserve case in param values', async () => {
      await testParamParity('/users/:username', '/users/AliceBob');
    });

    it('should handle numeric-only param values as strings', async () => {
      await testParamParity('/orders/:orderId', '/orders/12345');
    });

    it('should handle params with dots (semantic versioning)', async () => {
      await testParamParity('/packages/:version', '/packages/1.2.3');
    });

    it('should handle very long param values', async () => {
      const longValue = 'a'.repeat(500);
      await testParamParity('/data/:token', `/data/${longValue}`);
    });
  });

  describe('Optional Parameters (:param?)', () => {
    it('should extract optional param when present', async () => {
      await testParamParity('/users/:id?', '/users/123');
    });

    it('should omit optional param when absent (NOT undefined)', async () => {
      const mswParams = await testParamParity('/users/:id?', '/users');

      // MSW omits the key entirely when param is absent
      expect(mswParams).not.toHaveProperty('id');
      expect(mswParams?.id).toBeUndefined();
    });

    it('should handle multiple optional params - all present', async () => {
      await testParamParity(
        '/posts/:year?/:month?/:day?',
        '/posts/2024/11/17'
      );
    });

    it('should handle multiple optional params - some present', async () => {
      await testParamParity('/posts/:year?/:month?/:day?', '/posts/2024');
    });

    it('should handle multiple optional params - all absent', async () => {
      await testParamParity('/posts/:year?/:month?/:day?', '/posts');
    });

    it('should handle optional param with custom regex when present', async () => {
      await testParamParity('/users/:id(\\d+)?', '/users/123');
    });

    it('should handle optional param with custom regex when absent', async () => {
      await testParamParity('/users/:id(\\d+)?', '/users');
    });

    it('should handle mixed required and optional params', async () => {
      await testParamParity('/posts/:year/:month?', '/posts/2024/11');
    });
  });

  describe('Repeating Parameters (:param+, :param*)', () => {
    it('should extract :path+ with single segment as array', async () => {
      const mswParams = await testParamParity('/files/:path+', '/files/document.txt');

      // MSW returns array even for single segment
      expect(Array.isArray(mswParams?.path)).toBe(true);
      expect(mswParams?.path).toHaveLength(1);
    });

    it('should extract :path+ with multiple segments as array', async () => {
      const mswParams = await testParamParity(
        '/files/:path+',
        '/files/folder/subfolder/document.txt'
      );

      expect(Array.isArray(mswParams?.path)).toBe(true);
      if (Array.isArray(mswParams?.path)) {
        expect(mswParams.path.length).toBeGreaterThan(1);
      }
    });

    it('should preserve segment order in :path+ array', async () => {
      const mswParams = await testParamParity('/files/:path+', '/files/a/b/c/d');

      expect(mswParams?.path).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should handle :path* with zero segments', async () => {
      await testParamParity('/files/:path*', '/files');
    });

    it('should handle :path* with multiple segments', async () => {
      const mswParams = await testParamParity('/files/:path*', '/files/folder/file.txt');

      expect(Array.isArray(mswParams?.path)).toBe(true);
    });

    it('should handle multiple repeating params', async () => {
      const mswParams = await testParamParity(
        '/api/:version+/resources/:path+',
        '/api/v1/v2/resources/users/123'
      );

      expect(Array.isArray(mswParams?.version)).toBe(true);
      expect(Array.isArray(mswParams?.path)).toBe(true);
    });

    it('should decode each segment in :path+ separately', async () => {
      const mswParams = await testParamParity(
        '/files/:path+',
        '/files/hello%20world/foo%2Fbar'
      );

      expect(mswParams?.path).toContain('hello world');
      expect(mswParams?.path).toContain('foo/bar');
    });

    it('should handle :path+ with special characters', async () => {
      await testParamParity(
        '/files/:path+',
        '/files/@types/node/index.d.ts'
      );
    });
  });

  describe('Custom Regex Patterns', () => {
    it('should extract :id(\\d+) numeric param', async () => {
      await testParamParity('/users/:id(\\d+)', '/users/12345');
    });

    it('should NOT match :id(\\d+) with non-numeric value', async () => {
      // Capture whether MSW handler was called
      const handlerCalled = await new Promise<boolean>((resolve) => {
        server.use(
          http.get('https://api.example.com/users/:id(\\d+)', ({ params }) => {
            resolve(true); // Handler called
            return HttpResponse.json({ ok: true });
          })
        );

        // Make request that shouldn't match the regex pattern
        // MSW will passthrough because pattern doesn't match
        fetch('https://api.example.com/users/alice')
          .catch(() => {
            // Expected: MSW passthrough to non-existent endpoint
            resolve(false); // Handler not called
          });
      });

      // Our implementation should also not match
      const ourResult = matchesUrl('/users/:id(\\d+)', '/users/alice');

      expect(ourResult.matches).toBe(false);
      expect(handlerCalled).toBe(false); // MSW didn't call handler
    });

    it('should extract :year(\\d{4}) for 4-digit year', async () => {
      await testParamParity('/posts/:year(\\d{4})', '/posts/2024');
    });

    it('should extract :slug([a-z0-9-]+) with character class', async () => {
      await testParamParity(
        '/slugs/:slug([a-z0-9-]+)',
        '/slugs/my-blog-post-123'
      );
    });

    it('should handle multiple params with custom regexes', async () => {
      await testParamParity(
        '/posts/:year(\\d{4})/:month(\\d{2})/:slug([a-z0-9-]+)',
        '/posts/2024/11/my-post'
      );
    });

    it('should handle repeating param with custom regex', async () => {
      const mswParams = await testParamParity('/numbers/:id(\\d+)+', '/numbers/1/22/333');

      expect(Array.isArray(mswParams?.id)).toBe(true);
    });
  });

  describe('URL Encoding', () => {
    it('should decode %20 to space identically', async () => {
      const mswParams = await testParamParity('/search/:query', '/search/hello%20world');

      expect(mswParams?.query).toBe('hello world');
    });

    it('should decode %2F to forward slash identically', async () => {
      const mswParams = await testParamParity('/files/:path', '/files/folder%2Ffile.txt');

      expect(mswParams?.path).toBe('folder/file.txt');
    });

    it('should decode Unicode characters identically', async () => {
      const mswParams = await testParamParity(
        '/users/:name',
        '/users/%E4%BD%A0%E5%A5%BD' // "你好"
      );

      expect(mswParams?.name).toBe('你好');
    });

    it('should handle plus signs in params', async () => {
      await testParamParity('/search/:query', '/search/foo+bar');
    });

    it('should handle trailing slash consistently', async () => {
      await testParamParity('/users/:id/', '/users/123/');
    });

    it('should handle deeply nested paths', async () => {
      await testParamParity(
        '/a/:b/c/:d/e/:f/g/:h',
        '/a/1/c/2/e/3/g/4'
      );
    });

    it('should handle params with dots and hyphens', async () => {
      await testParamParity('/files/:name', '/files/my-file.v2.txt');
    });
  });

  describe('Query Parameter Handling', () => {
    it('should extract params ignoring single query parameter', async () => {
      const mswParams = await testParamParity(
        'https://api.example.com/users/:id',
        'https://api.example.com/users/123?foo=bar'
      );

      expect(mswParams?.id).toBe('123');
    });

    it('should extract params ignoring multiple query parameters', async () => {
      const mswParams = await testParamParity(
        'https://api.example.com/posts/:year/:month',
        'https://api.example.com/posts/2024/11?tag=tech&author=alice'
      );

      expect(mswParams).toEqual({ year: '2024', month: '11' });
    });

    it('should handle query params with special characters', async () => {
      const mswParams = await testParamParity(
        'https://api.example.com/search/:query',
        'https://api.example.com/search/test?filter=name%3Dalice&sort=asc'
      );

      expect(mswParams?.query).toBe('test');
    });

    it('should extract optional params with query string present', async () => {
      const mswParams = await testParamParity(
        'https://api.example.com/users/:id?',
        'https://api.example.com/users/123?role=admin'
      );

      expect(mswParams?.id).toBe('123');
    });

    it('should extract repeating params with query string', async () => {
      const mswParams = await testParamParity(
        'https://api.example.com/files/:path+',
        'https://api.example.com/files/folder/doc.txt?version=2&download=true'
      );

      expect(mswParams?.path).toEqual(['folder', 'doc.txt']);
    });

    it('should handle empty query string', async () => {
      const mswParams = await testParamParity(
        'https://api.example.com/users/:id',
        'https://api.example.com/users/123?'
      );

      expect(mswParams?.id).toBe('123');
    });

    it('should handle query string with equals but no value', async () => {
      const mswParams = await testParamParity(
        'https://api.example.com/users/:id',
        'https://api.example.com/users/123?foo='
      );

      expect(mswParams?.id).toBe('123');
    });

    it('should handle URL with root path and query params', async () => {
      const mswParams = await testParamParity(
        'https://api.example.com/',
        'https://api.example.com/?key=value'
      );

      // Root path with query params should match root pattern
      expect(mswParams).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle POST with non-JSON body', async () => {
      const fullUrl = 'https://api.example.com/upload';
      const pattern = 'https://api.example.com/upload';

      const mswParams = await new Promise<MSWParams>((resolve) => {
        server.use(
          http.post(pattern, ({ params, request }) => {
            resolve(params);
            return HttpResponse.json({ ok: true });
          })
        );

        // Send POST with plain text body (not JSON)
        fetch(fullUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: 'plain text content',
        });
      });

      const ourResult = matchesUrl(pattern, fullUrl);
      expect(ourResult.params).toEqual(mswParams);

      server.resetHandlers();
    });

    it('should handle URL without query params (no searchParams)', async () => {
      const mswParams = await testParamParity(
        'https://api.example.com/users',
        'https://api.example.com/users'
      );

      // Should match with empty params
      expect(mswParams).toEqual({});
    });

    it('should handle URL with host but no path', async () => {
      // This test ensures url-matcher line 34 (|| '/') is executed
      const mswParams = await testParamParity(
        'https://api.example.com/',
        'https://api.example.com'
      );

      // Root path should match with empty params
      expect(mswParams).toEqual({});
    });
  });

  // NOTE: Unnamed groups like /(user|u)/:id are NOT supported by MSW in Node.js
  // with full URLs. MSW doesn't match these patterns, so we don't test them.
  // Our url-matcher implementation uses the same path-to-regexp library as MSW,
  // but MSW may have additional filtering or different behavior with full URLs.
});
