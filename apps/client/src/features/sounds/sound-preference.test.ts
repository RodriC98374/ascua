import { describe, expect, it } from '@jest/globals';

import { parseSoundsEnabled, serializeSoundsEnabled } from './sound-preference';

describe('parseSoundsEnabled', () => {
  it('keeps the stored choice on any platform', () => {
    expect(parseSoundsEnabled('on', 'web')).toBe(true);
    expect(parseSoundsEnabled('off', 'android')).toBe(false);
  });

  it.each([null, undefined, '', 'ON', 'true', 1])(
    'falls back to the platform default for %p',
    (value) => {
      expect(parseSoundsEnabled(value, 'android')).toBe(true);
      expect(parseSoundsEnabled(value, 'web')).toBe(false);
    },
  );
});

describe('serializeSoundsEnabled', () => {
  it('round-trips through parseSoundsEnabled', () => {
    for (const isEnabled of [true, false]) {
      expect(parseSoundsEnabled(serializeSoundsEnabled(isEnabled), 'web')).toBe(isEnabled);
      expect(parseSoundsEnabled(serializeSoundsEnabled(isEnabled), 'android')).toBe(isEnabled);
    }
  });
});
