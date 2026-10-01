import type { HabitRecord } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { draftReminder, hasErrors, validateHabit } from './habit-validation';

function habit(id: string, overrides: Partial<HabitRecord> = {}) {
  return {
    id,
    name: id,
    tier: 'secondary',
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

const valid = {
  name: 'Leer 20 minutos',
  description: '',
  tier: 'secondary' as const,
  category: 'health' as const,
  icon: null,
  color: '#9FCBAC' as const,
  schedule: { type: 'daily' } as const,
  hasTarget: false,
  targetAmount: '',
  targetUnit: '',
  hasReminder: false,
  reminderTime: '20:00',
  reminderDays: [1, 2, 3, 4, 5, 6, 7],
};

describe('validateHabit', () => {
  it('accepts a valid habit', () => {
    const errors = validateHabit(valid, { habits: [], isNew: true });
    expect(errors).toEqual({});
    expect(hasErrors(errors)).toBe(false);
  });

  it('requires a name that is not only spaces', () => {
    expect(validateHabit({ ...valid, name: '   ' }, { habits: [], isNew: true }).name).toBe(
      'Escribe un nombre para tu hábito.',
    );
  });

  it('asks for at least 2 characters', () => {
    expect(validateHabit({ ...valid, name: ' a ' }, { habits: [], isNew: true }).name).toBe(
      'El nombre necesita al menos 2 caracteres.',
    );
  });

  it('limits the name to 60 characters after trimming', () => {
    expect(
      validateHabit({ ...valid, name: ` ${'a'.repeat(60)} ` }, { habits: [], isNew: true }),
    ).toEqual({});
    expect(
      validateHabit({ ...valid, name: 'a'.repeat(61) }, { habits: [], isNew: true }).name,
    ).toBe('El nombre puede tener hasta 60 caracteres.');
  });

  it('rejects a name already used by another active habit, ignoring case and spaces', () => {
    const habits = [habit('h1', { name: 'Leer 20 minutos' })];
    expect(
      validateHabit({ ...valid, name: '  leer 20 MINUTOS ' }, { habits, isNew: true }).name,
    ).toBe('Ya tienes un hábito activo con ese nombre.');
  });

  it('allows keeping the same name when editing that habit', () => {
    const habits = [habit('h1', { name: 'Leer 20 minutos' })];
    expect(validateHabit(valid, { habits, habitId: 'h1', isNew: false })).toEqual({});
  });

  it('allows reusing the name of an archived habit', () => {
    const habits = [habit('h1', { name: 'Leer 20 minutos', status: 'archived' })];
    expect(validateHabit(valid, { habits, isNew: true })).toEqual({});
  });

  it('limits the description to 200 characters', () => {
    expect(
      validateHabit({ ...valid, description: 'a'.repeat(200) }, { habits: [], isNew: true }),
    ).toEqual({});
    expect(
      validateHabit({ ...valid, description: 'a'.repeat(201) }, { habits: [], isNew: true })
        .description,
    ).toBe('La descripción puede tener hasta 200 caracteres.');
  });

  it('blocks a 4th active primary habit', () => {
    const habits = ['a', 'b', 'c'].map((id) => habit(id, { tier: 'primary' }));
    const errors = validateHabit({ ...valid, tier: 'primary' }, { habits, isNew: true });
    expect(errors.tier).toBe('Ya tienes 3 hábitos principales. Elige secundario.');
    expect(hasErrors(errors)).toBe(true);
  });

  it('lets a primary habit stay primary when editing it with 3 primaries', () => {
    const habits = ['a', 'b', 'c'].map((id) => habit(id, { tier: 'primary' }));
    expect(
      validateHabit({ ...valid, tier: 'primary' }, { habits, habitId: 'a', isNew: false }),
    ).toEqual({});
  });

  describe('schedule and target, only checked when creating', () => {
    it('requires at least one day for a fixed-days schedule', () => {
      const draft = { ...valid, schedule: { type: 'days_of_week' as const, daysOfWeek: [] } };
      expect(validateHabit(draft, { habits: [], isNew: true }).schedule).toBe(
        'Elige al menos un día.',
      );
    });

    it('accepts a fixed-days schedule with days chosen', () => {
      const draft = {
        ...valid,
        schedule: { type: 'days_of_week' as const, daysOfWeek: [1, 3, 5] },
      };
      expect(validateHabit(draft, { habits: [], isNew: true })).toEqual({});
    });

    it('requires an amount and a unit when a target is turned on', () => {
      const draft = { ...valid, hasTarget: true, targetAmount: '', targetUnit: '' };
      const errors = validateHabit(draft, { habits: [], isNew: true });
      expect(errors.targetAmount).toBe('La meta va de 2 a 999.');
      expect(errors.targetUnit).toBe('Escribe la unidad (vasos, páginas…).');
    });

    it('rejects a target amount outside 2..999', () => {
      const tooLow = { ...valid, hasTarget: true, targetAmount: '1', targetUnit: 'vasos' };
      expect(validateHabit(tooLow, { habits: [], isNew: true }).targetAmount).toBe(
        'La meta va de 2 a 999.',
      );
      const tooHigh = { ...valid, hasTarget: true, targetAmount: '1000', targetUnit: 'vasos' };
      expect(validateHabit(tooHigh, { habits: [], isNew: true }).targetAmount).toBe(
        'La meta va de 2 a 999.',
      );
    });

    it('accepts a valid target', () => {
      const draft = { ...valid, hasTarget: true, targetAmount: '8', targetUnit: 'vasos' };
      expect(validateHabit(draft, { habits: [], isNew: true })).toEqual({});
    });

    it('ignores an invalid draft schedule or target when editing', () => {
      const draft = {
        ...valid,
        schedule: { type: 'days_of_week' as const, daysOfWeek: [] },
        hasTarget: true,
        targetAmount: '',
        targetUnit: '',
      };
      expect(validateHabit(draft, { habits: [], isNew: false })).toEqual({});
    });
  });
});

describe('habit reminder (fase 17)', () => {
  const withReminder = { ...valid, hasReminder: true };

  it('has no reminder when it is off', () => {
    expect(draftReminder(valid)).toBeNull();
  });

  it('builds the reminder with its days in order', () => {
    expect(draftReminder({ ...withReminder, reminderDays: [5, 1] })).toEqual({
      time: '20:00',
      daysOfWeek: [1, 5],
    });
  });

  it('keeps only the days a days-of-week habit has', () => {
    const draft = {
      ...withReminder,
      schedule: { type: 'days_of_week' as const, daysOfWeek: [2, 4] },
      reminderDays: [1, 2, 3, 4],
    };
    expect(draftReminder(draft)).toEqual({ time: '20:00', daysOfWeek: [2, 4] });
  });

  it('asks for at least one day, also when editing', () => {
    const message = 'Elige al menos un día para el recordatorio.';
    expect(
      validateHabit({ ...withReminder, reminderDays: [] }, { habits: [], isNew: true })
        .reminderDays,
    ).toBe(message);
    expect(
      validateHabit(
        {
          ...withReminder,
          schedule: { type: 'days_of_week', daysOfWeek: [2] },
          reminderDays: [1],
        },
        { habits: [], isNew: false },
      ).reminderDays,
    ).toBe(message);
    expect(
      validateHabit({ ...valid, reminderDays: [] }, { habits: [], isNew: true }).reminderDays,
    ).toBeUndefined();
  });
});
