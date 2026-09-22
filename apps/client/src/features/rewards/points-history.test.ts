import type { PointTransaction, RewardRedemption } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { historyByDay } from './points-history';

function movement(overrides: Partial<PointTransaction>): PointTransaction {
  return {
    id: 'completion_2026-09-21_read',
    type: 'habit_completion',
    amount: 10,
    balanceAfter: 10,
    dateKey: '2026-09-21',
    sourceType: 'habit',
    sourceId: 'read',
    description: 'Hábito cumplido: Leer',
    ...overrides,
  };
}

const redemption: RewardRedemption = {
  id: 'req-1',
  rewardId: 'cine',
  rewardSnapshot: { name: 'Ir al cine', tier: 'large', cost: 550 },
  pointTransactionId: 'redemption_req-1',
  dateKey: '2026-09-22',
  note: 'Con amigos',
};

describe('historyByDay', () => {
  it('groups movements by day, keeping the given order (newest first)', () => {
    const days = historyByDay(
      [
        movement({
          id: 'redemption_req-1',
          type: 'reward_redemption',
          amount: -550,
          dateKey: '2026-09-22',
          description: 'Canje: Ir al cine',
          sourceId: 'req-1',
        }),
        movement({
          id: 'perfect_2026-09-21',
          type: 'perfect_day_bonus',
          amount: 5,
          description: 'Día perfecto',
        }),
        movement({}),
      ],
      [redemption],
    );

    expect(days.map((day) => day.title)).toEqual([
      'Martes, 22 de septiembre',
      'Lunes, 21 de septiembre',
    ]);
    expect(days[0]!.items).toEqual([
      {
        id: 'redemption_req-1',
        description: 'Canje: Ir al cine',
        amount: '−550',
        isGain: false,
        note: 'Con amigos',
      },
    ]);
    expect(days[1]!.items.map((item) => [item.description, item.amount, item.isGain])).toEqual([
      ['Día perfecto', '+5', true],
      ['Hábito cumplido: Leer', '+10', true],
    ]);
  });

  it('returns nothing for an empty history', () => {
    expect(historyByDay([], [])).toEqual([]);
  });
});
