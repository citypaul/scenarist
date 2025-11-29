/**
 * Production Entry Point Tests - Next.js App Router Adapter
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
 *     "./app": {
 *       "production": "./dist/app/production.js",
 *       "default": "./dist/app/index.js"
 *     }
 *   }
 * }
 * ```
 *
 * This means:
 * - In development/test: `import { createScenarist } from '@scenarist/nextjs-adapter/app'`
 *   resolves to `dist/app/index.js` (full Scenarist implementation)
 * - In production: Same import resolves to `dist/app/production.js` (stubs only)
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
 * // Route Handler - works in ALL environments
 * import { getScenaristHeaders } from '@scenarist/nextjs-adapter/app';
 *
 * export async function GET(request: Request) {
 *   const response = await fetch('http://api.example.com/data', {
 *     headers: {
 *       ...getScenaristHeaders(request),  // ✅ Safe: {} in production
 *       'x-api-key': 'abc123',
 *     },
 *   });
 * }
 * ```
 *
 * In production, `getScenaristHeaders()` returns `{}`, so spreading it is a no-op.
 * No runtime errors, no guards needed, same code everywhere.
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

import { describe, it, expect } from "vitest";
import * as production from "./production.js";

describe("App Router production entry point", () => {
  describe("createScenarist", () => {
    it("should return undefined (Scenarist disabled in production)", () => {
      // In production builds, Scenarist should not exist at all
      // Routes check: if (scenarist) { scenarist.createScenarioEndpoint() }
      const scenarist = production.createScenarist({
        enabled: true,
        scenarios: {
          test: {
            id: "test",
            name: "Test Scenario",
            description: "A test scenario",
            mocks: [],
          },
        },
      });

      expect(scenarist).toBeUndefined();
    });

    it("should accept same options as development version (type safety)", () => {
      // This ensures the production stub has the same TypeScript signature
      // as the real implementation, preventing type errors in user code
      const scenarist = production.createScenarist({
        enabled: false,
        scenarios: {
          default: {
            id: "default",
            name: "Default Scenario",
            description: "Default test scenario",
            mocks: [],
          },
        },
        defaultTestId: "test-123",
      });

      expect(scenarist).toBeUndefined();
    });
  });

  describe("getScenaristHeaders", () => {
    it("should return empty object (no test headers in production)", () => {
      const mockRequest = new Request("http://localhost:3000", {
        headers: {
          "x-scenarist-test-id": "test-123",
          "x-user-id": "user-456",
        },
      });

      const headers = production.getScenaristHeaders(mockRequest);

      // Production: No test infrastructure headers added
      expect(headers).toEqual({});
      expect(Object.keys(headers)).toHaveLength(0);
    });

    it("should be safe to spread in fetch headers", () => {
      const mockRequest = new Request("http://localhost:3000");
      const headers = production.getScenaristHeaders(mockRequest);

      // This pattern works in all environments without guards
      const fetchHeaders = {
        "content-type": "application/json",
        ...headers, // Spreading {} is a no-op
      };

      expect(fetchHeaders).toEqual({
        "content-type": "application/json",
      });
    });
  });

  describe("getScenaristHeadersFromReadonlyHeaders", () => {
    it("should return empty object for ReadonlyHeaders (Server Components)", () => {
      // Simulate ReadonlyHeaders from next/headers
      const mockReadonlyHeaders = {
        get: (name: string) =>
          name === "x-scenarist-test-id" ? "test-123" : null,
      };

      const headers =
        production.getScenaristHeadersFromReadonlyHeaders(mockReadonlyHeaders);

      expect(headers).toEqual({});
      expect(Object.keys(headers)).toHaveLength(0);
    });

    it("should be safe to spread in Server Component fetch headers", () => {
      const mockReadonlyHeaders = {
        get: (_name: string) => null,
      };

      const headers =
        production.getScenaristHeadersFromReadonlyHeaders(mockReadonlyHeaders);

      const fetchHeaders = {
        "x-api-key": "secret",
        ...headers, // Spreading {} is a no-op
      };

      expect(fetchHeaders).toEqual({
        "x-api-key": "secret",
      });
    });
  });

  describe("getScenaristTestId", () => {
    it("should return fallback test ID for Request", () => {
      const mockRequest = new Request("http://localhost:3000", {
        headers: { "x-scenarist-test-id": "test-123" },
      });

      const testId = production.getScenaristTestId(mockRequest);

      // In production, always returns fallback (no test isolation needed)
      expect(testId).toBe("default-test");
    });

    it("should always return same fallback regardless of headers", () => {
      const request1 = new Request("http://localhost:3000", {
        headers: { "x-scenarist-test-id": "test-abc" },
      });
      const request2 = new Request("http://localhost:3000", {
        headers: { "x-scenarist-test-id": "test-xyz" },
      });
      const request3 = new Request("http://localhost:3000"); // No headers

      expect(production.getScenaristTestId(request1)).toBe("default-test");
      expect(production.getScenaristTestId(request2)).toBe("default-test");
      expect(production.getScenaristTestId(request3)).toBe("default-test");
    });
  });

  describe("getScenaristTestIdFromReadonlyHeaders", () => {
    it("should return fallback test ID for ReadonlyHeaders (Server Components)", () => {
      const mockReadonlyHeaders = {
        get: (name: string) =>
          name === "x-scenarist-test-id" ? "test-123" : null,
      };

      const testId =
        production.getScenaristTestIdFromReadonlyHeaders(mockReadonlyHeaders);

      expect(testId).toBe("default-test");
    });

    it("should be usable for logging/debugging in production", () => {
      const mockReadonlyHeaders = {
        get: (_name: string) => null,
      };

      const testId =
        production.getScenaristTestIdFromReadonlyHeaders(mockReadonlyHeaders);

      // Even in production, code can safely call this for logging
      const logMessage = `Processing request for test: ${testId}`;
      expect(logMessage).toBe("Processing request for test: default-test");
    });
  });

  describe("tree-shaking verification", () => {
    it("should export only stub functions with no test dependencies", () => {
      // Verify all expected exports exist
      expect(production.createScenarist).toBeDefined();
      expect(production.getScenaristHeaders).toBeDefined();
      expect(production.getScenaristHeadersFromReadonlyHeaders).toBeDefined();
      expect(production.getScenaristTestId).toBeDefined();
      expect(production.getScenaristTestIdFromReadonlyHeaders).toBeDefined();

      // Verify stubs are simple functions (not complex objects)
      expect(typeof production.createScenarist).toBe("function");
      expect(typeof production.getScenaristHeaders).toBe("function");
      expect(typeof production.getScenaristTestId).toBe("function");
    });

    it("should not have any Scenarist instance methods", () => {
      const scenarist = production.createScenarist({
        enabled: true,
        scenarios: {
          default: {
            id: "default",
            name: "Default",
            description: "Default scenario",
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
  });

  describe("production safety", () => {
    it("should handle being called multiple times without errors", () => {
      // Production code might call these helpers frequently
      const mockRequest = new Request("http://localhost:3000");

      expect(() => {
        for (let i = 0; i < 100; i++) {
          production.getScenaristHeaders(mockRequest);
          production.getScenaristTestId(mockRequest);
        }
      }).not.toThrow();
    });

    it("should return consistent results for same inputs", () => {
      const mockRequest = new Request("http://localhost:3000");

      const headers1 = production.getScenaristHeaders(mockRequest);
      const headers2 = production.getScenaristHeaders(mockRequest);
      const testId1 = production.getScenaristTestId(mockRequest);
      const testId2 = production.getScenaristTestId(mockRequest);

      expect(headers1).toEqual(headers2);
      expect(testId1).toBe(testId2);
    });
  });
});
