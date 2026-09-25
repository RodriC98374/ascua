import { DAILY_TASK_POINTS_CAP, type Task, type TaskDay } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { dueDateOptions, taskDayText, taskDueLabel, taskPointsText } from './task-text';

const TODAY = '2026-09-25';

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't',
    title: 'Pagar la luz',
    size: 'medium',
    dueDateKey: TODAY,
    completedDateKey: null,
    ...overrides,
  };
}

describe('taskDueLabel', () => {
  it('says how long an overdue task has been waiting', () => {
    expect(taskDueLabel(task({ dueDateKey: '2026-09-24' }), TODAY)).toBe('Venció ayer');
    expect(taskDueLabel(task({ dueDateKey: '2026-09-20' }), TODAY)).toBe('Vencida hace 5 días');
  });

  it('names today, tomorrow and the days of the coming week', () => {
    expect(taskDueLabel(task(), TODAY)).toBe('Hoy');
    expect(taskDueLabel(task({ dueDateKey: '2026-09-26' }), TODAY)).toBe('Mañana');
    expect(taskDueLabel(task({ dueDateKey: '2026-09-28' }), TODAY)).toBe('Lun 28');
    expect(taskDueLabel(task({ dueDateKey: '2026-10-01' }), TODAY)).toBe('Jue 1');
  });

  it('uses the date for tasks further away', () => {
    expect(taskDueLabel(task({ dueDateKey: '2026-10-02' }), TODAY)).toBe('2 oct');
  });

  it('has no label once completed', () => {
    expect(taskDueLabel(task({ completedDateKey: TODAY }), TODAY)).toBeNull();
  });
});

describe('dueDateOptions', () => {
  it('offers today, tomorrow and the rest of the week', () => {
    expect(dueDateOptions(TODAY)).toEqual([
      { dateKey: '2026-09-25', label: 'Hoy' },
      { dateKey: '2026-09-26', label: 'Mañana' },
      { dateKey: '2026-09-27', label: 'Dom 27' },
      { dateKey: '2026-09-28', label: 'Lun 28' },
      { dateKey: '2026-09-29', label: 'Mar 29' },
      { dateKey: '2026-09-30', label: 'Mié 30' },
      { dateKey: '2026-10-01', label: 'Jue 1' },
    ]);
  });
});

describe('taskDayText', () => {
  function day(dateKey: string, done: number, pending: number): TaskDay<Task> {
    const many = (count: number) => Array.from({ length: count }, () => task());
    return { dateKey, done: many(done), pending: many(pending), completionRate: null };
  }

  it('says when a day had no tasks', () => {
    expect(taskDayText(day('2026-09-24', 0, 0), TODAY)).toBe('Sin tareas este día.');
  });

  it('celebrates a day with every task completed', () => {
    expect(taskDayText(day('2026-09-24', 1, 0), TODAY)).toBe('Cumpliste tu tarea.');
    expect(taskDayText(day('2026-09-24', 3, 0), TODAY)).toBe('Cumpliste las 3 tareas.');
  });

  it('counts the completed ones against all of the day', () => {
    expect(taskDayText(day(TODAY, 1, 2), TODAY)).toBe('1 de 3 cumplidas.');
  });

  it('lists what is still to do today or later', () => {
    expect(taskDayText(day(TODAY, 0, 1), TODAY)).toBe('1 tarea pendiente.');
    expect(taskDayText(day('2026-09-27', 0, 2), TODAY)).toBe('2 tareas pendientes.');
  });

  it('points past pending tasks to Hoy, where they still wait', () => {
    expect(taskDayText(day('2026-09-24', 1, 1), TODAY)).toBe(
      '1 de 2 cumplidas. La que falta sigue en Hoy.',
    );
    expect(taskDayText(day('2026-09-24', 0, 1), TODAY)).toBe('Tu tarea sigue pendiente en Hoy.');
    expect(taskDayText(day('2026-09-24', 0, 2), TODAY)).toBe(
      'Las 2 tareas siguen pendientes en Hoy.',
    );
  });
});

describe('taskPointsText', () => {
  it('invites to complete one when nothing is done yet', () => {
    expect(taskPointsText({ points: 0, uncappedPoints: 0, completedCount: 0 })).toBe(
      `Cada tarea suma puntos, hasta ${DAILY_TASK_POINTS_CAP} por día.`,
    );
  });

  it('shows the points of the day against the cap', () => {
    expect(taskPointsText({ points: 15, uncappedPoints: 15, completedCount: 2 })).toBe(
      `+15 de ${DAILY_TASK_POINTS_CAP} pts por tareas hoy.`,
    );
  });

  it('celebrates reaching the cap exactly', () => {
    expect(
      taskPointsText({
        points: DAILY_TASK_POINTS_CAP,
        uncappedPoints: DAILY_TASK_POINTS_CAP,
        completedCount: 2,
      }),
    ).toBe(`Llegaste al tope de ${DAILY_TASK_POINTS_CAP} pts por tareas hoy.`);
  });

  it('explains the cap once the tasks go over it', () => {
    expect(
      taskPointsText({ points: DAILY_TASK_POINTS_CAP, uncappedPoints: 45, completedCount: 3 }),
    ).toBe(
      `Llegaste al tope de ${DAILY_TASK_POINTS_CAP} pts por tareas hoy. Las demás se cumplen igual, pero ya no suman.`,
    );
  });
});
