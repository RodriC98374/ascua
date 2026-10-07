import { describe, expect, it } from 'vitest';

import { EDIT_GRACE_DAYS } from './constants';
import {
  graceDateKey,
  isEditableDateKey,
  lastClosableDateKey,
  stateAfterGraceDay,
} from './open-days';
import type { DailyEntries, GamificationState, Habit } from './types';

const TODAY = '2026-09-22';
const YESTERDAY = '2026-09-21';

function habit(id: string, tier: Habit['tier']): Habit {
  return {
    id,
    name: id,
    tier,
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-09-01',
    archivedDateKey: null,
  };
}

const HABITS = [
  habit('read', 'primary'),
  habit('exercise', 'primary'),
  habit('water', 'secondary'),
];

function state(overrides: Partial<GamificationState> = {}): GamificationState {
  return {
    pointsBalance: 100,
    lifetimePointsEarned: 100,
    lifetimePointsSpent: 0,
    currentStreak: 3,
    longestStreak: 5,
    currentStreakStartDateKey: '2026-09-18',
    daysWithoutFreeze: 3,
    streakFreezesAvailable: 0,
    totalStreakFreezesUsed: 0,
    lastClosedDateKey: '2026-09-20',
    lastSpendTransactionId: null,
    ...overrides,
  };
}

function done(...ids: string[]): DailyEntries {
  return Object.fromEntries(ids.map((id) => [id, { completed: true }]));
}

describe('EDIT_GRACE_DAYS', () => {
  it('is one day', () => {
    expect(EDIT_GRACE_DAYS).toBe(1);
  });
});

describe('lastClosableDateKey', () => {
  it('is two days before today: yesterday stays open for the grace day', () => {
    expect(lastClosableDateKey(TODAY)).toBe('2026-09-20');
  });

  it('crosses month boundaries', () => {
    expect(lastClosableDateKey('2026-10-01')).toBe('2026-09-29');
  });
});

describe('graceDateKey', () => {
  it('is yesterday while it is still open', () => {
    expect(graceDateKey(TODAY, '2026-09-20')).toBe(YESTERDAY);
  });

  it('is also yesterday when older days are still pending to close', () => {
    expect(graceDateKey(TODAY, '2026-09-17')).toBe(YESTERDAY);
  });

  it('is null once yesterday is closed (a brand new account has no past)', () => {
    expect(graceDateKey(TODAY, YESTERDAY)).toBeNull();
  });
});

describe('isEditableDateKey', () => {
  it('lets today be edited', () => {
    expect(isEditableDateKey(TODAY, TODAY, '2026-09-20')).toBe(true);
  });

  it('lets yesterday be edited while it is open', () => {
    expect(isEditableDateKey(YESTERDAY, TODAY, '2026-09-20')).toBe(true);
  });

  it('rejects yesterday once it is closed', () => {
    expect(isEditableDateKey(YESTERDAY, TODAY, YESTERDAY)).toBe(false);
  });

  it('rejects two days ago and tomorrow', () => {
    expect(isEditableDateKey('2026-09-20', TODAY, '2026-09-19')).toBe(false);
    expect(isEditableDateKey('2026-09-23', TODAY, '2026-09-20')).toBe(false);
  });
});

describe('stateAfterGraceDay', () => {
  const input = (entries: DailyEntries, current = state()) => ({
    today: TODAY,
    habits: HABITS,
    entries,
    state: current,
  });

  it('returns the same state when yesterday is already closed', () => {
    const closed = state({ lastClosedDateKey: YESTERDAY });
    expect(stateAfterGraceDay(input(done('read', 'exercise'), closed))).toEqual(closed);
  });

  it('adds yesterday to the streak when its goal is met', () => {
    const next = stateAfterGraceDay(input(done('read', 'exercise')));
    expect(next.currentStreak).toBe(4);
    expect(next.lastClosedDateKey).toBe(YESTERDAY);
  });

  it('breaks the streak when yesterday goal is missed and there is no freeze', () => {
    const next = stateAfterGraceDay(input(done('read')));
    expect(next.currentStreak).toBe(0);
  });

  it('spends a freeze instead of breaking the streak', () => {
    const next = stateAfterGraceDay(input(done('read'), state({ streakFreezesAvailable: 1 })));
    expect(next.currentStreak).toBe(3);
    expect(next.streakFreezesAvailable).toBe(0);
  });

  it('counts the points of yesterday in the projected balance', () => {
    const next = stateAfterGraceDay(input(done('read', 'exercise')));
    expect(next.pointsBalance).toBeGreaterThan(100);
  });
});
