import { describe, expect, it } from 'vitest';

import {
  getScheduledHabits,
  isHabitActiveOn,
  isHabitDone,
  isHabitScheduledOn,
} from './habit-schedule';
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

describe('isHabitScheduledOn with fixed days', () => {
  // Lunes, miércoles y viernes. 21-09-2026 es lunes.
  const gym = habit({ schedule: { type: 'days_of_week', daysOfWeek: [1, 3, 5] } });

  it('counts only on its days of the week', () => {
    expect(isHabitScheduledOn(gym, '2026-09-21')).toBe(true);
    expect(isHabitScheduledOn(gym, '2026-09-22')).toBe(false);
    expect(isHabitScheduledOn(gym, '2026-09-25')).toBe(true);
    expect(isHabitScheduledOn(gym, '2026-09-27')).toBe(false);
  });

  it('still respects its start and archive days', () => {
    expect(isHabitScheduledOn({ ...gym, startDateKey: '2026-09-22' }, '2026-09-21')).toBe(false);
    const archived = { ...gym, status: 'archived' as const, archivedDateKey: '2026-09-23' };
    expect(isHabitScheduledOn(archived, '2026-09-23')).toBe(true);
    expect(isHabitScheduledOn(archived, '2026-09-25')).toBe(false);
  });
});

describe('isHabitScheduledOn with times per week', () => {
  const weekly = habit({ schedule: { type: 'times_per_week', timesPerWeek: 3 } });

  it('is never due on a given day: it does not enter the streak goal', () => {
    expect(isHabitScheduledOn(weekly, '2026-09-21')).toBe(false);
  });

  it('is active every day of its lifetime', () => {
    expect(isHabitActiveOn(weekly, '2026-09-21')).toBe(true);
    expect(isHabitActiveOn({ ...weekly, startDateKey: '2026-09-22' }, '2026-09-21')).toBe(false);
  });
});

describe('isHabitDone', () => {
  it('uses the check of a habit without a target', () => {
    expect(isHabitDone(habit(), { completed: true })).toBe(true);
    expect(isHabitDone(habit(), { completed: false })).toBe(false);
    expect(isHabitDone(habit(), undefined)).toBe(false);
  });

  it('needs the daily amount for a habit with a target', () => {
    const water = habit({ target: { amount: 8, unit: 'vasos' } });
    expect(isHabitDone(water, { completed: false, count: 7 })).toBe(false);
    expect(isHabitDone(water, { completed: true, count: 8 })).toBe(true);
    expect(isHabitDone(water, { completed: true, count: 9 })).toBe(true);
  });

  it('trusts the count over the check when they disagree', () => {
    const water = habit({ target: { amount: 8, unit: 'vasos' } });
    expect(isHabitDone(water, { completed: true, count: 3 })).toBe(false);
    expect(isHabitDone(water, { completed: true })).toBe(false);
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
