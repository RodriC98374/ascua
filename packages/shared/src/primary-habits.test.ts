import { describe, expect, it } from 'vitest';

import { canBePrimary } from './primary-habits';
import type { Habit } from './types';

function habit(id: string, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    tier: 'primary',
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-09-01',
    archivedDateKey: null,
    ...overrides,
  };
}

describe('canBePrimary', () => {
  it('allows a new primary while there are fewer than 3 active', () => {
    expect(canBePrimary([habit('a'), habit('b')])).toBe(true);
  });

  it('rejects a 4th active primary', () => {
    expect(canBePrimary([habit('a'), habit('b'), habit('c')])).toBe(false);
  });

  it('lets one of the 3 primaries keep being primary when edited', () => {
    expect(canBePrimary([habit('a'), habit('b'), habit('c')], 'b')).toBe(true);
  });

  it('ignores secondary and archived habits', () => {
    const habits = [
      habit('a'),
      habit('b'),
      habit('c', { tier: 'secondary' }),
      habit('d', { status: 'archived', archivedDateKey: '2026-09-10' }),
    ];
    expect(canBePrimary(habits)).toBe(true);
  });
});
