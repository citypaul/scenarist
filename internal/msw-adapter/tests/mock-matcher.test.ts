import { describe, it, expect } from 'vitest';
import { findMatchingMock } from '../src/matching/mock-matcher.js';
import type { ScenaristMock } from '@scenarist/core';
import { mockDefinition } from './factories.js';

describe('Mock Matcher', () => {
  describe('Basic matching', () => {
    it('should find mock matching method and URL', () => {
      const mocks: ReadonlyArray<ScenaristMock> = [mockDefinition()];

      const result = findMatchingMock(mocks, 'GET', 'https://api.example.com/users');

      expect(result).toBe(mocks[0]);
    });

    it('should return undefined when no match found', () => {
      const mocks: ReadonlyArray<ScenaristMock> = [mockDefinition()];

      const result = findMatchingMock(mocks, 'POST', 'https://api.example.com/users');

      expect(result).toBeUndefined();
    });

    it('should return first match when multiple mocks match', () => {
      const mocks: ReadonlyArray<ScenaristMock> = [
        mockDefinition({ response: { status: 200, body: { first: true } } }),
        mockDefinition({ response: { status: 201, body: { second: true } } }),
      ];

      const result = findMatchingMock(mocks, 'GET', 'https://api.example.com/users');

      expect(result).toBe(mocks[0]);
      expect(result?.response.body).toEqual({ first: true });
    });

    it('should handle empty mocks array', () => {
      const mocks: ReadonlyArray<ScenaristMock> = [];

      const result = findMatchingMock(mocks, 'GET', 'https://api.example.com/users');

      expect(result).toBeUndefined();
    });

    it('should match method case-insensitively', () => {
      const mocks: ReadonlyArray<ScenaristMock> = [
        mockDefinition({ method: 'POST', response: { status: 201 } }),
      ];

      const result = findMatchingMock(mocks, 'post', 'https://api.example.com/users');

      expect(result).toBe(mocks[0]);
    });
  });

  describe('URL pattern matching', () => {
    it('should match using path parameters', () => {
      const mocks: ReadonlyArray<ScenaristMock> = [
        mockDefinition({ url: 'https://api.example.com/users/:id' }),
      ];

      const result = findMatchingMock(mocks, 'GET', 'https://api.example.com/users/456');

      expect(result).toBe(mocks[0]);
    });

    it('should not match when URL pattern does not match', () => {
      const mocks: ReadonlyArray<ScenaristMock> = [
        mockDefinition({ url: 'https://api.example.com/users/:id' }),
      ];

      const result = findMatchingMock(mocks, 'GET', 'https://api.example.com/posts/123');

      expect(result).toBeUndefined();
    });
  });

  describe('Method and URL combination', () => {
    it('should require both method and URL to match', () => {
      const mocks: ReadonlyArray<ScenaristMock> = [
        mockDefinition(),
        mockDefinition({ method: 'POST', url: 'https://api.example.com/posts', response: { status: 201 } }),
      ];

      const getUsers = findMatchingMock(mocks, 'GET', 'https://api.example.com/users');
      const postPosts = findMatchingMock(mocks, 'POST', 'https://api.example.com/posts');
      const wrongMethod = findMatchingMock(mocks, 'POST', 'https://api.example.com/users');
      const wrongUrl = findMatchingMock(mocks, 'GET', 'https://api.example.com/posts');

      expect(getUsers).toBe(mocks[0]);
      expect(postPosts).toBe(mocks[1]);
      expect(wrongMethod).toBeUndefined();
      expect(wrongUrl).toBeUndefined();
    });
  });
});
