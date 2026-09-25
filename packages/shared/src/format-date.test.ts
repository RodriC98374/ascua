import { describe, expect, it } from 'vitest';

import {
  formatDateRange,
  formatLongDate,
  formatMonthAbbrev,
  formatMonthYear,
  formatShortDate,
  formatShortWeekday,
  formatWeekdayInitial,
} from './format-date';

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

describe('formatMonthYear', () => {
  it('capitalizes the month and adds the year', () => {
    expect(formatMonthYear('2026-09')).toBe('Septiembre 2026');
    expect(formatMonthYear('2027-01')).toBe('Enero 2027');
  });
});

describe('formatMonthAbbrev', () => {
  it('uses the capitalized three-letter abbreviation', () => {
    expect(formatMonthAbbrev('2026-09')).toBe('Sep');
    expect(formatMonthAbbrev('2026-12')).toBe('Dic');
  });
});

describe('formatShortDate', () => {
  it('writes the day and the abbreviated month', () => {
    expect(formatShortDate('2026-09-05')).toBe('5 sep');
    expect(formatShortDate('2026-01-31')).toBe('31 ene');
  });
});

describe('formatDateRange', () => {
  it('writes the month and year once when both days share them', () => {
    expect(formatDateRange('2026-09-14', '2026-09-20')).toBe('14 – 20 sep 2026');
  });

  it('writes both months when the range crosses a month', () => {
    expect(formatDateRange('2026-09-28', '2026-10-04')).toBe('28 sep – 4 oct 2026');
  });

  it('writes both years when the range crosses a year', () => {
    expect(formatDateRange('2025-12-29', '2026-01-04')).toBe('29 dic 2025 – 4 ene 2026');
  });
});

describe('formatWeekdayInitial', () => {
  it('uses X for Wednesday, as calendars in Spanish do', () => {
    expect(formatWeekdayInitial('2026-09-21')).toBe('L');
    expect(formatWeekdayInitial('2026-09-23')).toBe('X');
    expect(formatWeekdayInitial('2026-09-27')).toBe('D');
  });
});

describe('formatShortWeekday', () => {
  it('writes the short weekday and the day number', () => {
    expect(formatShortWeekday('2026-09-21')).toBe('Lun 21');
    expect(formatShortWeekday('2026-09-23')).toBe('Mié 23');
    expect(formatShortWeekday('2026-10-04')).toBe('Dom 4');
  });
});
