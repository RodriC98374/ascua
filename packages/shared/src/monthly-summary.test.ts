import { describe, expect, it } from 'vitest';

import { evaluateDay } from './day-evaluation';
import { initialGamificationState } from './gamification-state';
import {
  addClosedDay,
  addMonthlySpending,
  EMPTY_MONTHLY_COUNTERS,
  mergeMonthlyCounters,
} from './monthly-summary';
import type { GamificationState, Habit, HabitTier } from './types';

function habit(id: string, tier: HabitTier): Habit {
  return {
    id,
    name: id,
    tier,
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-01-01',
    archivedDateKey: null,
  };
}

const READING = habit('reading', 'primary');
const WATER = habit('water', 'secondary');
const DAY = '2026-09-10';

function stateBefore(overrides: Partial<GamificationState> = {}): GamificationState {
  return {
    ...initialGamificationState('2026-09-10'),
    lastClosedDateKey: '2026-09-09',
    ...overrides,
  };
}

function close(entries: Record<string, { completed: boolean }>, state = stateBefore()) {
  return evaluateDay({ dateKey: DAY, habits: [READING, WATER], entries, state });
}

describe('addClosedDay', () => {
  it('counts a perfect day as completed and perfect, with its points and habit stats', () => {
    const counters = addClosedDay(
      EMPTY_MONTHLY_COUNTERS,
      close({ reading: { completed: true }, water: { completed: true } }),
    );
    expect(counters).toEqual({
      closedDays: 1,
      completedDays: 1,
      perfectDays: 1,
      frozenDays: 0,
      missedDays: 0,
      pointsEarned: 20,
      pointsSpent: 0,
      habitStats: {
        reading: { scheduledDays: 1, completedDays: 1 },
        water: { scheduledDays: 1, completedDays: 1 },
      },
    });
  });

  it('adds to existing counters without touching points spent', () => {
    const before = {
      ...EMPTY_MONTHLY_COUNTERS,
      closedDays: 3,
      completedDays: 2,
      missedDays: 1,
      pointsEarned: 30,
      pointsSpent: 150,
      habitStats: { reading: { scheduledDays: 3, completedDays: 2 } },
    };
    const counters = addClosedDay(before, close({ reading: { completed: true } }));
    expect(counters).toMatchObject({
      closedDays: 4,
      completedDays: 3,
      perfectDays: 0,
      pointsEarned: 40,
      pointsSpent: 150,
      habitStats: {
        reading: { scheduledDays: 4, completedDays: 3 },
        water: { scheduledDays: 1, completedDays: 0 },
      },
    });
  });

  it('counts frozen and missed days', () => {
    const frozen = close(
      {},
      stateBefore({
        currentStreak: 3,
        currentStreakStartDateKey: '2026-09-07',
        streakFreezesAvailable: 1,
      }),
    );
    expect(addClosedDay(EMPTY_MONTHLY_COUNTERS, frozen)).toMatchObject({
      closedDays: 1,
      frozenDays: 1,
      missedDays: 0,
    });
    expect(addClosedDay(EMPTY_MONTHLY_COUNTERS, close({}))).toMatchObject({
      closedDays: 1,
      frozenDays: 0,
      missedDays: 1,
    });
  });

  it('counts an inactive day as closed only', () => {
    const inactive = evaluateDay({ dateKey: DAY, habits: [], entries: {}, state: stateBefore() });
    expect(addClosedDay(EMPTY_MONTHLY_COUNTERS, inactive)).toEqual({
      ...EMPTY_MONTHLY_COUNTERS,
      closedDays: 1,
    });
  });

  it('does not mutate the counters it receives', () => {
    const before = { ...EMPTY_MONTHLY_COUNTERS, habitStats: {} };
    addClosedDay(before, close({ reading: { completed: true } }));
    expect(before).toEqual(EMPTY_MONTHLY_COUNTERS);
  });
});

describe('addMonthlySpending', () => {
  it('adds a spend (negative amount) to points spent as a positive number', () => {
    const counters = addMonthlySpending({ ...EMPTY_MONTHLY_COUNTERS, pointsSpent: 60 }, -150);
    expect(counters.pointsSpent).toBe(210);
  });
});

describe('mergeMonthlyCounters', () => {
  it('adds every counter and the habit stats of both periods', () => {
    const merged = mergeMonthlyCounters(
      {
        closedDays: 30,
        completedDays: 20,
        perfectDays: 4,
        frozenDays: 1,
        missedDays: 9,
        pointsEarned: 300,
        pointsSpent: 150,
        habitStats: { reading: { scheduledDays: 30, completedDays: 25 } },
      },
      {
        closedDays: 5,
        completedDays: 5,
        perfectDays: 2,
        frozenDays: 0,
        missedDays: 0,
        pointsEarned: 90,
        pointsSpent: 0,
        habitStats: {
          reading: { scheduledDays: 5, completedDays: 5 },
          water: { scheduledDays: 5, completedDays: 3 },
        },
      },
    );
    expect(merged).toEqual({
      closedDays: 35,
      completedDays: 25,
      perfectDays: 6,
      frozenDays: 1,
      missedDays: 9,
      pointsEarned: 390,
      pointsSpent: 150,
      habitStats: {
        reading: { scheduledDays: 35, completedDays: 30 },
        water: { scheduledDays: 5, completedDays: 3 },
      },
    });
  });
});
