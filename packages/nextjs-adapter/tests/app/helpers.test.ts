/**
 * Unit tests for App Router helper functions
 *
 * NOTE: This test file is being added RETROACTIVELY to fix a TDD violation.
 * The implementation (src/app/helpers.ts) was created without tests first.
 *
 * LESSON LEARNED: Always write tests BEFORE implementation.
 * These tests should have been written FIRST, committed as RED, then
 * the implementation committed as GREEN.
 */

import { describe, it, expect } from 'vitest';
import { getScenaristHeaders } from '../../src/app/helpers.js';
import { createScenarist } from '../../src/app/setup.js';

describe('getScenaristHeaders', () => {
  const createMockRequest = (headers: Record<string, string>): Request => {
    return {
      headers: new Headers(headers),
    } as Request;
  };

  const createTestScenarist = (config?: { testIdHeader?: string; defaultTestId?: string }) => {
    return createScenarist({
      enabled: true,
      scenarios: {},
      ...(config?.testIdHeader && {
        headers: { testId: config.testIdHeader },
      }),
      ...(config?.defaultTestId && {
        defaultTestId: config.defaultTestId,
      }),
    });
  };

  it('should extract test ID from request header', () => {
    const scenarist = createTestScenarist();
    const request = createMockRequest({ 'x-test-id': 'test-123' });

    const headers = getScenaristHeaders(request, scenarist);

    expect(headers).toEqual({ 'x-test-id': 'test-123' });
  });

  it('should use default test ID when header is missing', () => {
    const scenarist = createTestScenarist({ defaultTestId: 'default-test' });
    const request = createMockRequest({});

    const headers = getScenaristHeaders(request, scenarist);

    expect(headers).toEqual({ 'x-test-id': 'default-test' });
  });

  it('should respect custom header name from config', () => {
    const scenarist = createTestScenarist({
      testIdHeader: 'x-custom-test-id',
      defaultTestId: 'custom-default',
    });
    const request = createMockRequest({ 'x-custom-test-id': 'custom-123' });

    const headers = getScenaristHeaders(request, scenarist);

    expect(headers).toEqual({ 'x-custom-test-id': 'custom-123' });
  });

  it('should handle lowercase header names', () => {
    const scenarist = createTestScenarist();
    const request = createMockRequest({ 'x-test-id': 'lowercase-test' });

    const headers = getScenaristHeaders(request, scenarist);

    expect(headers).toEqual({ 'x-test-id': 'lowercase-test' });
  });

  it('should return object with single header entry', () => {
    const scenarist = createTestScenarist();
    const request = createMockRequest({
      'x-test-id': 'test-456',
      'x-user-tier': 'premium',
      'content-type': 'application/json',
    });

    const headers = getScenaristHeaders(request, scenarist);

    // Should only return the test ID header, not all headers
    expect(Object.keys(headers)).toHaveLength(1);
    expect(headers).toEqual({ 'x-test-id': 'test-456' });
  });

  it('should use default when header value is empty string', () => {
    const scenarist = createTestScenarist({ defaultTestId: 'fallback-test' });
    const request = createMockRequest({ 'x-test-id': '' });

    const headers = getScenaristHeaders(request, scenarist);

    expect(headers).toEqual({ 'x-test-id': 'fallback-test' });
  });
});
