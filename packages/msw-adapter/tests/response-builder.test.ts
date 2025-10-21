import { describe, it, expect, vi } from 'vitest';
import { buildResponse } from '../src/conversion/response-builder.js';
import type { MockDefinition } from '@scenarist/core';

describe('Response Builder', () => {
  describe('Basic response building', () => {
    it('should build response with status code', async () => {
      const mock: MockDefinition = {
        method: 'GET',
        url: 'https://api.example.com/users',
        response: {
          status: 200,
        },
      };

      const response = await buildResponse(mock);

      expect(response.status).toBe(200);
    });

    it('should build response with JSON body', async () => {
      const mock: MockDefinition = {
        method: 'GET',
        url: 'https://api.example.com/users',
        response: {
          status: 200,
          body: { id: '123', name: 'John Doe' },
        },
      };

      const response = await buildResponse(mock);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ id: '123', name: 'John Doe' });
    });

    it('should build response with custom headers', async () => {
      const mock: MockDefinition = {
        method: 'GET',
        url: 'https://api.example.com/users',
        response: {
          status: 200,
          headers: {
            'X-Custom-Header': 'custom-value',
            'Content-Type': 'application/json',
          },
        },
      };

      const response = await buildResponse(mock);

      expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should apply delay before returning response', async () => {
      vi.useFakeTimers();

      const mock: MockDefinition = {
        method: 'GET',
        url: 'https://api.example.com/users',
        response: {
          status: 200,
          delay: 100,
        },
      };

      const responsePromise = buildResponse(mock);

      await vi.advanceTimersByTimeAsync(100);
      const response = await responsePromise;

      expect(response.status).toBe(200);

      vi.useRealTimers();
    });

    it('should handle response with undefined body', async () => {
      const mock: MockDefinition = {
        method: 'DELETE',
        url: 'https://api.example.com/users/123',
        response: {
          status: 204,
        },
      };

      const response = await buildResponse(mock);

      expect(response.status).toBe(204);
    });

    it('should combine all options together', async () => {
      vi.useFakeTimers();

      const mock: MockDefinition = {
        method: 'POST',
        url: 'https://api.example.com/users',
        response: {
          status: 201,
          body: { id: '456', created: true },
          headers: {
            'Location': '/users/456',
          },
          delay: 50,
        },
      };

      const responsePromise = buildResponse(mock);

      await vi.advanceTimersByTimeAsync(50);
      const response = await responsePromise;
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body).toEqual({ id: '456', created: true });
      expect(response.headers.get('Location')).toBe('/users/456');

      vi.useRealTimers();
    });
  });
});
