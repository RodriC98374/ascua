import { EMPTY_MONTHLY_COUNTERS, type DayStats, type Habit } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import {
  describeDay,
  formatPercent,
  habitCaption,
  habitDaysLine,
  monthCaption,
  percentValue,
  pointsLine,
  summaryTiles,
} from './statistics-text';

function day(overrides: Partial<DayStats>): DayStats {
  return {
    dateKey: '2026-09-15',
    status: 'completed',
    isToday: false,
    scheduledCount: 6,
    completedCount: 4,
    completionRate: 4 / 6,
    pointsEarned: 45,
    streakAfterClose: 12,
    habits: {},
    ...overrides,
  };
}

const READING: Habit = {
  id: 'reading',
  name: 'Leer',
  tier: 'primary',
  schedule: { type: 'daily' },
  status: 'active',
  startDateKey: '2026-09-01',
  archivedDateKey: null,
};

describe('formatPercent', () => {
  it('rounds to a whole percentage', () => {
    expect(formatPercent(2 / 3)).toBe('67%');
    expect(formatPercent(1)).toBe('100%');
  });

  it('shows a dash when there is nothing to measure', () => {
    expect(formatPercent(null)).toBe('—');
    expect(percentValue(null)).toBe(0);
  });
});

describe('describeDay', () => {
  it('sums up a closed day with its points and streak', () => {
    expect(describeDay(day({}))).toBe('4 de 6 hábitos (67%) · +45 pts · racha de 12 días');
  });

  it('credits the protector on a frozen day', () => {
    expect(
      describeDay(
        day({
          status: 'frozen',
          completedCount: 1,
          scheduledCount: 1,
          completionRate: 1,
          streakAfterClose: 1,
        }),
      ),
    ).toBe('1 de 1 hábito (100%) · +45 pts · un protector cuidó tu racha de 1 día');
  });

  it('does not talk about the streak on a missed day', () => {
    expect(describeDay(day({ status: 'missed', streakAfterClose: 0 }))).toBe(
      '4 de 6 hábitos (67%) · +45 pts',
    );
  });

  it('explains that today still counts until it closes', () => {
    expect(
      describeDay(
        day({ status: 'open', isToday: true, pointsEarned: null, streakAfterClose: null }),
      ),
    ).toBe('4 de 6 hábitos hasta ahora. Se suma al cerrar el día.');
    expect(describeDay(day({ status: 'open', pointsEarned: null }))).toBe(
      '4 de 6 hábitos. Se suma en cuanto la app cierre el día.',
    );
  });

  it('covers days without habits or data', () => {
    expect(describeDay(day({ status: 'inactive' }))).toBe('No tenías hábitos ese día.');
    expect(describeDay(day({ status: 'no_data' }))).toBe('Todavía no tenías hábitos.');
    expect(describeDay(day({ status: 'future' }))).toBe('Este día todavía no llega.');
  });
});

describe('habitCaption', () => {
  it('counts the closed days of the habit', () => {
    expect(
      habitCaption({
        habit: READING,
        scheduledDays: 21,
        completedDays: 18,
        completionRate: 18 / 21,
      }),
    ).toBe('18 de 21 días');
  });

  it('explains a habit without closed days yet', () => {
    expect(
      habitCaption({ habit: READING, scheduledDays: 0, completedDays: 0, completionRate: null }),
    ).toBe('Cuenta desde que cierre su primer día');
  });
});

describe('habitDaysLine', () => {
  it('adds up the habit-days of the period', () => {
    expect(
      habitDaysLine({
        ...EMPTY_MONTHLY_COUNTERS,
        closedDays: 30,
        habitStats: {
          reading: { scheduledDays: 30, completedDays: 25 },
          water: { scheduledDays: 20, completedDays: 10 },
        },
      }),
    ).toBe('35 de 50 hábitos cumplidos en 30 días');
  });
});

describe('summaryTiles', () => {
  it('splits perfect days from the other completed days', () => {
    const tiles = summaryTiles({
      ...EMPTY_MONTHLY_COUNTERS,
      completedDays: 16,
      perfectDays: 4,
      frozenDays: 1,
      missedDays: 2,
    });
    expect(tiles).toEqual([
      { status: 'perfect', count: 4, label: 'días perfectos' },
      { status: 'completed', count: 12, label: 'días cumplidos' },
      { status: 'frozen', count: 1, label: 'día protegido' },
      { status: 'missed', count: 2, label: 'días perdidos' },
    ]);
  });
});

describe('monthCaption', () => {
  it('counts the closed and perfect days of the month', () => {
    expect(monthCaption({ ...EMPTY_MONTHLY_COUNTERS, closedDays: 30, perfectDays: 5 })).toBe(
      '30 días cerrados · 5 perfectos',
    );
    expect(monthCaption({ ...EMPTY_MONTHLY_COUNTERS, closedDays: 1, perfectDays: 1 })).toBe(
      '1 día cerrado · 1 perfecto',
    );
  });
});

describe('pointsLine', () => {
  it('shows what was earned and, if known, what was spent', () => {
    expect(pointsLine(320, 150)).toBe('+320 pts ganados · 150 gastados');
    expect(pointsLine(320, 0)).toBe('+320 pts ganados');
    expect(pointsLine(320, null)).toBe('+320 pts ganados');
  });
});
