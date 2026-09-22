import { describe, expect, it } from 'vitest';

import { formatLongDate } from './format-date';

describe('formatLongDate', () => {
  it('writes the weekday and the date in Spanish', () => {
    expect(formatLongDate('2026-09-21')).toBe('Lunes, 21 de septiembre');
  });

  it('handles Sundays and single-digit days', () => {
    expect(formatLongDate('2026-09-27')).toBe('Domingo, 27 de septiembre');
    expect(formatLongDate('2027-01-01')).toBe('Viernes, 1 de enero');
  });

  it('handles the leap day', () => {
    expect(formatLongDate('2028-02-29')).toBe('Martes, 29 de febrero');
  });
});
