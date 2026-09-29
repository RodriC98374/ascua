import { describe, expect, it } from 'vitest';

import { INSIGHT_MIN_HABIT_DAYS, INSIGHT_MIN_WEEKDAY_DAYS } from './constants';
import {
  bestWeekdays,
  completionTrend,
  heatLevel,
  heatmapWeeks,
  mostConsistentHabit,
} from './insights';
import type { DayStats, DayStatsStatus, HabitPeriodStats } from './statistics';
import type { Habit } from './types';

function day(dateKey: string, status: DayStatsStatus, completionRate: number | null): DayStats {
  return {
    dateKey,
    status,
    isToday: false,
    scheduledCount: 0,
    completedCount: 0,
    completionRate,
    pointsEarned: null,
    streakAfterClose: null,
    habits: {},
  };
}

function row(
  id: string,
  scheduledDays: number,
  completedDays: number,
  schedule: Habit['schedule'] = { type: 'daily' },
): HabitPeriodStats {
  const habit: Habit = {
    id,
    name: id,
    tier: 'primary',
    schedule,
    status: 'active',
    startDateKey: '2026-01-01',
    archivedDateKey: null,
  };
  return {
    habit,
    scheduledDays,
    completedDays,
    completionRate: scheduledDays > 0 ? Math.min(1, completedDays / scheduledDays) : null,
  };
}

describe('heatLevel', () => {
  it('has no level when no habit counted', () => {
    expect(heatLevel(null)).toBeNull();
  });

  it('grows with the completion rate', () => {
    expect(heatLevel(0)).toBe(0);
    expect(heatLevel(0.25)).toBe(1);
    expect(heatLevel(1 / 3)).toBe(1);
    expect(heatLevel(0.5)).toBe(2);
    expect(heatLevel(2 / 3)).toBe(2);
    expect(heatLevel(0.75)).toBe(3);
    expect(heatLevel(0.99)).toBe(3);
    expect(heatLevel(1)).toBe(4);
  });
});

describe('heatmapWeeks', () => {
  it('splits the days into Monday-first weeks, padding the edges', () => {
    // 01-01-2026 es jueves; el 11 es domingo.
    const days = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(
      (dd) => ({ dateKey: `2026-01-${dd}` }),
    );
    const weeks = heatmapWeeks(days);
    expect(weeks.map((week) => week.map((item) => item?.dateKey.slice(8) ?? null))).toEqual([
      [null, null, null, '01', '02', '03', '04'],
      ['05', '06', '07', '08', '09', '10', '11'],
      ['12', null, null, null, null, null, null],
    ]);
  });

  it('returns no weeks without days', () => {
    expect(heatmapWeeks([])).toEqual([]);
  });
});

describe('bestWeekdays', () => {
  // Lunes 07-09-2026 a domingo 20-09-2026: dos semanas.
  const twoWeeks = (rateOf: (weekday: number) => number) =>
    Array.from({ length: 14 }, (_, index) => {
      const dateKey = `2026-09-${String(7 + index).padStart(2, '0')}`;
      return day(dateKey, 'completed', rateOf((index % 7) + 1));
    });

  it('finds the weekday with the best average among closed days', () => {
    const days = twoWeeks((weekday) => (weekday === 2 ? 1 : 0.5));
    expect(bestWeekdays(days)).toEqual({ weekdays: [2], completionRate: 1 });
  });

  it('returns every weekday tied at the top', () => {
    const days = twoWeeks((weekday) => (weekday === 2 || weekday === 5 ? 0.9 : 0.4));
    expect(bestWeekdays(days)).toEqual({ weekdays: [2, 5], completionRate: 0.9 });
  });

  it('ignores open, inactive, future and empty days', () => {
    const days = [
      ...twoWeeks((weekday) => (weekday === 1 ? 0.8 : 0.5)),
      day('2026-09-22', 'open', 1),
      day('2026-09-23', 'open', 1),
      day('2026-09-15', 'inactive', null),
    ];
    // El martes 22 abierto al 100 % no cuenta: el mejor sigue siendo el lunes.
    expect(bestWeekdays(days)?.weekdays).toEqual([1]);
  });

  it('needs enough closed days of a weekday to count it', () => {
    const days = twoWeeks(() => 0.5);
    days.push(day('2026-09-22', 'perfect', 1)); // un solo martes más
    days.splice(1, 1); // queda un solo martes cerrado antes
    // Martes: 2 días (0.5 y 1) = 0.75 > 0.5.
    expect(bestWeekdays(days)).toEqual({ weekdays: [2], completionRate: 0.75 });
    expect(bestWeekdays(days.filter((item) => item.dateKey !== '2026-09-22'))).toBeNull();
    expect(INSIGHT_MIN_WEEKDAY_DAYS).toBe(2);
  });

  it('counts frozen and missed days with their real rate', () => {
    const days = twoWeeks(() => 0.5).map((item, index) =>
      index === 0 || index === 7 ? day(item.dateKey, index === 0 ? 'frozen' : 'missed', 0) : item,
    );
    // Los lunes quedan en 0; el resto empata a 0.5.
    expect(bestWeekdays(days)).toEqual({ weekdays: [2, 3, 4, 5, 6, 7], completionRate: 0.5 });
  });

  it('has no best day when every weekday is tied or only one qualifies', () => {
    expect(bestWeekdays(twoWeeks(() => 0.7))).toBeNull();
    const onlyMondays = twoWeeks(() => 1).filter((_, index) => index % 7 === 0);
    expect(bestWeekdays(onlyMondays)).toBeNull();
    expect(bestWeekdays([])).toBeNull();
  });
});

describe('mostConsistentHabit', () => {
  it('picks the habit with the highest rate', () => {
    const rows = [row('a', 10, 6), row('b', 10, 9), row('c', 10, 7)];
    expect(mostConsistentHabit(rows)?.habit.id).toBe('b');
  });

  it('breaks ties by completed days, then keeps the given order', () => {
    expect(mostConsistentHabit([row('a', 5, 5), row('b', 10, 10)])?.habit.id).toBe('b');
    expect(mostConsistentHabit([row('a', 10, 10), row('b', 10, 10)])?.habit.id).toBe('a');
  });

  it('ignores habits with too few days', () => {
    const few = INSIGHT_MIN_HABIT_DAYS - 1;
    const rows = [row('new', few, few), row('a', 10, 6), row('b', 10, 8)];
    expect(mostConsistentHabit(rows)?.habit.id).toBe('b');
  });

  it('leaves out weekly habits, whose marks can go past what the week asks', () => {
    const weekly = row('swim', 12, 20, { type: 'times_per_week', timesPerWeek: 3 });
    const rows = [weekly, row('a', 10, 8), row('b', 10, 9)];
    expect(mostConsistentHabit(rows)?.habit.id).toBe('b');
    expect(mostConsistentHabit([weekly, row('a', 10, 8)])).toBeNull();
  });

  it('counts fixed-days habits', () => {
    const gym = row('gym', 8, 8, { type: 'days_of_week', daysOfWeek: [1, 3] });
    expect(mostConsistentHabit([gym, row('a', 10, 8)])?.habit.id).toBe('gym');
  });

  it('needs at least two habits to compare', () => {
    expect(mostConsistentHabit([row('a', 10, 8), row('new', 2, 2)])).toBeNull();
    expect(mostConsistentHabit([])).toBeNull();
  });
});

describe('completionTrend', () => {
  it('returns the difference in percentage points, rounded', () => {
    expect(completionTrend(0.8, 0.65)).toBe(15);
    expect(completionTrend(0.5, 0.726)).toBe(-23);
    expect(completionTrend(0.7, 0.7)).toBe(0);
  });

  it('matches the rounded percentages shown next to it', () => {
    // 77 % contra 78 %: un punto, aunque la diferencia exacta sea 1,95.
    expect(completionTrend(0.7654, 0.7849)).toBe(-1);
  });

  it('has no trend without both rates', () => {
    expect(completionTrend(null, 0.5)).toBeNull();
    expect(completionTrend(0.5, null)).toBeNull();
  });
});
