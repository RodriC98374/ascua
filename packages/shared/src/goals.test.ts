import { describe, expect, it } from 'vitest';

import { GOAL_HABIT_LOOKBACK_DAYS } from './constants';
import { goalDeadline, goalHabitProgress, goalHabitRange, goalTaskProgress } from './goals';
import type { DailyLog, Goal, Habit, Task } from './types';

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    title: 'Aprobar Cálculo',
    description: null,
    targetDateKey: null,
    habitIds: [],
    taskIds: [],
    status: 'active',
    startDateKey: '2026-09-21',
    achievedDateKey: null,
    sortOrder: 0,
    ...overrides,
  };
}

function task(id: string, completedDateKey: string | null): Task {
  return { id, title: id, size: 'small', dueDateKey: '2026-09-25', completedDateKey };
}

function habit(id: string, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    tier: 'primary',
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-09-01',
    archivedDateKey: null,
    ...overrides,
  };
}

function closedLog(dateKey: string, scheduled: string[], completed: string[]): DailyLog {
  return {
    dateKey,
    entries: {},
    status: completed.length === scheduled.length ? 'completed' : 'missed',
    summary: {
      scheduledHabitIds: scheduled,
      scheduledPrimaryHabitIds: scheduled,
      completedHabitIds: completed,
      completionRate: scheduled.length > 0 ? completed.length / scheduled.length : 0,
      isPerfectDay: completed.length === scheduled.length,
      pointsEarned: 0,
      streakAfterClose: 0,
    },
  };
}

describe('goalTaskProgress', () => {
  it('counts the done tasks of the goal', () => {
    const progress = goalTaskProgress(goal({ taskIds: ['a', 'b', 'c'] }), [
      task('a', '2026-09-22'),
      task('b', null),
      task('c', '2026-09-23'),
      task('other', '2026-09-23'),
    ]);
    expect(progress).toEqual({ done: 2, total: 3, rate: 2 / 3 });
  });

  it('ignores deleted tasks that are still listed', () => {
    const progress = goalTaskProgress(goal({ taskIds: ['a', 'gone'] }), [task('a', null)]);
    expect(progress).toEqual({ done: 0, total: 1, rate: 0 });
  });

  it('has no rate without tasks', () => {
    expect(goalTaskProgress(goal(), [])).toEqual({ done: 0, total: 0, rate: null });
  });
});

describe('goalHabitRange', () => {
  it('goes from the start of the goal to today', () => {
    expect(goalHabitRange(goal(), '2026-09-29')).toEqual({
      startDateKey: '2026-09-21',
      endDateKey: '2026-09-29',
    });
  });

  it('stops the day the goal was achieved', () => {
    const achieved = goal({ status: 'achieved', achievedDateKey: '2026-09-25' });
    expect(goalHabitRange(achieved, '2026-09-29').endDateKey).toBe('2026-09-25');
  });

  it('looks back at most a year', () => {
    const old = goal({ startDateKey: '2024-01-01' });
    expect(goalHabitRange(old, '2026-09-29').startDateKey).toBe('2025-09-30');
    expect(GOAL_HABIT_LOOKBACK_DAYS).toBe(365);
  });
});

describe('goalHabitProgress', () => {
  const habits = [habit('read'), habit('run'), habit('swim')];
  const logs = [
    closedLog('2026-09-20', ['read', 'run'], ['read', 'run']),
    closedLog('2026-09-21', ['read', 'run'], ['read']),
    closedLog('2026-09-22', ['read', 'run'], ['read', 'run']),
  ];

  it('measures each linked habit on the closed days since the goal started', () => {
    const rows = goalHabitProgress({
      goal: goal({ habitIds: ['run', 'read'] }),
      habits,
      logs,
      today: '2026-09-23',
    });
    expect(rows.map((row) => [row.habit.id, row.completedDays, row.scheduledDays])).toEqual([
      ['run', 1, 2],
      ['read', 2, 2],
    ]);
    expect(rows[0]?.completionRate).toBe(0.5);
  });

  it('keeps a linked habit without closed days, with no rate', () => {
    const rows = goalHabitProgress({
      goal: goal({ habitIds: ['swim'] }),
      habits,
      logs,
      today: '2026-09-23',
    });
    expect(rows).toEqual([
      { habit: habits[2], scheduledDays: 0, completedDays: 0, completionRate: null },
    ]);
  });

  it('keeps a linked habit that did not count any day of the range', () => {
    const archived = habit('old', { status: 'archived', archivedDateKey: '2026-09-10' });
    const rows = goalHabitProgress({
      goal: goal({ habitIds: ['old'] }),
      habits: [archived],
      logs,
      today: '2026-09-23',
    });
    expect(rows).toEqual([
      { habit: archived, scheduledDays: 0, completedDays: 0, completionRate: null },
    ]);
  });

  it('skips linked habits that no longer exist', () => {
    const rows = goalHabitProgress({
      goal: goal({ habitIds: ['gone', 'read'] }),
      habits,
      logs,
      today: '2026-09-23',
    });
    expect(rows.map((row) => row.habit.id)).toEqual(['read']);
  });
});

describe('goalDeadline', () => {
  it('has no deadline without a target date', () => {
    expect(goalDeadline(goal(), '2026-09-29')).toBeNull();
  });

  it('counts the days left, zero on the day and negative when late', () => {
    const withDate = goal({ targetDateKey: '2026-10-09' });
    expect(goalDeadline(withDate, '2026-09-29')).toEqual({ daysLeft: 10, isOverdue: false });
    expect(goalDeadline(withDate, '2026-10-09')).toEqual({ daysLeft: 0, isOverdue: false });
    expect(goalDeadline(withDate, '2026-10-11')).toEqual({ daysLeft: -2, isOverdue: true });
  });

  it('is never overdue once the goal is achieved', () => {
    const achieved = goal({
      targetDateKey: '2026-10-09',
      status: 'achieved',
      achievedDateKey: '2026-10-12',
    });
    expect(goalDeadline(achieved, '2026-10-20')).toBeNull();
  });
});
