import { describe, expect, it } from 'vitest';

import { getScheduledHabits, isHabitScheduledOn } from './habit-schedule';
import type { Habit } from './types';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'read',
    name: 'Leer 20 min',
    tier: 'primary',
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-09-10',
    archivedDateKey: null,
    ...overrides,
  };
}

describe('isHabitScheduledOn', () => {
  it('counts an active habit on any day since its start', () => {
    expect(isHabitScheduledOn(habit(), '2026-09-21')).toBe(true);
  });

  it('counts on the day it was created', () => {
    expect(isHabitScheduledOn(habit({ startDateKey: '2026-09-21' }), '2026-09-21')).toBe(true);
  });

  it('does not count before it was created', () => {
    expect(isHabitScheduledOn(habit({ startDateKey: '2026-09-21' }), '2026-09-20')).toBe(false);
  });

  it('still counts on the day it was archived, so archiving cannot dodge a broken streak', () => {
    const archived = habit({ status: 'archived', archivedDateKey: '2026-09-21' });
    expect(isHabitScheduledOn(archived, '2026-09-21')).toBe(true);
  });

  it('does not count after the day it was archived', () => {
    const archived = habit({ status: 'archived', archivedDateKey: '2026-09-20' });
    expect(isHabitScheduledOn(archived, '2026-09-21')).toBe(false);
  });
});

describe('getScheduledHabits', () => {
  it('keeps only the habits that count that day, in their original order', () => {
    const habits = [
      habit({ id: 'a' }),
      habit({ id: 'b', startDateKey: '2026-09-22' }),
      habit({ id: 'c', tier: 'secondary' }),
    ];
    expect(getScheduledHabits(habits, '2026-09-21').map((h) => h.id)).toEqual(['a', 'c']);
  });
});
