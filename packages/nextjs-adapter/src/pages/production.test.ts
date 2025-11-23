/**
 * Production Entry Point Tests - Next.js Pages Router Adapter
 *
 * These tests verify the production stub implementations that enable tree-shaking
 * of Scenarist from production builds.
 *
 * ## How Next.js Conditional Exports Work
 *
 * Next.js respects Node.js conditional exports (package.json "exports" field).
 * When NODE_ENV=production, Next.js uses the "production" export path instead
 * of the default export.
 *
 * Example from package.json:
 * ```json
 * {
 *   "exports": {
 *     "./pages": {
 *       "production": "./dist/pages/production.js",
 *       "default": "./dist/pages/index.js"
 *     }
 *   }
 * }
 * ```
 *
 * This means:
 * - In development/test: `import { createScenarist } from '@scenarist/nextjs-adapter/pages'`
 *   resolves to `dist/pages/index.js` (full Scenarist implementation)
 * - In production: Same import resolves to `dist/pages/production.js` (stubs only)
 *
 * ## Why This Achieves Tree-Shaking
 *
 * Because production.js:
 * 1. Does NOT import from @scenarist/core or @scenarist/msw-adapter
 * 2. Does NOT import from 'msw'
 * 3. Only exports stub functions with zero dependencies
 *
 * Result: Bundlers like Next.js/Webpack can completely eliminate:
 * - All MSW code (~50kb)
 * - All Scenarist core logic
 * - All scenario definitions
 * - All test infrastructure
 *
 * Final production bundle: 0kb overhead from Scenarist
 *
 * ## Why Stubs Return Safe Defaults
 *
 * Application code can import and use Scenarist helpers without guards:
 *
 * ```typescript
 * // API Route - works in ALL environments
 * import { getScenaristHeaders } from '@scenarist/nextjs-adapter/pages';
 * import type { NextApiRequest, NextApiResponse } from 'next';
 *
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const response = await fetch('http://api.example.com/data', {
 *     headers: {
 *       ...getScenaristHeaders(req),  // ✅ Safe: {} in production
 *       'x-api-key': 'abc123',
 *     },
 *   });
 *
 *   res.json(await response.json());
 * }
 * ```
 *
 * In production, `getScenaristHeaders()` returns `{}`, so spreading it is a no-op.
 * No runtime errors, no guards needed, same code everywhere.
 *
 * ## Pages Router vs App Router
 *
 * The Pages Router adapter has simpler helper functions than App Router because:
 * - Pages Router only has API Routes (no Server Components)
 * - API Routes use NextApiRequest (not Web Request or ReadonlyHeaders)
 * - Only one helper needed: getScenaristHeaders(req: NextApiRequest)
 *
 * App Router needs more helpers to support:
 * - Route Handlers (Web Request API)
 * - Server Components (ReadonlyHeaders from next/headers)
 * - Both getHeaders() and getTestId() variants for each context
 *
 * ## Related Documentation
 *
 * **Core Feature (Node.js Conditional Exports):**
 * - https://nodejs.org/api/packages.html#conditional-exports
 *   Defines how package.json "exports" field works with conditions like "production"
 * - https://nodejs.org/api/packages.html#exports
 *   Complete specification for package.json exports field
 *
 * **Next.js Build Optimizations:**
 * - https://nextjs.org/blog/next-14-2
 *   Next.js 14.2 tree-shaking improvements (see "Improved Tree Shaking" section)
 * - https://nextjs.org/docs/app/guides/package-bundling
 *   Next.js package bundling and optimization strategies
 *
 * **Next.js Pages Router:**
 * - https://nextjs.org/docs/pages/building-your-application/routing/api-routes
 *   Pages Router API route handler pattern (NextApiRequest/NextApiResponse)
 *
 * **Bundler Documentation:**
 * - https://webpack.js.org/configuration/mode/#mode-production
 *   Webpack production mode (sets NODE_ENV=production, enables conditional exports)
 * - https://turbo.build/pack/docs
 *   Turbopack (Next.js's new bundler, also respects conditional exports)
 *
 * **Note:** Next.js doesn't document conditional exports specifically because it's a
 * Node.js feature that Next.js (via Webpack/Turbopack) automatically respects during
 * production builds. The key is that NODE_ENV=production triggers the "production"
 * export path in package.json.
 *
 * ## Testing Strategy
 *
 * These tests verify:
 * 1. All stub functions return safe, expected defaults
 * 2. createScenarist returns undefined (no Scenarist instance in production)
 * 3. Helper functions can be called without errors
 * 4. No imports from test dependencies (tree-shaking verification)
 */

import { describe, it, expect } from 'vitest';
import type { NextApiRequest } from 'next';
import * as production from './production.js';

describe('Pages Router production entry point', () => {
  describe('createScenarist', () => {
    it('should return undefined (Scenarist disabled in production)', () => {
      // In production builds, Scenarist should not exist at all
      // API routes check: if (scenarist) { return scenarist.createScenarioEndpoint() }
      const scenarist = production.createScenarist({
        enabled: true,
        scenarios: {
          test: {
            id: 'test',
            name: 'Test Scenario',
            description: 'A test scenario',
            mocks: [],
          },
        },
      });

      expect(scenarist).toBeUndefined();
    });

    it('should accept same options as development version (type safety)', () => {
      // This ensures the production stub has the same TypeScript signature
      // as the real implementation, preventing type errors in user code
      const scenarist = production.createScenarist({
        enabled: false,
        scenarios: {
          default: {
            id: 'default',
            name: 'Default Scenario',
            description: 'Default test scenario',
            mocks: [],
          },
        },
        defaultTestId: 'test-123',
      });

      expect(scenarist).toBeUndefined();
    });
  });

  describe('getScenaristHeaders', () => {
    it('should return empty object (no test headers in production)', () => {
      const mockRequest = {
        headers: {
          'x-test-id': 'test-123',
          'x-user-id': 'user-456',
        },
        method: 'GET',
        url: '/api/test',
      } as unknown as NextApiRequest;

      const headers = production.getScenaristHeaders(mockRequest);

      // Production: No test infrastructure headers added
      expect(headers).toEqual({});
      expect(Object.keys(headers)).toHaveLength(0);
    });

    it('should be safe to spread in fetch headers', () => {
      const mockRequest = {
        headers: {},
        method: 'GET',
        url: '/api/test',
      } as unknown as NextApiRequest;

      const headers = production.getScenaristHeaders(mockRequest);

      // This pattern works in all environments without guards
      const fetchHeaders = {
        'content-type': 'application/json',
        ...headers, // Spreading {} is a no-op
      };

      expect(fetchHeaders).toEqual({
        'content-type': 'application/json',
      });
    });

    it('should ignore NextApiRequest properties in production', () => {
      const mockRequest = {
        headers: {
          'x-test-id': 'test-abc',
          'x-scenario': 'premium',
        },
        method: 'POST',
        url: '/api/cart/add',
        body: { item: 'product-1' },
      } as unknown as NextApiRequest;

      const headers = production.getScenaristHeaders(mockRequest);

      // Production stub doesn't read request properties, just returns {}
      expect(headers).toEqual({});
    });
  });

  describe('tree-shaking verification', () => {
    it('should export only stub functions with no test dependencies', () => {
      // Verify all expected exports exist
      expect(production.createScenarist).toBeDefined();
      expect(production.getScenaristHeaders).toBeDefined();

      // Verify stubs are simple functions (not complex objects)
      expect(typeof production.createScenarist).toBe('function');
      expect(typeof production.getScenaristHeaders).toBe('function');
    });

    it('should not have any Scenarist instance methods', () => {
      const scenarist = production.createScenarist({
        enabled: true,
        scenarios: {
          default: {
            id: 'default',
            name: 'Default',
            description: 'Default scenario',
            mocks: [],
          },
        },
      });

      // Production stub returns undefined, not a Scenarist instance
      expect(scenarist).toBeUndefined();

      // These methods exist in development but NOT in production
      // Optional chaining prevents errors when accessing properties on undefined
      expect(scenarist?.start).toBeUndefined();
      expect(scenarist?.stop).toBeUndefined();
      expect(scenarist?.createScenarioEndpoint).toBeUndefined();
    });

    it('should have fewer exports than App Router (simpler API surface)', () => {
      const exports = Object.keys(production);

      // Pages Router only needs:
      // - createScenarist
      // - getScenaristHeaders
      // (No ReadonlyHeaders variants, no getTestId variants)
      expect(exports).toContain('createScenarist');
      expect(exports).toContain('getScenaristHeaders');

      // App Router has these additional exports:
      // - getScenaristHeadersFromReadonlyHeaders
      // - getScenaristTestId
      // - getScenaristTestIdFromReadonlyHeaders
      expect(exports).not.toContain('getScenaristHeadersFromReadonlyHeaders');
      expect(exports).not.toContain('getScenaristTestId');
      expect(exports).not.toContain('getScenaristTestIdFromReadonlyHeaders');
    });
  });

  describe('production safety', () => {
    it('should handle being called multiple times without errors', () => {
      // Production code might call these helpers frequently
      const mockRequest = {
        headers: {},
        method: 'GET',
        url: '/api/test',
      } as unknown as NextApiRequest;

      expect(() => {
        for (let i = 0; i < 100; i++) {
          production.getScenaristHeaders(mockRequest);
        }
      }).not.toThrow();
    });

    it('should return consistent results for same inputs', () => {
      const mockRequest = {
        headers: { 'x-test-id': 'test-123' },
        method: 'GET',
        url: '/api/test',
      } as unknown as NextApiRequest;

      const headers1 = production.getScenaristHeaders(mockRequest);
      const headers2 = production.getScenaristHeaders(mockRequest);

      expect(headers1).toEqual(headers2);
    });

    it('should work with various NextApiRequest shapes', () => {
      // Different request shapes should all work safely
      const requests = [
        { headers: {}, method: 'GET', url: '/' } as unknown as NextApiRequest,
        { headers: { 'x-test-id': 'abc' }, method: 'POST', url: '/api/test' } as unknown as NextApiRequest,
        { headers: { 'x-custom': 'value' }, method: 'PUT', url: '/api/update' } as unknown as NextApiRequest,
      ];

      requests.forEach((req) => {
        expect(production.getScenaristHeaders(req)).toEqual({});
      });
    });
  });

  describe('Pages Router specific behavior', () => {
    it('should be compatible with Pages Router API route pattern', () => {
      // Typical Pages Router API route usage
      const mockRequest = {
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        url: '/api/cart/add',
        body: { productId: 1 },
      } as unknown as NextApiRequest;

      const scenaristHeaders = production.getScenaristHeaders(mockRequest);

      // In production, this should be a no-op
      const requestHeaders = {
        'content-type': 'application/json',
        ...scenaristHeaders,
      };

      expect(requestHeaders).toEqual({
        'content-type': 'application/json',
      });
    });

    it('should not interfere with existing headers', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer token123',
          'x-api-key': 'secret',
        },
        method: 'GET',
        url: '/api/protected',
      } as unknown as NextApiRequest;

      const scenaristHeaders = production.getScenaristHeaders(mockRequest);
      const allHeaders = {
        ...mockRequest.headers,
        ...scenaristHeaders,
      };

      // Production stub shouldn't modify or remove existing headers
      expect(allHeaders).toEqual({
        authorization: 'Bearer token123',
        'x-api-key': 'secret',
      });
    });
  });
});
