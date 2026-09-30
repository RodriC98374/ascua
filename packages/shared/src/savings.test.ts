import { describe, expect, it } from 'vitest';

import { EMPTY_SAVINGS, isSavingsComplete, maxSavingsDeposit, spendablePoints } from './savings';
import type { SavingsJar } from './types';

function jar(points: number): SavingsJar {
  return { rewardId: 'trip', points, startedDateKey: '2026-09-20' };
}

describe('spendablePoints', () => {
  it('is the whole balance without a jar', () => {
    expect(spendablePoints(300, null)).toBe(300);
    expect(spendablePoints(300, EMPTY_SAVINGS)).toBe(300);
  });

  it('leaves out what is set aside', () => {
    expect(spendablePoints(300, jar(120))).toBe(180);
  });

  it('never goes below zero', () => {
    expect(spendablePoints(100, jar(120))).toBe(0);
  });
});

describe('maxSavingsDeposit', () => {
  it('is limited by what the reward still needs', () => {
    expect(maxSavingsDeposit({ balance: 900, jar: jar(550), cost: 600 })).toBe(50);
  });

  it('is limited by the free balance', () => {
    expect(maxSavingsDeposit({ balance: 200, jar: jar(150), cost: 600 })).toBe(50);
    expect(maxSavingsDeposit({ balance: 80, jar: null, cost: 600 })).toBe(80);
  });

  it('is zero when full or with nothing free', () => {
    expect(maxSavingsDeposit({ balance: 900, jar: jar(600), cost: 600 })).toBe(0);
    expect(maxSavingsDeposit({ balance: 100, jar: jar(120), cost: 600 })).toBe(0);
  });
});

describe('isSavingsComplete', () => {
  it('is complete once the saved points reach the cost', () => {
    expect(isSavingsComplete(jar(599), 600)).toBe(false);
    expect(isSavingsComplete(jar(600), 600)).toBe(true);
  });

  it('is never complete without a reward', () => {
    expect(isSavingsComplete(EMPTY_SAVINGS, 0)).toBe(false);
  });
});
