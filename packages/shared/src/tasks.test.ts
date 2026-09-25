import { describe, expect, it } from 'vitest';

import { DAILY_TASK_POINTS_CAP, TASK_POINTS } from './constants';
import { dayTaskPoints, isTaskLocked, overdueDays, todayTaskList } from './tasks';
import type { Task } from './types';

const TODAY = '2026-09-25';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    size: 'medium',
    dueDateKey: TODAY,
    completedDateKey: null,
    ...overrides,
  };
}

describe('TASK_POINTS', () => {
  it('pays more for bigger tasks', () => {
    expect(TASK_POINTS).toEqual({ small: 5, medium: 10, large: 20 });
  });

  it('caps a day at the value of three primary habits', () => {
    expect(DAILY_TASK_POINTS_CAP).toBe(30);
  });
});

describe('dayTaskPoints', () => {
  it('adds the points of the tasks completed that day', () => {
    const tasks = [
      task('a', { size: 'small', completedDateKey: TODAY }),
      task('b', { size: 'medium', completedDateKey: TODAY }),
    ];
    expect(dayTaskPoints(tasks, TODAY)).toEqual({
      points: 15,
      uncappedPoints: 15,
      completedCount: 2,
    });
  });

  it('ignores open tasks and tasks completed on another day', () => {
    const tasks = [
      task('open'),
      task('yesterday', { completedDateKey: '2026-09-24' }),
      task('today', { size: 'small', completedDateKey: TODAY }),
    ];
    expect(dayTaskPoints(tasks, TODAY)).toEqual({
      points: 5,
      uncappedPoints: 5,
      completedCount: 1,
    });
  });

  it('never credits more than the daily cap', () => {
    const tasks = [
      task('a', { size: 'large', completedDateKey: TODAY }),
      task('b', { size: 'large', completedDateKey: TODAY }),
    ];
    expect(dayTaskPoints(tasks, TODAY)).toEqual({
      points: DAILY_TASK_POINTS_CAP,
      uncappedPoints: 40,
      completedCount: 2,
    });
  });

  it('is zero without completed tasks', () => {
    expect(dayTaskPoints([task('open')], TODAY)).toEqual({
      points: 0,
      uncappedPoints: 0,
      completedCount: 0,
    });
  });
});

describe('todayTaskList', () => {
  const tasks = [
    task('upcoming-far', { dueDateKey: '2026-10-02' }),
    task('overdue-recent', { dueDateKey: '2026-09-24' }),
    task('today-open'),
    task('done-today', { completedDateKey: TODAY, dueDateKey: '2026-09-20' }),
    task('upcoming-soon', { dueDateKey: '2026-09-26' }),
    task('overdue-old', { dueDateKey: '2026-09-20' }),
    task('done-before', { completedDateKey: '2026-09-24', dueDateKey: '2026-09-24' }),
  ];
  const list = todayTaskList(tasks, TODAY);
  const ids = (group: readonly Task[]) => group.map((item) => item.id);

  it('shows overdue tasks first, the oldest on top', () => {
    expect(ids(list.overdue)).toEqual(['overdue-old', 'overdue-recent']);
  });

  it('keeps the tasks due today', () => {
    expect(ids(list.dueToday)).toEqual(['today-open']);
  });

  it('keeps the tasks completed today, whatever their due date', () => {
    expect(ids(list.doneToday)).toEqual(['done-today']);
  });

  it('lists upcoming tasks by date', () => {
    expect(ids(list.upcoming)).toEqual(['upcoming-soon', 'upcoming-far']);
  });

  it('leaves out tasks completed on past days', () => {
    const all = [...list.overdue, ...list.dueToday, ...list.doneToday, ...list.upcoming];
    expect(ids(all)).not.toContain('done-before');
  });

  it('breaks ties on the same date by title', () => {
    const sameDay = todayTaskList(
      [task('2', { title: 'Zapatos' }), task('1', { title: 'Agenda' })],
      TODAY,
    );
    expect(ids(sameDay.dueToday)).toEqual(['1', '2']);
  });
});

describe('overdueDays', () => {
  it('counts the days since the due date', () => {
    expect(overdueDays(task('a', { dueDateKey: '2026-09-24' }), TODAY)).toBe(1);
    expect(overdueDays(task('a', { dueDateKey: '2026-09-20' }), TODAY)).toBe(5);
  });

  it('is zero for tasks due today or later, or already completed', () => {
    expect(overdueDays(task('a'), TODAY)).toBe(0);
    expect(overdueDays(task('a', { dueDateKey: '2026-09-30' }), TODAY)).toBe(0);
    expect(
      overdueDays(task('a', { dueDateKey: '2026-09-20', completedDateKey: TODAY }), TODAY),
    ).toBe(0);
  });
});

describe('isTaskLocked', () => {
  it('locks tasks completed on a past day: their points are already in the history', () => {
    expect(isTaskLocked(task('a', { completedDateKey: '2026-09-24' }), TODAY)).toBe(true);
  });

  it('leaves open tasks and tasks completed today editable', () => {
    expect(isTaskLocked(task('a'), TODAY)).toBe(false);
    expect(isTaskLocked(task('a', { completedDateKey: TODAY }), TODAY)).toBe(false);
  });
});
