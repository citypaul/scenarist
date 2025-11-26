import { describe, it, expect } from 'vitest';
import { matchesRegex } from '../src/domain/regex-matching.js';

describe('matchesRegex', () => {
  it('should match when pattern matches value', () => {
    const result = matchesRegex('summer-premium-sale', { source: 'premium|vip', flags: 'i' });
    expect(result).toBe(true);
  });

  it('should not match when pattern does not match value', () => {
    const result = matchesRegex('summer-sale', { source: 'premium|vip', flags: 'i' });
    expect(result).toBe(false);
  });

  it('should handle case-insensitive flag', () => {
    expect(matchesRegex('PREMIUM', { source: 'premium', flags: 'i' })).toBe(true);
    expect(matchesRegex('PREMIUM', { source: 'premium', flags: '' })).toBe(false);
  });

  it('should handle missing flags (undefined)', () => {
    const result = matchesRegex('premium', { source: 'premium' });
    expect(result).toBe(true);
  });

  it('should match partial strings (not anchored by default)', () => {
    expect(matchesRegex('early-VIP-access', { source: 'vip', flags: 'i' })).toBe(true);
    expect(matchesRegex('partners-premium-tier', { source: 'premium' })).toBe(true);
  });

  it('should handle regex errors gracefully', () => {
    // Invalid regex (unclosed group) - should be caught by schema validation but handle gracefully
    const result = matchesRegex('test', { source: '(unclosed', flags: '' });
    expect(result).toBe(false);
  });
});
