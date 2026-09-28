import type { DailyEntries, GamificationState, HabitRecord, TaskRecord } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { buildTodaySummary } from './today-summary';

const TODAY = '2026-09-21';

function habit(id: string, tier: HabitRecord['tier'], overrides: Partial<HabitRecord> = {}) {
  return {
    id,
    name: id,
    tier,
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-09-01',
    archivedDateKey: null,
    description: null,
    icon: 'check',
    color: '#9FCBAC',
    category: 'health',
    sortOrder: 0,
    ...overrides,
  } satisfies HabitRecord;
}

const state: GamificationState = {
  pointsBalance: 620,
  lifetimePointsEarned: 700,
  lifetimePointsSpent: 80,
  currentStreak: 6,
  longestStreak: 10,
  currentStreakStartDateKey: '2026-09-15',
  daysWithoutFreeze: 6,
  streakFreezesAvailable: 1,
  totalStreakFreezesUsed: 0,
  lastClosedDateKey: '2026-09-20',
  lastSpendTransactionId: null,
};

const habits = [
  habit('read', 'primary', { sortOrder: 2 }),
  habit('water', 'secondary', { sortOrder: 0 }),
  habit('run', 'primary', { sortOrder: 1 }),
  habit('old', 'primary', { status: 'archived', archivedDateKey: '2026-09-10' }),
  habit('future', 'secondary', { startDateKey: '2026-09-22' }),
];

const done = (...ids: string[]): DailyEntries =>
  Object.fromEntries(ids.map((id) => [id, { completed: true }]));

describe('buildTodaySummary', () => {
  it('lists only the habits scheduled today, primaries apart, in the chosen order', () => {
    const summary = buildTodaySummary({ today: TODAY, habits, entries: {}, state });
    expect(summary.primaries.map((h) => h.id)).toEqual(['run', 'read']);
    expect(summary.secondaries.map((h) => h.id)).toEqual(['water']);
  });

  it('shows the current streak while the goal is not met yet', () => {
    const summary = buildTodaySummary({ today: TODAY, habits, entries: done('run'), state });
    expect(summary.isGoalMet).toBe(false);
    expect(summary.streakDays).toBe(6);
    expect(summary.primaryProgress).toEqual({ done: 1, total: 2 });
    expect(summary.pointsToday).toBe(10);
  });

  it('counts today in the streak as soon as the goal is met', () => {
    const summary = buildTodaySummary({
      today: TODAY,
      habits,
      entries: done('run', 'read'),
      state,
    });
    expect(summary.isGoalMet).toBe(true);
    expect(summary.streakDays).toBe(7);
    // 20 de los principales + 20 por los 7 días sin protector.
    expect(summary.pointsToday).toBe(40);
    expect(summary.pointsBreakdown).toEqual({
      primary: 20,
      secondary: 0,
      perfectDay: 0,
      streak: 20,
      tasks: 0,
    });
  });

  it('raises the best streak with today only once the goal is met', () => {
    const best = { ...state, longestStreak: 6 };
    const pending = buildTodaySummary({ today: TODAY, habits, entries: done('run'), state: best });
    expect(pending.longestStreak).toBe(6);
    const met = buildTodaySummary({
      today: TODAY,
      habits,
      entries: done('run', 'read'),
      state: best,
    });
    expect(met.longestStreak).toBe(7);
    // Una mejor racha más larga no cambia.
    expect(
      buildTodaySummary({ today: TODAY, habits, entries: done('run', 'read'), state })
        .longestStreak,
    ).toBe(10);
  });

  it('detects the perfect day and its bonus', () => {
    const summary = buildTodaySummary({
      today: TODAY,
      habits,
      entries: done('run', 'read', 'water'),
      state: { ...state, daysWithoutFreeze: 2 },
    });
    expect(summary.isPerfectDay).toBe(true);
    expect(summary.progressPercent).toBe(100);
    expect(summary.pointsBreakdown).toEqual({
      primary: 20,
      secondary: 5,
      perfectDay: 5,
      streak: 0,
      tasks: 0,
    });
  });

  it('knows which habits are done', () => {
    const summary = buildTodaySummary({ today: TODAY, habits, entries: done('water'), state });
    expect(summary.isDone('water')).toBe(true);
    expect(summary.isDone('run')).toBe(false);
    expect(summary.secondaryProgress).toEqual({ done: 1, total: 1 });
    expect(summary.progressPercent).toBe(33);
  });

  it('adds the tasks completed today to the points of the day, with the cap', () => {
    const task = (id: string, size: TaskRecord['size'], completedDateKey: string | null) =>
      ({
        id,
        title: id,
        size,
        dueDateKey: TODAY,
        completedDateKey,
        createdDateKey: TODAY,
      }) satisfies TaskRecord;
    const summary = buildTodaySummary({
      today: TODAY,
      habits,
      entries: done('water'),
      tasks: [task('a', 'large', TODAY), task('b', 'large', TODAY), task('open', 'small', null)],
      state,
    });
    expect(summary.pointsBreakdown.tasks).toBe(30);
    expect(summary.pointsToday).toBe(35);
    expect(summary.taskPoints).toEqual({ points: 30, uncappedPoints: 40, completedCount: 2 });
    // Las tareas no cuentan para la racha.
    expect(summary.isGoalMet).toBe(false);
  });

  it('has nothing to show without habits', () => {
    const summary = buildTodaySummary({ today: TODAY, habits: [], entries: {}, state });
    expect(summary.hasHabits).toBe(false);
    expect(summary.progressPercent).toBe(0);
  });

  it('reads how much a target habit did today', () => {
    const target = { amount: 8, unit: 'vasos' };
    const withTarget = [...habits, habit('water8', 'secondary', { target })];
    const summary = buildTodaySummary({
      today: TODAY,
      habits: withTarget,
      entries: { water8: { completed: false, count: 3 } },
      state,
    });
    expect(summary.countOf('water8')).toBe(3);
    expect(summary.countOf('run')).toBe(0);
  });

  describe('fixed-days and weekly habits (D20)', () => {
    // TODAY (2026-09-21) es lunes.
    const fixedDays = habit('gym', 'primary', {
      schedule: { type: 'days_of_week', daysOfWeek: [3, 5] },
    });
    const swim = habit('swim', 'secondary', {
      schedule: { type: 'times_per_week', timesPerWeek: 2 },
    });

    it('lists a fixed-days habit apart when it does not touch today', () => {
      const summary = buildTodaySummary({
        today: TODAY,
        habits: [...habits, fixedDays],
        entries: {},
        state,
      });
      expect(summary.notToday.map((h) => h.id)).toEqual(['gym']);
      expect(summary.primaries.map((h) => h.id)).not.toContain('gym');
    });

    it('includes a weekly habit in Hoy any day, with its progress for the week', () => {
      const summary = buildTodaySummary({
        today: TODAY,
        habits: [...habits, swim],
        entries: done('swim'),
        weekLogs: [{ dateKey: TODAY, entries: done('swim') }],
        state,
      });
      expect(summary.weeklies).toEqual([
        { habit: swim, count: 1, target: 2, isMet: false, earnsPointsToday: true },
      ]);
      // No entra en la meta de racha ni en los principales/secundarios de hoy.
      expect(summary.primaries.map((h) => h.id)).not.toContain('swim');
      expect(summary.secondaries.map((h) => h.id)).not.toContain('swim');
    });

    it('turns the week powered once every weekly habit reaches its N', () => {
      const notYet = buildTodaySummary({
        today: TODAY,
        habits: [...habits, swim],
        entries: done('swim'),
        weekLogs: [{ dateKey: TODAY, entries: done('swim') }],
        state,
      });
      expect(notYet.isWeekPowered).toBe(false);

      // Martes: ya hay una marca del lunes, en la misma semana.
      const tuesday = '2026-09-22';
      const powered = buildTodaySummary({
        today: tuesday,
        habits: [...habits, swim],
        entries: done('swim'),
        weekLogs: [
          { dateKey: TODAY, entries: done('swim') },
          { dateKey: tuesday, entries: done('swim') },
        ],
        state,
      });
      expect(powered.isWeekPowered).toBe(true);
    });

    it('has habits to show with only a weekly one, even though it schedules no day', () => {
      const summary = buildTodaySummary({ today: TODAY, habits: [swim], entries: {}, state });
      expect(summary.hasHabits).toBe(true);
    });

    it('has habits to show with only a fixed-days one that does not touch today', () => {
      const summary = buildTodaySummary({ today: TODAY, habits: [fixedDays], entries: {}, state });
      expect(summary.hasHabits).toBe(true);
    });

    it('counts a weekly habit completion in its own tier of the points breakdown', () => {
      const summary = buildTodaySummary({
        today: TODAY,
        habits: [...habits, swim],
        entries: done('swim'),
        weekLogs: [{ dateKey: TODAY, entries: done('swim') }],
        state,
      });
      expect(summary.pointsBreakdown.secondary).toBe(5);
    });
  });
});
