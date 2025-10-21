import { describe, it, expect } from 'vitest';
import { findMatchingMock } from '../src/matching/mock-matcher.js';
import type { MockDefinition } from '@scenarist/core';

describe('Mock Matcher', () => {
  describe('Basic matching', () => {
    it('should find mock matching method and URL', () => {
      const mocks: ReadonlyArray<MockDefinition> = [
        {
          method: 'GET',
          url: 'https://api.example.com/users',
          response: { status: 200 },
        },
      ];

      const result = findMatchingMock(mocks, 'GET', 'https://api.example.com/users');

      expect(result).toBe(mocks[0]);
    });
  });
});
