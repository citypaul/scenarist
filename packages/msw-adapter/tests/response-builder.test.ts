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
  });
});
