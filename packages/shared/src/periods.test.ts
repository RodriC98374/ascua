import { describe, expect, it } from 'vitest';

import {
  describePeriodRelative,
  formatPeriodLabel,
  monthWeekIndex,
  periodContaining,
  periodNavigation,
  shiftPeriod,
  type Period,
} from './periods';

const week = (startDateKey: string, endDateKey: string): Period => ({
  kind: 'week',
  startDateKey,
  endDateKey,
});
const month = (startDateKey: string, endDateKey: string): Period => ({
  kind: 'month',
  startDateKey,
  endDateKey,
});

describe('periodContaining', () => {
  it('returns the Monday to Sunday week of the day', () => {
    expect(periodContaining('week', '2026-09-23')).toEqual(week('2026-09-21', '2026-09-27'));
  });

  it('keeps a Sunday in the week that started on the previous Monday', () => {
    expect(periodContaining('week', '2026-09-27')).toEqual(week('2026-09-21', '2026-09-27'));
  });

  it('returns the calendar month', () => {
    expect(periodContaining('month', '2026-09-23')).toEqual(month('2026-09-01', '2026-09-30'));
    expect(periodContaining('month', '2026-12-31')).toEqual(month('2026-12-01', '2026-12-31'));
  });

  it('knows the length of February in leap years', () => {
    expect(periodContaining('month', '2028-02-10')).toEqual(month('2028-02-01', '2028-02-29'));
    expect(periodContaining('month', '2026-02-10')).toEqual(month('2026-02-01', '2026-02-28'));
  });

  it('returns the calendar year', () => {
    expect(periodContaining('year', '2026-09-23')).toEqual({
      kind: 'year',
      startDateKey: '2026-01-01',
      endDateKey: '2026-12-31',
    });
  });
});

describe('shiftPeriod', () => {
  it('moves a week by seven days', () => {
    expect(shiftPeriod(week('2026-09-21', '2026-09-27'), -1)).toEqual(
      week('2026-09-14', '2026-09-20'),
    );
    expect(shiftPeriod(week('2026-12-28', '2027-01-03'), 1)).toEqual(
      week('2027-01-04', '2027-01-10'),
    );
  });

  it('moves a month across the year boundary', () => {
    expect(shiftPeriod(month('2026-12-01', '2026-12-31'), 1)).toEqual(
      month('2027-01-01', '2027-01-31'),
    );
    expect(shiftPeriod(month('2026-01-01', '2026-01-31'), -1)).toEqual(
      month('2025-12-01', '2025-12-31'),
    );
  });

  it('moves from a 31-day month into February without skipping it', () => {
    expect(shiftPeriod(month('2026-01-01', '2026-01-31'), 1)).toEqual(
      month('2026-02-01', '2026-02-28'),
    );
  });

  it('moves a year', () => {
    expect(shiftPeriod(periodContaining('year', '2026-05-05'), -1)).toEqual(
      periodContaining('year', '2025-05-05'),
    );
  });
});

describe('periodNavigation', () => {
  const today = '2026-09-23';
  const september = periodContaining('month', today);

  it('has no next period while the current one contains today', () => {
    expect(periodNavigation(september, { today, firstDateKey: '2026-01-10' }).next).toBeNull();
  });

  it('goes forward from a past period', () => {
    const august = shiftPeriod(september, -1);
    expect(periodNavigation(august, { today, firstDateKey: '2026-01-10' }).next).toEqual(september);
  });

  it('goes back while the previous period reaches the first day with habits', () => {
    const navigation = periodNavigation(september, { today, firstDateKey: '2026-08-31' });
    expect(navigation.previous).toEqual(shiftPeriod(september, -1));
  });

  it('has no previous period before the first day with habits', () => {
    expect(periodNavigation(september, { today, firstDateKey: '2026-09-01' }).previous).toBeNull();
  });

  it('has no previous period when there are no habits yet', () => {
    expect(periodNavigation(september, { today, firstDateKey: null }).previous).toBeNull();
  });
});

describe('formatPeriodLabel', () => {
  it('names each kind of period', () => {
    expect(formatPeriodLabel(week('2026-09-21', '2026-09-27'))).toBe('21 – 27 sep 2026');
    expect(formatPeriodLabel(month('2026-09-01', '2026-09-30'))).toBe('Septiembre 2026');
    expect(formatPeriodLabel(periodContaining('year', '2026-09-23'))).toBe('2026');
  });
});

describe('describePeriodRelative', () => {
  const today = '2026-09-23';

  it('names the current period', () => {
    expect(describePeriodRelative(periodContaining('week', today), today)).toBe('Esta semana');
    expect(describePeriodRelative(periodContaining('month', today), today)).toBe('Este mes');
    expect(describePeriodRelative(periodContaining('year', today), today)).toBe('Este año');
  });

  it('names the previous period', () => {
    const previous = (kind: Period['kind']) => shiftPeriod(periodContaining(kind, today), -1);
    expect(describePeriodRelative(previous('week'), today)).toBe('La semana pasada');
    expect(describePeriodRelative(previous('month'), today)).toBe('El mes pasado');
    expect(describePeriodRelative(previous('year'), today)).toBe('El año pasado');
  });

  it('says nothing about older periods', () => {
    const older = shiftPeriod(periodContaining('month', today), -2);
    expect(describePeriodRelative(older, today)).toBeNull();
  });
});

describe('monthWeekIndex', () => {
  it('groups the days of the month in blocks of seven from day 1', () => {
    expect(monthWeekIndex('2026-09-01')).toBe(0);
    expect(monthWeekIndex('2026-09-07')).toBe(0);
    expect(monthWeekIndex('2026-09-08')).toBe(1);
    expect(monthWeekIndex('2026-09-28')).toBe(3);
    expect(monthWeekIndex('2026-10-31')).toBe(4);
  });
});
