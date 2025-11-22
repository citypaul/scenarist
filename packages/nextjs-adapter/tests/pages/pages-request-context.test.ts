import { describe, it, expect } from 'vitest';
import type { NextApiRequest } from 'next';
import { buildConfig, type ScenaristScenario } from '@scenarist/core';
import { PagesRequestContext } from '../../src/pages/context.js';

describe('PagesRequestContext', () => {
  const defaultScenario: ScenaristScenario = {
    id: 'default',
    name: 'Default',
    description: 'Default test scenario',
    mocks: [],
  };

  const scenarios = {
    default: defaultScenario,
  } as const;

  const config = buildConfig({
    enabled: true,
    scenarios,
  });

  describe('getTestId', () => {
    it('should extract test ID from x-test-id header', () => {
      const req = {
        headers: {
          'x-test-id': 'my-test-id',
        },
      } as NextApiRequest;

      const context = new PagesRequestContext(req, config);

      expect(context.getTestId()).toBe('my-test-id');
    });

    it('should return default test ID when header is missing', () => {
      const req = {
        headers: {},
      } as NextApiRequest;

      const context = new PagesRequestContext(req, config);

      expect(context.getTestId()).toBe('default-test');
    });

    it('should handle array header values by taking first element', () => {
      const req = {
        headers: {
          'x-test-id': ['first-id', 'second-id'],
        },
      } as NextApiRequest;

      const context = new PagesRequestContext(req, config);

      expect(context.getTestId()).toBe('first-id');
    });
  });

  describe('getHeaders', () => {
    it('should return all request headers', () => {
      const req = {
        headers: {
          'x-test-id': 'my-test',
          'content-type': 'application/json',
        },
      } as NextApiRequest;

      const context = new PagesRequestContext(req, config);

      expect(context.getHeaders()).toEqual({
        'x-test-id': 'my-test',
        'content-type': 'application/json',
      });
    });
  });

  describe('getHostname', () => {
    it('should extract hostname from req.headers.host', () => {
      const req = {
        headers: {
          host: 'localhost:3000',
        },
      } as NextApiRequest;

      const context = new PagesRequestContext(req, config);

      expect(context.getHostname()).toBe('localhost:3000');
    });

    it('should return empty string when host header is missing', () => {
      const req = {
        headers: {},
      } as NextApiRequest;

      const context = new PagesRequestContext(req, config);

      expect(context.getHostname()).toBe('');
    });

    it('should handle array host header by taking first element', () => {
      const req = {
        headers: {
          host: ['localhost:3000', 'example.com'],
        },
      } as unknown as NextApiRequest;

      const context = new PagesRequestContext(req, config);

      expect(context.getHostname()).toBe('localhost:3000');
    });

    it('should return empty string when host header is empty array', () => {
      const req = {
        headers: {
          host: [],
        },
      } as unknown as NextApiRequest;

      const context = new PagesRequestContext(req, config);

      expect(context.getHostname()).toBe('');
    });

    it('should return empty string when host array has undefined first element', () => {
      const req = {
        headers: {
          host: [undefined, 'fallback.com'],
        },
      } as unknown as NextApiRequest;

      const context = new PagesRequestContext(req, config);

      expect(context.getHostname()).toBe('');
    });
  });
});
