import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { ExpressRequestContext } from '../src/context/express-request-context.js';
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
  // Express/Node.js lowercases all header names
  const headers = overrides?.headers ?? {};
  const lowercasedHeaders: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    lowercasedHeaders[key.toLowerCase()] = value;
  }

  return {
    headers: lowercasedHeaders,
    hostname: 'localhost',
    ...overrides,
    headers: lowercasedHeaders, // Ensure headers are lowercased even after spread
  } as Request;
};

describe('ExpressRequestContext', () => {
  describe('getTestId', () => {
    it('should read test ID from header when present', () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: { 'x-test-id': 'test-123' },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getTestId()).toBe('test-123');
    });

    it('should use default test ID when header is missing', () => {
      const config = mockConfig({ defaultTestId: 'default-test' });
      const req = mockRequest({
        headers: {},
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getTestId()).toBe('default-test');
    });

    it('should handle array headers by using first value', () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: { 'x-test-id': ['test-first', 'test-second'] },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getTestId()).toBe('test-first');
    });

    it('should be case-insensitive for header names', () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: { 'X-Test-ID': 'test-456' },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getTestId()).toBe('test-456');
    });
  });

  describe('isMockEnabled', () => {
    it('should return true when header is "true"', () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: { 'x-mock-enabled': 'true' },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.isMockEnabled()).toBe(true);
    });

    it('should return false when header is not "true"', () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: { 'x-mock-enabled': 'false' },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.isMockEnabled()).toBe(false);
    });

    it('should default to true when header is missing', () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: {},
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.isMockEnabled()).toBe(true);
    });
  });

  describe('getHeaders', () => {
    it('should return all request headers', () => {
      const config = mockConfig();
      const req = mockRequest({
        headers: {
          'x-test-id': 'test-123',
          'content-type': 'application/json',
        },
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getHeaders()).toEqual({
        'x-test-id': 'test-123',
        'content-type': 'application/json',
      });
    });
  });

  describe('getHostname', () => {
    it('should return request hostname', () => {
      const config = mockConfig();
      const req = mockRequest({
        hostname: 'example.com',
      });

      const context = new ExpressRequestContext(req, config);

      expect(context.getHostname()).toBe('example.com');
    });
  });
});
