import { describe, it, expect } from 'vitest';
import { buildConfig, type ScenarioDefinition } from '@scenarist/core';
import { AppRequestContext } from '../../src/app/context.js';

describe('AppRequestContext', () => {
  const defaultScenario: ScenarioDefinition = {
    id: 'default',
    name: 'Default',
    mocks: [],
  };

  const config = buildConfig({
    enabled: true,
    defaultScenario,
  });

  describe('getTestId', () => {
    it('should extract test ID from x-test-id header', () => {
      const headers = new Headers({
        'x-test-id': 'my-test-id',
      });

      const req = new Request('http://localhost:3000/api/test', { headers });
      const context = new AppRequestContext(req, config);

      expect(context.getTestId()).toBe('my-test-id');
    });

    it('should return default test ID when header is missing', () => {
      const req = new Request('http://localhost:3000/api/test');
      const context = new AppRequestContext(req, config);

      expect(context.getTestId()).toBe('default-test');
    });

    it('should be case-insensitive for header names', () => {
      const headers = new Headers({
        'X-TEST-ID': 'uppercase-id',
      });

      const req = new Request('http://localhost:3000/api/test', { headers });
      const context = new AppRequestContext(req, config);

      expect(context.getTestId()).toBe('uppercase-id');
    });
  });

  describe('isMockEnabled', () => {
    it('should return true when x-mock-enabled header is "true"', () => {
      const headers = new Headers({
        'x-mock-enabled': 'true',
      });

      const req = new Request('http://localhost:3000/api/test', { headers });
      const context = new AppRequestContext(req, config);

      expect(context.isMockEnabled()).toBe(true);
    });

    it('should return false when x-mock-enabled header is not "true"', () => {
      const headers = new Headers({
        'x-mock-enabled': 'false',
      });

      const req = new Request('http://localhost:3000/api/test', { headers });
      const context = new AppRequestContext(req, config);

      expect(context.isMockEnabled()).toBe(false);
    });

    it('should return true by default when header is missing', () => {
      const req = new Request('http://localhost:3000/api/test');
      const context = new AppRequestContext(req, config);

      expect(context.isMockEnabled()).toBe(true);
    });
  });

  describe('getHeaders', () => {
    it('should return all request headers as record', () => {
      const headers = new Headers({
        'x-test-id': 'my-test',
        'content-type': 'application/json',
      });

      const req = new Request('http://localhost:3000/api/test', { headers });
      const context = new AppRequestContext(req, config);

      const result = context.getHeaders();

      expect(result['x-test-id']).toBe('my-test');
      expect(result['content-type']).toBe('application/json');
    });

    it('should return empty object when no headers present', () => {
      const req = new Request('http://localhost:3000/api/test');
      const context = new AppRequestContext(req, config);

      const result = context.getHeaders();

      expect(result).toEqual({});
    });
  });

  describe('getHostname', () => {
    it('should extract hostname from request URL', () => {
      const req = new Request('http://localhost:3000/api/test');
      const context = new AppRequestContext(req, config);

      expect(context.getHostname()).toBe('localhost:3000');
    });

    it('should handle URLs without port', () => {
      const req = new Request('https://example.com/api/test');
      const context = new AppRequestContext(req, config);

      expect(context.getHostname()).toBe('example.com');
    });

    it('should handle URLs with different ports', () => {
      const req = new Request('http://localhost:8080/api/test');
      const context = new AppRequestContext(req, config);

      expect(context.getHostname()).toBe('localhost:8080');
    });
  });
});
