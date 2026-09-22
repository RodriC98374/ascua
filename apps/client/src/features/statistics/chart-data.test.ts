import { EMPTY_MONTHLY_COUNTERS, type DayStats, type MonthStats } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { axisMax, monthRate, streakPoints, weekBars, yearPoints } from './chart-data';

function day(dateKey: string, overrides: Partial<DayStats> = {}): DayStats {
  return {
    dateKey,
    status: 'completed',
    isToday: false,
    scheduledCount: 2,
    completedCount: 2,
    completionRate: 1,
    pointsEarned: 20,
    streakAfterClose: 3,
    habits: {},
    ...overrides,
  };
}

function month(monthKey: string, completionRate: number | null): MonthStats {
  return { ...EMPTY_MONTHLY_COUNTERS, monthKey, completionRate };
}

describe('streakPoints', () => {
  it('plots only closed days and labels one every five', () => {
    const days = [
      ...Array.from({ length: 7 }, (_, index) =>
        day(`2026-09-0${index + 1}`, { streakAfterClose: index + 1 }),
      ),
      day('2026-09-08', { status: 'open', isToday: true, streakAfterClose: null }),
    ];
    const points = streakPoints(days);
    expect(points.map((point) => point.value)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(points.map((point) => point.label)).toEqual(['1', '', '', '', '', '6', '']);
  });
});

describe('weekBars', () => {
  it('turns each day into a bar with its weekday initial', () => {
    const bars = weekBars([
      day('2026-09-21', { completionRate: 0.5 }),
      day('2026-09-23', { status: 'open', isToday: true, completionRate: 2 / 3 }),
      day('2026-09-24', { status: 'future', completionRate: null }),
    ]);
    expect(bars).toEqual([
      {
        dateKey: '2026-09-21',
        value: 50,
        label: 'L',
        status: 'completed',
        isToday: false,
        isEmpty: false,
      },
      {
        dateKey: '2026-09-23',
        value: 67,
        label: 'X',
        status: 'open',
        isToday: true,
        isEmpty: false,
      },
      {
        dateKey: '2026-09-24',
        value: 0,
        label: 'J',
        status: 'future',
        isToday: false,
        isEmpty: true,
      },
    ]);
  });
});

describe('yearPoints', () => {
  it('skips the months without closed days instead of drawing them as 0%', () => {
    expect(
      yearPoints([month('2026-07', null), month('2026-08', 0.564), month('2026-09', 0.8)]),
    ).toEqual([
      { monthKey: '2026-08', value: 56, label: 'Ago' },
      { monthKey: '2026-09', value: 80, label: 'Sep' },
    ]);
  });

  it('plots a single habit when one is chosen, skipping the months it did not count', () => {
    const august = {
      ...month('2026-08', 0.5),
      habitStats: { reading: { scheduledDays: 31, completedDays: 31 } },
    };
    const september = {
      ...month('2026-09', 0.8),
      habitStats: { water: { scheduledDays: 10, completedDays: 4 } },
    };
    expect(yearPoints([august, september], 'reading')).toEqual([
      { monthKey: '2026-08', value: 100, label: 'Ago' },
    ]);
    expect(monthRate(september, 'water')).toBe(0.4);
    expect(monthRate(september, 'reading')).toBeNull();
    expect(monthRate(september, null)).toBe(0.8);
  });
});

describe('axisMax', () => {
  it('rounds the top of the axis up to a multiple of the sections', () => {
    expect(axisMax([3, 9, 6], 4)).toBe(12);
    expect(axisMax([12], 4)).toBe(12);
  });

  it('keeps a minimal axis when every value is small or there are none', () => {
    expect(axisMax([0, 1], 4)).toBe(4);
    expect(axisMax([], 4)).toBe(4);
  });
});
