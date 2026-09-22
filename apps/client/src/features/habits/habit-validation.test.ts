import type { HabitRecord } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { hasErrors, validateHabit } from './habit-validation';

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
    color: '#FF6B35',
    sortOrder: 0,
    ...overrides,
  } satisfies HabitRecord;
}

const valid = { name: 'Leer 20 minutos', description: '', tier: 'secondary' as const };

describe('validateHabit', () => {
  it('accepts a valid habit', () => {
    const errors = validateHabit(valid, { habits: [] });
    expect(errors).toEqual({});
    expect(hasErrors(errors)).toBe(false);
  });

  it('requires a name that is not only spaces', () => {
    expect(validateHabit({ ...valid, name: '   ' }, { habits: [] }).name).toBe(
      'Escribe un nombre para tu hábito.',
    );
  });

  it('asks for at least 2 characters', () => {
    expect(validateHabit({ ...valid, name: ' a ' }, { habits: [] }).name).toBe(
      'El nombre necesita al menos 2 caracteres.',
    );
  });

  it('limits the name to 60 characters after trimming', () => {
    expect(validateHabit({ ...valid, name: ` ${'a'.repeat(60)} ` }, { habits: [] })).toEqual({});
    expect(validateHabit({ ...valid, name: 'a'.repeat(61) }, { habits: [] }).name).toBe(
      'El nombre puede tener hasta 60 caracteres.',
    );
  });

  it('rejects a name already used by another active habit, ignoring case and spaces', () => {
    const habits = [habit('h1', { name: 'Leer 20 minutos' })];
    expect(validateHabit({ ...valid, name: '  leer 20 MINUTOS ' }, { habits }).name).toBe(
      'Ya tienes un hábito activo con ese nombre.',
    );
  });

  it('allows keeping the same name when editing that habit', () => {
    const habits = [habit('h1', { name: 'Leer 20 minutos' })];
    expect(validateHabit(valid, { habits, habitId: 'h1' })).toEqual({});
  });

  it('allows reusing the name of an archived habit', () => {
    const habits = [habit('h1', { name: 'Leer 20 minutos', status: 'archived' })];
    expect(validateHabit(valid, { habits })).toEqual({});
  });

  it('limits the description to 200 characters', () => {
    expect(validateHabit({ ...valid, description: 'a'.repeat(200) }, { habits: [] })).toEqual({});
    expect(
      validateHabit({ ...valid, description: 'a'.repeat(201) }, { habits: [] }).description,
    ).toBe('La descripción puede tener hasta 200 caracteres.');
  });

  it('blocks a 4th active primary habit', () => {
    const habits = ['a', 'b', 'c'].map((id) => habit(id, { tier: 'primary' }));
    const errors = validateHabit({ ...valid, tier: 'primary' }, { habits });
    expect(errors.tier).toBe('Ya tienes 3 hábitos principales. Elige secundario.');
    expect(hasErrors(errors)).toBe(true);
  });

  it('lets a primary habit stay primary when editing it with 3 primaries', () => {
    const habits = ['a', 'b', 'c'].map((id) => habit(id, { tier: 'primary' }));
    expect(validateHabit({ ...valid, tier: 'primary' }, { habits, habitId: 'a' })).toEqual({});
  });
});
