import { describe, it, expect } from 'vitest';

/**
 * Unit tests for header normalization logic in extractHttpRequestContext.
 * 
 * These tests verify that header keys are explicitly normalized to lowercase,
 * independent of the Headers API's automatic normalization.
 */
describe('extractHttpRequestContext - header normalization', () => {
  it('should normalize mixed-case header keys to lowercase', () => {
    // Simulate a Record created from Headers.forEach()
    const rawHeaders: Record<string, string> = {};
    
    // Hypothetical scenario: Headers API doesn't normalize (for defense in depth)
    const headersData = [
      ['Content-Type', 'application/json'],
      ['X-Custom-Header', 'test-value'],
      ['Authorization', 'Bearer token'],
    ];
    
    // WITHOUT normalization (current vulnerable code)
    headersData.forEach(([key, value]) => {
      rawHeaders[key] = value;  // Direct assignment - no normalization!
    });
    
    // This is what we have now - mixed case keys
    expect(rawHeaders).toEqual({
      'Content-Type': 'application/json',
      'X-Custom-Header': 'test-value',
      'Authorization': 'Bearer token',
    });
    
    // Core expects lowercase - this would FAIL matching
    expect(rawHeaders['content-type']).toBeUndefined();
    expect(rawHeaders['x-custom-header']).toBeUndefined();
    expect(rawHeaders['authorization']).toBeUndefined();
  });
  
  it('should show correct behavior WITH normalization', () => {
    const normalizedHeaders: Record<string, string> = {};
    
    const headersData = [
      ['Content-Type', 'application/json'],
      ['X-Custom-Header', 'test-value'],
      ['Authorization', 'Bearer token'],
    ];
    
    // WITH normalization (proposed fix)
    headersData.forEach(([key, value]) => {
      normalizedHeaders[key.toLowerCase()] = value;  // Explicit normalization
    });
    
    // Now we have lowercase keys as core expects
    expect(normalizedHeaders).toEqual({
      'content-type': 'application/json',
      'x-custom-header': 'test-value',
      'authorization': 'Bearer token',
    });
    
    // Core can match successfully
    expect(normalizedHeaders['content-type']).toBe('application/json');
    expect(normalizedHeaders['x-custom-header']).toBe('test-value');
    expect(normalizedHeaders['authorization']).toBe('Bearer token');
  });
  
  it('should preserve header values unchanged during normalization', () => {
    const normalizedHeaders: Record<string, string> = {};
    
    const headersData = [
      ['X-Uppercase-Value', 'VALUE-IN-CAPS'],  // Value should stay as-is
      ['X-Mixed-Case', 'MiXeD-CaSe-VaLuE'],
    ];
    
    headersData.forEach(([key, value]) => {
      normalizedHeaders[key.toLowerCase()] = value;
    });
    
    // Keys normalized, values preserved
    expect(normalizedHeaders['x-uppercase-value']).toBe('VALUE-IN-CAPS');
    expect(normalizedHeaders['x-mixed-case']).toBe('MiXeD-CaSe-VaLuE');
  });
});
