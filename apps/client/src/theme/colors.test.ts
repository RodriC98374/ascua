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

// Contraste (WCAG) de los pares que la app usa de verdad. Si se cambia un token y un par deja de
// leerse, este test lo dice antes de que llegue a una pantalla.
describe('contrast', () => {
  type Token = keyof typeof palette.light;
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex: string) =>
    0.2126 * channel(parseInt(hex.slice(1, 3), 16)) +
    0.7152 * channel(parseInt(hex.slice(3, 5), 16)) +
    0.0722 * channel(parseInt(hex.slice(5, 7), 16));
  const contrast = (a: string, b: string) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (light + 0.05) / (dark + 0.05);
  };
  const themes = ['light', 'dark'] as const;

  /** Texto sobre su fondo: al menos 4,5:1. */
  const TEXT_PAIRS: [Token, Token][] = [
    ['ink', 'surface-100'],
    ['ink', 'surface-200'],
    ['ink', 'surface-300'],
    ['ink-muted', 'surface-100'],
    ['ink-muted', 'surface-200'],
    ['ink-muted', 'surface-300'],
    ['ember-strong', 'surface-100'],
    ['ember-strong', 'surface-200'],
    // La opción elegida y los chips de logro.
    ['ember-strong', 'warning-soft'],
    ['ink-on-fill', 'ember'],
    ['ink-on-fill', 'ember-glow'],
    ['success', 'surface-200'],
    ['success', 'success-soft'],
    ['warning', 'surface-200'],
    ['warning', 'warning-soft'],
    ['error', 'surface-200'],
    ['error', 'error-soft'],
    ['protegido', 'protegido-soft'],
    ['on-success', 'success-fill'],
    ['on-error', 'error-fill'],
    // Etiquetas de nivel de las recompensas.
    ['week-azul', 'week-azul-soft'],
    ['week-morado', 'surface-100'],
  ];

  it.each(themes)('keeps every text pair readable in the %s theme', (theme) => {
    const tokens = palette[theme];
    for (const [text, background] of TEXT_PAIRS) {
      const ratio = contrast(tokens[text], tokens[background]);
      expect(`${text} on ${background}: ${ratio >= 4.5}`).toBe(`${text} on ${background}: true`);
    }
  });

  it.each(themes)(
    'keeps ink-faint visible for borders, icons and placeholders in the %s theme',
    (theme) => {
      const tokens = palette[theme];
      for (const background of ['surface-100', 'surface-200', 'surface-300'] as const) {
        expect(contrast(tokens['ink-faint'], tokens[background])).toBeGreaterThanOrEqual(3);
      }
    },
  );
});
