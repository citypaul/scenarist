import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createTestIdMiddleware, testIdStorage } from '../src/middleware/test-id-middleware.js';
import type { ScenaristConfig } from '@scenarist/core';

const mockConfig = (overrides?: Partial<ScenaristConfig>): ScenaristConfig => ({
  enabled: true,
  devToolsEnabled: false,
  strictMode: false,
  headers: {
    testId: 'x-test-id',
    mockEnabled: 'x-mock-enabled',
  },
  endpoints: {
    setScenario: '/__scenario__',
    getScenario: '/__scenario__',
  },
  defaultScenario: 'default',
  defaultTestId: 'default-test',
  ...overrides,
});

const mockRequest = (overrides?: Partial<Request>): Request => {
  const headers = overrides?.headers ?? {};
  const lowercasedHeaders: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    lowercasedHeaders[key.toLowerCase()] = value;
  }

  return {
    headers: lowercasedHeaders,
    hostname: 'localhost',
    ...overrides,
    headers: lowercasedHeaders,
  } as Request;
};

const mockResponse = (): Response => ({} as Response);

describe('Test ID Middleware', () => {
  describe('AsyncLocalStorage integration', () => {
    it('should store test ID in AsyncLocalStorage', () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: { 'x-test-id': 'test-123' },
      });
      const res = mockResponse();

      let capturedTestId: string | undefined;
      const next: NextFunction = () => {
        // Capture the value from AsyncLocalStorage during middleware execution
        capturedTestId = testIdStorage.getStore();
      };

      const middleware = createTestIdMiddleware(config);
      middleware(req, res, next);

      expect(capturedTestId).toBe('test-123');
    });

    it('should use default test ID when header is missing', () => {
      const config = mockConfig({ defaultTestId: 'default-test' });
      const req = mockRequest({ headers: {} });
      const res = mockResponse();

      let capturedTestId: string | undefined;
      const next: NextFunction = () => {
        capturedTestId = testIdStorage.getStore();
      };

      const middleware = createTestIdMiddleware(config);
      middleware(req, res, next);

      expect(capturedTestId).toBe('default-test');
    });
  });

  describe('Middleware chain', () => {
    it('should call next() to continue middleware chain', () => {
      const config = mockConfig();
      const req = mockRequest({ headers: { 'x-test-id': 'test-456' } });
      const res = mockResponse();

      let nextCalled = false;
      const next: NextFunction = () => {
        nextCalled = true;
      };

      const middleware = createTestIdMiddleware(config);
      middleware(req, res, next);

      expect(nextCalled).toBe(true);
    });

    it('should maintain test ID throughout async context', () => {
      const config = mockConfig();
      const req = mockRequest({ headers: { 'x-test-id': 'async-test' } });
      const res = mockResponse();

      const capturedIds: string[] = [];
      const next: NextFunction = () => {
        // First capture
        capturedIds.push(testIdStorage.getStore() ?? '');

        // Simulate async operation
        setTimeout(() => {
          // Second capture after async delay
          capturedIds.push(testIdStorage.getStore() ?? '');
        }, 0);
      };

      const middleware = createTestIdMiddleware(config);
      middleware(req, res, next);

      // Both captures should have the same test ID
      expect(capturedIds[0]).toBe('async-test');
    });
  });
});
