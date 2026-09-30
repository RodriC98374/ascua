import { describe, expect, it } from '@jest/globals';

import { deadlineText, taskProgressText } from './goal-text';

describe('deadlineText', () => {
  it('counts the days left and says when it is due', () => {
    expect(deadlineText({ daysLeft: 10, isOverdue: false })).toBe('Faltan 10 días');
    expect(deadlineText({ daysLeft: 1, isOverdue: false })).toBe('Vence mañana');
    expect(deadlineText({ daysLeft: 0, isOverdue: false })).toBe('Vence hoy');
  });

  it('says how long ago it was due', () => {
    expect(deadlineText({ daysLeft: -1, isOverdue: true })).toBe('Venció ayer');
    expect(deadlineText({ daysLeft: -4, isOverdue: true })).toBe('Venció hace 4 días');
  });
});

describe('taskProgressText', () => {
  it('counts the done tasks', () => {
    expect(taskProgressText({ done: 3, total: 5, rate: 0.6 })).toBe('3 de 5 tareas');
    expect(taskProgressText({ done: 0, total: 1, rate: 0 })).toBe('0 de 1 tarea');
  });

  it('invites to add tasks when there are none', () => {
    expect(taskProgressText({ done: 0, total: 0, rate: null })).toBe('Sin tareas todavía');
  });
});
