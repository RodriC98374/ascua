import { describe, expect, it } from 'vitest';

import { initialGamificationState } from './gamification-state';

describe('initialGamificationState', () => {
  it('starts with everything at zero and yesterday as the last closed day', () => {
    expect(initialGamificationState('2026-09-21')).toEqual({
      pointsBalance: 0,
      lifetimePointsEarned: 0,
      lifetimePointsSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      currentStreakStartDateKey: null,
      daysWithoutFreeze: 0,
      streakFreezesAvailable: 0,
      totalStreakFreezesUsed: 0,
      lastClosedDateKey: '2026-09-20',
      lastSpendTransactionId: null,
    });
  });

  it('crosses month and year boundaries', () => {
    expect(initialGamificationState('2027-01-01').lastClosedDateKey).toBe('2026-12-31');
  });
});
