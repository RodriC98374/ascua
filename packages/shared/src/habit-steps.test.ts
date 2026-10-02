import { describe, expect, it } from 'vitest';

import { HABIT_STEP_TITLE_MAX_LENGTH, HABIT_STEPS_MAX, HABIT_STEPS_MIN } from './constants';
import { isHabitDone } from './habit-schedule';
import {
  areHabitStepsDone,
  doneHabitStepIds,
  habitStepsOf,
  isValidHabitSteps,
  toggleHabitStep,
} from './habit-steps';
import type { Habit, HabitStep } from './types';

const STEPS: HabitStep[] = [
  { id: 'a', title: 'Lavarse los dientes' },
  { id: 'b', title: 'Preparar la ropa' },
  { id: 'c', title: 'Apagar la pantalla' },
];

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'night',
    name: 'Rutina de noche',
    tier: 'primary',
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-10-01',
    archivedDateKey: null,
    steps: STEPS,
    ...overrides,
  };
}

describe('habitStepsOf', () => {
  it('returns the steps of a habit that has them', () => {
    expect(habitStepsOf(habit())).toEqual(STEPS);
  });

  it('returns nothing for a habit without steps', () => {
    // Un hábito de antes de la fase 21 no trae el campo.
    expect(habitStepsOf({})).toEqual([]);
    expect(habitStepsOf(habit({ steps: null }))).toEqual([]);
    expect(habitStepsOf(habit({ steps: [] }))).toEqual([]);
  });

  it('ignores the steps of a habit with a quantity: the counter is in charge', () => {
    expect(habitStepsOf(habit({ target: { amount: 3, unit: 'vasos' } }))).toEqual([]);
  });
});

describe('doneHabitStepIds', () => {
  it('lists the done steps in the order of the habit', () => {
    expect(doneHabitStepIds(habit(), { completed: false, doneSteps: ['c', 'a'] })).toEqual([
      'a',
      'c',
    ]);
  });

  it('leaves out marks of steps that no longer exist', () => {
    expect(doneHabitStepIds(habit(), { completed: false, doneSteps: ['gone', 'b'] })).toEqual([
      'b',
    ]);
  });

  it('is empty without an entry or without marks', () => {
    expect(doneHabitStepIds(habit(), undefined)).toEqual([]);
    expect(doneHabitStepIds(habit(), { completed: true })).toEqual([]);
  });
});

describe('areHabitStepsDone', () => {
  it('needs every step', () => {
    expect(areHabitStepsDone(habit(), { completed: false, doneSteps: ['a', 'b'] })).toBe(false);
    expect(areHabitStepsDone(habit(), { completed: true, doneSteps: ['a', 'b', 'c'] })).toBe(true);
  });

  it('is false for a habit without steps', () => {
    expect(areHabitStepsDone(habit({ steps: null }), { completed: true })).toBe(false);
  });
});

describe('isHabitDone with steps', () => {
  it('follows the steps, not the checkbox', () => {
    expect(isHabitDone(habit(), { completed: true, doneSteps: ['a'] })).toBe(false);
    expect(isHabitDone(habit(), { completed: false, doneSteps: ['a', 'b', 'c'] })).toBe(true);
    expect(isHabitDone(habit(), undefined)).toBe(false);
  });

  it('stops counting as done when a step is added after marking them all', () => {
    const entry = { completed: true, doneSteps: ['a', 'b', 'c'] };
    const longer = habit({ steps: [...STEPS, { id: 'd', title: 'Leer' }] });
    expect(isHabitDone(longer, entry)).toBe(false);
  });

  it('keeps using the checkbox for a habit without steps', () => {
    expect(isHabitDone(habit({ steps: null }), { completed: true })).toBe(true);
  });
});

describe('toggleHabitStep', () => {
  it('marks a step and completes the habit with the last one', () => {
    const first = toggleHabitStep(habit(), undefined, 'b');
    expect(first).toEqual({ completed: false, doneSteps: ['b'] });
    const second = toggleHabitStep(habit(), first, 'a');
    expect(second).toEqual({ completed: false, doneSteps: ['a', 'b'] });
    expect(toggleHabitStep(habit(), second, 'c')).toEqual({
      completed: true,
      doneSteps: ['a', 'b', 'c'],
    });
  });

  it('unmarks a step and the habit with it', () => {
    const done = { completed: true, doneSteps: ['a', 'b', 'c'] };
    expect(toggleHabitStep(habit(), done, 'b')).toEqual({
      completed: false,
      doneSteps: ['a', 'c'],
    });
  });

  it('drops marks of steps that no longer exist', () => {
    expect(toggleHabitStep(habit(), { completed: false, doneSteps: ['gone'] }, 'a')).toEqual({
      completed: false,
      doneSteps: ['a'],
    });
  });

  it('ignores a step that is not in the habit', () => {
    expect(toggleHabitStep(habit(), { completed: false, doneSteps: ['a'] }, 'zzz')).toEqual({
      completed: false,
      doneSteps: ['a'],
    });
  });
});

describe('isValidHabitSteps', () => {
  const many = (count: number): HabitStep[] =>
    Array.from({ length: count }, (_, index) => ({ id: `s${index}`, title: `Paso ${index}` }));

  it('accepts between the minimum and the maximum of steps', () => {
    expect(isValidHabitSteps(many(HABIT_STEPS_MIN))).toBe(true);
    expect(isValidHabitSteps(many(HABIT_STEPS_MAX))).toBe(true);
  });

  it('rejects too few or too many', () => {
    expect(isValidHabitSteps(many(HABIT_STEPS_MIN - 1))).toBe(false);
    expect(isValidHabitSteps(many(HABIT_STEPS_MAX + 1))).toBe(false);
  });

  it('rejects empty, untrimmed or too long titles', () => {
    const [first, second] = many(2) as [HabitStep, HabitStep];
    expect(isValidHabitSteps([first, { ...second, title: '' }])).toBe(false);
    expect(isValidHabitSteps([first, { ...second, title: ' Leer ' }])).toBe(false);
    expect(
      isValidHabitSteps([first, { ...second, title: 'x'.repeat(HABIT_STEP_TITLE_MAX_LENGTH + 1) }]),
    ).toBe(false);
  });

  it('rejects repeated or malformed ids', () => {
    const [first] = many(1) as [HabitStep];
    expect(isValidHabitSteps([first, { ...first, title: 'Otro' }])).toBe(false);
    expect(isValidHabitSteps([first, { id: '', title: 'Otro' }])).toBe(false);
    expect(isValidHabitSteps([first, { id: 'x'.repeat(21), title: 'Otro' }])).toBe(false);
  });

  it('rejects anything that is not a list of steps', () => {
    expect(isValidHabitSteps(null)).toBe(false);
    expect(isValidHabitSteps('a,b')).toBe(false);
    expect(isValidHabitSteps([{ id: 'a', title: 'Uno' }, 'dos'])).toBe(false);
    expect(
      isValidHabitSteps([
        { id: 'a', title: 'Uno' },
        { id: 2, title: 'Dos' },
      ]),
    ).toBe(false);
    expect(
      isValidHabitSteps([
        { id: 'a', title: 'Uno' },
        { id: 'b', title: 2 },
      ]),
    ).toBe(false);
    expect(isValidHabitSteps([{ id: 'a', title: 'Uno' }, null])).toBe(false);
  });
});
