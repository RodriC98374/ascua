import { describe, expect, it } from '@jest/globals';

import { darkColors, lightColors } from './colors';
import palette from './palette.json';

describe('palette', () => {
  it('defines every token in both themes', () => {
    expect(Object.keys(palette.dark).sort()).toEqual(Object.keys(palette.light).sort());
  });

  it('uses six-digit hex colors, as tailwind.config.js turns them into CSS variables', () => {
    for (const value of [...Object.values(palette.light), ...Object.values(palette.dark)]) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('theme colors', () => {
  it('exposes each token in camelCase for the props that do not take classes', () => {
    expect(lightColors.surface200).toBe(palette.light['surface-200']);
    expect(lightColors.inkMuted).toBe(palette.light['ink-muted']);
    expect(darkColors.emberStrong).toBe(palette.dark['ember-strong']);
    expect(darkColors.vacioSoft).toBe(palette.dark['vacio-soft']);
  });

  it('builds the brand gradient from each theme', () => {
    expect(lightColors.emberGradient).toEqual([palette.light.ember, palette.light['ember-glow']]);
    expect(darkColors.emberGradient).toEqual([palette.dark.ember, palette.dark['ember-glow']]);
  });

  it('keeps text on light fills dark in both themes', () => {
    expect(darkColors.inkOnFill).toBe(lightColors.inkOnFill);
  });
});
