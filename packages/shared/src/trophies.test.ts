import { describe, expect, it } from 'vitest';

import { trophyShelf } from './trophies';
import type { RewardRedemption } from './types';

function trophy(id: string, overrides: Partial<RewardRedemption> = {}): RewardRedemption {
  return {
    id,
    rewardId: 'anime',
    rewardSnapshot: { name: 'Tarde de anime', tier: 'small', cost: 60 },
    pointTransactionId: `redemption_${id}`,
    dateKey: '2026-10-01',
    note: null,
    usedDateKey: null,
    ...overrides,
  };
}

describe('trophyShelf', () => {
  it('is empty without redemptions', () => {
    expect(trophyShelf([])).toEqual({ trophies: [], unusedCount: 0 });
  });

  it('puts the newest redemption first, keeping the given order within a day', () => {
    const shelf = trophyShelf([
      trophy('a', { dateKey: '2026-09-28' }),
      trophy('b', { dateKey: '2026-10-02' }),
      trophy('c', { dateKey: '2026-10-02' }),
      trophy('d', { dateKey: '2026-09-30' }),
    ]);
    expect(shelf.trophies.map((item) => item.id)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('counts the redemptions not used yet', () => {
    const shelf = trophyShelf([
      trophy('a'),
      trophy('b', { usedDateKey: '2026-10-02' }),
      trophy('c'),
    ]);
    expect(shelf.unusedCount).toBe(2);
  });

  it('does not change the given list', () => {
    const list = [trophy('a', { dateKey: '2026-09-01' }), trophy('b')];
    trophyShelf(list);
    expect(list.map((item) => item.id)).toEqual(['a', 'b']);
  });
});
