import { describe, expect, it } from '@jest/globals';

import { hasGoalErrors, validateGoal, type GoalDraft } from './goal-validation';

const START = '2026-09-29';

function draft(overrides: Partial<GoalDraft> = {}): GoalDraft {
  return {
    title: 'Aprobar Cálculo',
    description: '',
    targetDateKey: null,
    habitIds: [],
    ...overrides,
  };
}

describe('validateGoal', () => {
  it('accepts a goal with a title and nothing else', () => {
    expect(hasGoalErrors(validateGoal(draft(), START))).toBe(false);
  });

  it('asks for a title of 2 to 60 letters', () => {
    expect(validateGoal(draft({ title: ' A ' }), START).title).toBe('Escribe al menos 2 letras.');
    expect(validateGoal(draft({ title: 'x'.repeat(61) }), START).title).toBe('Hasta 60 letras.');
  });

  it('limits the description', () => {
    expect(validateGoal(draft({ description: 'x'.repeat(201) }), START).description).toBe(
      'Hasta 200 letras.',
    );
  });

  it('does not accept a deadline before the start', () => {
    expect(validateGoal(draft({ targetDateKey: '2026-09-28' }), START).targetDateKey).toBe(
      'La fecha límite no puede ser antes de que empiece la meta.',
    );
    expect(validateGoal(draft({ targetDateKey: START }), START).targetDateKey).toBeUndefined();
  });

  it('allows up to 10 habits', () => {
    const eleven = Array.from({ length: 11 }, (_, index) => `h${index}`);
    expect(validateGoal(draft({ habitIds: eleven }), START).habitIds).toBe(
      'Hasta 10 hábitos por meta.',
    );
  });
});
