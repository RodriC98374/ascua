import { describe, expect, it } from 'vitest';

import {
  canPurchaseFreeze,
  canRedeemReward,
  planFreezePurchase,
  planRewardRedemption,
} from './points';
import type { GamificationState, Reward } from './types';

const DAY = '2026-09-21';

function state(overrides: Partial<GamificationState> = {}): GamificationState {
  return {
    pointsBalance: 200,
    lifetimePointsEarned: 500,
    lifetimePointsSpent: 300,
    currentStreak: 4,
    longestStreak: 9,
    currentStreakStartDateKey: '2026-09-17',
    daysWithoutFreeze: 4,
    streakFreezesAvailable: 0,
    totalStreakFreezesUsed: 1,
    lastClosedDateKey: '2026-09-20',
    lastSpendTransactionId: 'redemption_old',
    ...overrides,
  };
}

const CINEMA: Reward = {
  id: 'cinema',
  name: 'Cine con palomitas',
  tier: 'large',
  cost: 600,
  status: 'active',
};
const ANIME: Reward = {
  id: 'anime',
  name: 'Tarde de anime',
  tier: 'small',
  cost: 60,
  status: 'active',
};

describe('canPurchaseFreeze', () => {
  it('allows buying with enough points and room for another freeze', () => {
    expect(canPurchaseFreeze(state())).toEqual({ ok: true });
  });

  it('reports how many points are missing', () => {
    expect(canPurchaseFreeze(state({ pointsBalance: 110 }))).toEqual({
      ok: false,
      reason: 'insufficient_points',
      missingPoints: 40,
    });
  });

  it('rejects buying beyond the maximum of 2 freezes', () => {
    expect(canPurchaseFreeze(state({ streakFreezesAvailable: 2 }))).toEqual({
      ok: false,
      reason: 'max_freezes_reached',
    });
  });
});

describe('planFreezePurchase', () => {
  it('charges 150 points and adds one freeze', () => {
    const plan = planFreezePurchase(state({ streakFreezesAvailable: 1 }), 'req-1', DAY);
    expect(plan.transaction).toEqual({
      id: 'freeze_req-1',
      type: 'streak_freeze_purchase',
      amount: -150,
      balanceAfter: 50,
      dateKey: DAY,
      sourceType: 'streak_freeze',
      sourceId: 'req-1',
      description: 'Protector de racha',
    });
    expect(plan.nextState).toMatchObject({
      pointsBalance: 50,
      lifetimePointsSpent: 450,
      streakFreezesAvailable: 2,
      lastSpendTransactionId: 'freeze_req-1',
    });
  });

  it('throws when the purchase is not allowed', () => {
    expect(() => planFreezePurchase(state({ pointsBalance: 10 }), 'req-1', DAY)).toThrow(
      'insufficient_points',
    );
  });
});

describe('canRedeemReward', () => {
  it('allows redeeming an active reward that fits the balance', () => {
    expect(canRedeemReward(state(), ANIME)).toEqual({ ok: true });
  });

  it('reports how many points are missing', () => {
    expect(canRedeemReward(state(), CINEMA)).toEqual({
      ok: false,
      reason: 'insufficient_points',
      missingPoints: 400,
    });
  });

  it('rejects an archived reward', () => {
    expect(canRedeemReward(state(), { ...ANIME, status: 'archived' })).toEqual({
      ok: false,
      reason: 'reward_archived',
    });
  });
});

describe('planRewardRedemption', () => {
  it('charges the reward cost', () => {
    const plan = planRewardRedemption(state(), ANIME, 'req-2', DAY);
    expect(plan.transaction).toEqual({
      id: 'redemption_req-2',
      type: 'reward_redemption',
      amount: -60,
      balanceAfter: 140,
      dateKey: DAY,
      sourceType: 'reward_redemption',
      sourceId: 'req-2',
      description: 'Canje: Tarde de anime',
    });
    expect(plan.nextState).toMatchObject({
      pointsBalance: 140,
      lifetimePointsSpent: 360,
      lastSpendTransactionId: 'redemption_req-2',
    });
  });

  it('allows spending the exact balance', () => {
    const plan = planRewardRedemption(state({ pointsBalance: 60 }), ANIME, 'req-3', DAY);
    expect(plan.nextState.pointsBalance).toBe(0);
  });

  it('throws when the redemption is not allowed', () => {
    expect(() => planRewardRedemption(state(), CINEMA, 'req-4', DAY)).toThrow(
      'insufficient_points',
    );
  });
});
