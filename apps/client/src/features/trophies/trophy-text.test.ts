import type { RewardRedemption } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { trophyCountText } from './trophy-text';

const trophies = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `t${index}` }) as RewardRedemption);

describe('trophyCountText', () => {
  it('says how many are left to use out of the total', () => {
    expect(trophyCountText({ trophies: trophies(5), unusedCount: 2 })).toBe(
      '2 por usar · 5 en total',
    );
  });

  it('skips the total when none was used yet', () => {
    expect(trophyCountText({ trophies: trophies(1), unusedCount: 1 })).toBe('1 por usar');
  });

  it('celebrates when all were used', () => {
    expect(trophyCountText({ trophies: trophies(3), unusedCount: 0 })).toBe(
      'Todos utilizados · 3 en total',
    );
  });
});
