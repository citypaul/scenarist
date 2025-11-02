/**
 * Tests for Pages Router helper functions
 */

import { describe, it, expect } from 'vitest';
import type { NextApiRequest } from 'next';
import type { ScenariosObject } from '@scenarist/core';
import { createScenarist } from '../../src/pages/setup';
import { getScenaristHeaders } from '../../src/pages/helpers';

const testScenarios = {
  default: {
    id: 'default',
    name: 'Default Scenario',
    description: 'Default test scenario',
    mocks: [],
  },
} as const satisfies ScenariosObject;

describe('getScenaristHeaders', () => {
  it('should extract test ID from request using default configured header name', () => {
    const scenarist = createScenarist({
      enabled: true,
      scenarios: testScenarios,
    });
    const req = {
      headers: { 'x-test-id': 'test-123' },
    } as NextApiRequest;

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-test-id': 'test-123' });
  });

  it('should use default test ID when header is missing', () => {
    const scenarist = createScenarist({
      enabled: true,
      scenarios: testScenarios,
    });
    const req = {
      headers: {},
    } as NextApiRequest;

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-test-id': 'default-test' });
  });

  it('should respect custom header name from config', () => {
    const scenarist = createScenarist({
      enabled: true,
      scenarios: testScenarios,
      headers: { testId: 'x-custom-test-id' },
    });
    const req = {
      headers: { 'x-custom-test-id': 'custom-123' },
    } as NextApiRequest;

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-custom-test-id': 'custom-123' });
  });

  it('should respect custom default test ID from config', () => {
    const scenarist = createScenarist({
      enabled: true,
      scenarios: testScenarios,
      defaultTestId: 'my-default',
    });
    const req = {
      headers: {},
    } as NextApiRequest;

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-test-id': 'my-default' });
  });

  it('should handle both custom header name and custom default test ID', () => {
    const scenarist = createScenarist({
      enabled: true,
      scenarios: testScenarios,
      headers: { testId: 'x-my-header' },
      defaultTestId: 'my-default',
    });
    const req = {
      headers: {},
    } as NextApiRequest;

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-my-header': 'my-default' });
  });

  it('should handle header value as array (take first element)', () => {
    const scenarist = createScenarist({
      enabled: true,
      scenarios: testScenarios,
    });
    const req = {
      headers: { 'x-test-id': ['test-123', 'test-456'] },
    } as NextApiRequest;

    const headers = getScenaristHeaders(req, scenarist);

    expect(headers).toEqual({ 'x-test-id': 'test-123' });
  });
});
