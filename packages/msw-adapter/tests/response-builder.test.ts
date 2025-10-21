import { describe, it, expect } from 'vitest';
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
  });
});
