import { describe, expect, it } from '@jest/globals';

import { parseThemePreference, resolveColorScheme } from './theme-preference';

describe('parseThemePreference', () => {
  it.each(['system', 'light', 'dark'] as const)('keeps the stored preference %s', (value) => {
    expect(parseThemePreference(value)).toBe(value);
  });

  it.each([null, undefined, '', 'DARK', 'auto', 1])('falls back to system for %p', (value) => {
    expect(parseThemePreference(value)).toBe('system');
  });
});

describe('resolveColorScheme', () => {
  it('uses the chosen theme regardless of the system', () => {
    expect(resolveColorScheme('dark', 'light')).toBe('dark');
    expect(resolveColorScheme('light', 'dark')).toBe('light');
  });

  it('follows the system when the preference is automatic', () => {
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
    expect(resolveColorScheme('system', 'light')).toBe('light');
  });

  it('falls back to light when the system scheme is unknown', () => {
    expect(resolveColorScheme('system', null)).toBe('light');
    expect(resolveColorScheme('system', 'unspecified')).toBe('light');
  });
});
