import type { HabitRecord } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { canMove, moveHabit } from './habit-order';

function habit(id: string, tier: HabitRecord['tier'], sortOrder: number, overrides = {}) {
  return {
    id,
    name: id,
    tier,
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-09-01',
    archivedDateKey: null,
    description: null,
    icon: 'check',
    color: '#9FCBAC',
    category: 'health',
    sortOrder,
    ...overrides,
  } satisfies HabitRecord;
}

// Orden guardado mezclado a propósito: el resultado agrupa principales primero.
const habits = [
  habit('s1', 'secondary', 0),
  habit('p1', 'primary', 1),
  habit('s2', 'secondary', 2),
  habit('p2', 'primary', 3),
  habit('old', 'primary', 4, { status: 'archived', archivedDateKey: '2026-09-10' }),
];

describe('moveHabit', () => {
  it('moves a habit down within its tier and returns all active habits, primaries first', () => {
    expect(moveHabit(habits, 'p1', 1)).toEqual(['p2', 'p1', 's1', 's2']);
  });

  it('moves a habit up within its tier', () => {
    expect(moveHabit(habits, 's2', -1)).toEqual(['p1', 'p2', 's2', 's1']);
  });

  it('keeps the order when the move would leave its tier', () => {
    expect(moveHabit(habits, 'p2', 1)).toEqual(['p1', 'p2', 's1', 's2']);
    expect(moveHabit(habits, 's1', -1)).toEqual(['p1', 'p2', 's1', 's2']);
  });

  it('never includes archived habits', () => {
    expect(moveHabit(habits, 'old', -1)).toEqual(['p1', 'p2', 's1', 's2']);
  });
});

describe('canMove', () => {
  it('tells whether a habit has a neighbour of its tier in that direction', () => {
    expect(canMove(habits, 'p1', -1)).toBe(false);
    expect(canMove(habits, 'p1', 1)).toBe(true);
    expect(canMove(habits, 'p2', 1)).toBe(false);
    expect(canMove(habits, 's1', 1)).toBe(true);
    expect(canMove(habits, 'old', -1)).toBe(false);
  });
});
