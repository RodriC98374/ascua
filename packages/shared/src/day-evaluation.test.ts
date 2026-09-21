import { describe, expect, it } from 'vitest';

import { evaluateDay } from './day-evaluation';
import type { DailyEntries, GamificationState, Habit } from './types';

const DAY = '2026-09-21';

function habit(id: string, tier: Habit['tier'], overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    tier,
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-09-01',
    archivedDateKey: null,
    ...overrides,
  };
}

const HABITS: Habit[] = [
  habit('read', 'primary', { name: 'Leer 20 min' }),
  habit('exercise', 'primary', { name: 'Ejercicio' }),
  habit('water', 'secondary', { name: 'Tomar 2 L de agua' }),
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
    streakFreezesAvailable: 1,
    totalStreakFreezesUsed: 0,
    lastClosedDateKey: '2026-09-20',
    ...overrides,
  };
}

function done(...ids: string[]): DailyEntries {
  return Object.fromEntries(ids.map((id) => [id, { completed: true }]));
}

describe('evaluateDay', () => {
  describe('when all primary habits are completed', () => {
    const result = evaluateDay({
      dateKey: DAY,
      habits: HABITS,
      entries: done('read', 'exercise'),
      state: state(),
    });

    it('marks the day as completed and grows the streak', () => {
      expect(result.status).toBe('completed');
      expect(result.nextState.currentStreak).toBe(4);
      expect(result.nextState.daysWithoutFreeze).toBe(4);
      expect(result.summary.streakAfterClose).toBe(4);
    });

    it('is not a perfect day if a secondary habit is missing', () => {
      expect(result.summary.isPerfectDay).toBe(false);
      expect(result.transactions.map((t) => t.type)).not.toContain('perfect_day_bonus');
    });

    it('credits 10 points per completed primary habit', () => {
      expect(result.transactions).toHaveLength(2);
      expect(result.summary.pointsEarned).toBe(20);
      expect(result.nextState.pointsBalance).toBe(120);
      expect(result.nextState.lifetimePointsEarned).toBe(120);
    });

    it('summarizes the day', () => {
      expect(result.summary.scheduledHabitIds).toEqual(['read', 'exercise', 'water']);
      expect(result.summary.scheduledPrimaryHabitIds).toEqual(['read', 'exercise']);
      expect(result.summary.completedHabitIds).toEqual(['read', 'exercise']);
      expect(result.summary.completionRate).toBeCloseTo(2 / 3);
    });

    it('advances the last closed day', () => {
      expect(result.nextState.lastClosedDateKey).toBe(DAY);
    });
  });

  describe('when every scheduled habit is completed', () => {
    const result = evaluateDay({
      dateKey: DAY,
      habits: HABITS,
      entries: done('read', 'exercise', 'water'),
      state: state(),
    });

    it('is a perfect day with its bonus', () => {
      expect(result.status).toBe('completed');
      expect(result.summary.isPerfectDay).toBe(true);
      expect(result.summary.completionRate).toBe(1);
      // 10 + 10 + 5 + 5 del bono.
      expect(result.summary.pointsEarned).toBe(30);
    });

    it('creates one movement per completed habit and then the bonus, with running balances', () => {
      expect(result.transactions).toEqual([
        {
          id: 'completion_2026-09-21_read',
          type: 'habit_completion',
          amount: 10,
          balanceAfter: 110,
          dateKey: DAY,
          sourceType: 'habit',
          sourceId: 'read',
          description: 'Hábito cumplido: Leer 20 min',
        },
        expect.objectContaining({
          id: 'completion_2026-09-21_exercise',
          amount: 10,
          balanceAfter: 120,
        }),
        expect.objectContaining({
          id: 'completion_2026-09-21_water',
          amount: 5,
          balanceAfter: 125,
        }),
        {
          id: 'perfect_2026-09-21',
          type: 'perfect_day_bonus',
          amount: 5,
          balanceAfter: 130,
          dateKey: DAY,
          sourceType: 'daily_log',
          sourceId: DAY,
          description: 'Día perfecto',
        },
      ]);
      expect(result.nextState.pointsBalance).toBe(130);
    });
  });

  describe('when there are no primary habits', () => {
    const secondaryOnly = [habit('water', 'secondary'), habit('sleep', 'secondary')];

    it('uses every scheduled habit as the streak goal', () => {
      const met = evaluateDay({
        dateKey: DAY,
        habits: secondaryOnly,
        entries: done('water', 'sleep'),
        state: state(),
      });
      expect(met.status).toBe('completed');

      const notMet = evaluateDay({
        dateKey: DAY,
        habits: secondaryOnly,
        entries: done('water'),
        state: state({ streakFreezesAvailable: 0 }),
      });
      expect(notMet.status).toBe('missed');
    });
  });

  describe('when no habit is scheduled that day', () => {
    const before = state();
    const result = evaluateDay({
      dateKey: DAY,
      habits: [habit('read', 'primary', { startDateKey: '2026-09-22' })],
      entries: {},
      state: before,
    });

    it('is inactive and leaves the streak and points untouched', () => {
      expect(result.status).toBe('inactive');
      expect(result.transactions).toEqual([]);
      expect(result.nextState).toEqual({ ...before, lastClosedDateKey: DAY });
      expect(result.summary).toMatchObject({
        scheduledHabitIds: [],
        completionRate: 0,
        isPerfectDay: false,
        pointsEarned: 0,
        streakAfterClose: 3,
      });
    });
  });

  describe('when the goal is not met', () => {
    it('uses a freeze automatically if there is a streak to protect', () => {
      const result = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: done('read'),
        state: state({ streakFreezesAvailable: 2, totalStreakFreezesUsed: 1 }),
      });
      expect(result.status).toBe('frozen');
      expect(result.freezeUsed).toBe(true);
      expect(result.nextState).toMatchObject({
        currentStreak: 3,
        currentStreakStartDateKey: '2026-09-18',
        daysWithoutFreeze: 0,
        streakFreezesAvailable: 1,
        totalStreakFreezesUsed: 2,
      });
    });

    it('does not waste a freeze when there is no streak to protect', () => {
      const result = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: {},
        state: state({ currentStreak: 0, currentStreakStartDateKey: null, daysWithoutFreeze: 0 }),
      });
      expect(result.status).toBe('missed');
      expect(result.freezeUsed).toBe(false);
      expect(result.nextState.streakFreezesAvailable).toBe(1);
    });

    it('breaks the streak when there is no freeze', () => {
      const result = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: done('read'),
        state: state({ streakFreezesAvailable: 0 }),
      });
      expect(result.status).toBe('missed');
      expect(result.nextState).toMatchObject({
        currentStreak: 0,
        currentStreakStartDateKey: null,
        daysWithoutFreeze: 0,
        longestStreak: 5,
      });
      expect(result.summary.streakAfterClose).toBe(0);
    });

    it('still credits the habits that were completed', () => {
      const result = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: done('read', 'water'),
        state: state({ streakFreezesAvailable: 0 }),
      });
      expect(result.summary.pointsEarned).toBe(15);
      expect(result.nextState.pointsBalance).toBe(115);
    });
  });

  describe('streak bookkeeping', () => {
    it('records the start day when a new streak begins', () => {
      const result = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: done('read', 'exercise'),
        state: state({ currentStreak: 0, currentStreakStartDateKey: null, daysWithoutFreeze: 0 }),
      });
      expect(result.nextState.currentStreak).toBe(1);
      expect(result.nextState.currentStreakStartDateKey).toBe(DAY);
    });

    it('updates the longest streak only when it is beaten', () => {
      const tied = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: done('read', 'exercise'),
        state: state({ currentStreak: 4, longestStreak: 5 }),
      });
      expect(tied.nextState.longestStreak).toBe(5);

      const beaten = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: done('read', 'exercise'),
        state: state({ currentStreak: 5, longestStreak: 5 }),
      });
      expect(beaten.nextState.longestStreak).toBe(6);
    });
  });

  describe('streak bonuses', () => {
    function bonusTypesAt(daysWithoutFreezeAfterToday: number) {
      const result = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: done('read', 'exercise'),
        state: state({
          currentStreak: daysWithoutFreezeAfterToday - 1,
          longestStreak: 1000,
          daysWithoutFreeze: daysWithoutFreezeAfterToday - 1,
        }),
      });
      return result.transactions.filter((t) => t.sourceType === 'daily_log').map((t) => t.id);
    }

    it('gives +20 every 7 days without a freeze', () => {
      expect(bonusTypesAt(7)).toEqual(['streak7_2026-09-21']);
      expect(bonusTypesAt(14)).toEqual(['streak7_2026-09-21']);
    });

    it('gives +100 every 30 days without a freeze', () => {
      expect(bonusTypesAt(30)).toEqual(['streak30_2026-09-21']);
    });

    it('gives both bonuses on a day that is a multiple of 7 and 30', () => {
      expect(bonusTypesAt(210)).toEqual(['streak7_2026-09-21', 'streak30_2026-09-21']);
    });

    it('gives nothing on other days', () => {
      expect(bonusTypesAt(6)).toEqual([]);
      expect(bonusTypesAt(8)).toEqual([]);
    });

    it('credits the right amounts', () => {
      const result = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: done('read', 'exercise', 'water'),
        state: state({ currentStreak: 209, longestStreak: 209, daysWithoutFreeze: 209 }),
      });
      // 10 + 10 + 5 hábitos, +5 día perfecto, +20 y +100 de racha.
      expect(result.summary.pointsEarned).toBe(150);
      expect(result.transactions.at(-2)).toMatchObject({ type: 'streak_bonus_7_days', amount: 20 });
      expect(result.transactions.at(-1)).toMatchObject({
        type: 'streak_bonus_30_days',
        amount: 100,
      });
    });

    it('counts again from zero after a freeze was used', () => {
      const result = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: done('read', 'exercise'),
        // Racha larga, pero el último protector se usó hace 6 días.
        state: state({ currentStreak: 20, longestStreak: 20, daysWithoutFreeze: 6 }),
      });
      expect(result.transactions.map((t) => t.type)).toContain('streak_bonus_7_days');
      expect(result.nextState.daysWithoutFreeze).toBe(7);
    });
  });

  describe('input hygiene', () => {
    it('ignores entries for habits that are unknown or not scheduled that day', () => {
      const result = evaluateDay({
        dateKey: DAY,
        habits: [
          ...HABITS,
          habit('old', 'primary', { status: 'archived', archivedDateKey: '2026-09-15' }),
        ],
        entries: done('read', 'exercise', 'ghost', 'old'),
        state: state(),
      });
      expect(result.summary.completedHabitIds).toEqual(['read', 'exercise']);
      expect(result.summary.scheduledHabitIds).not.toContain('old');
      expect(result.summary.pointsEarned).toBe(20);
    });

    it('treats an unchecked entry as not completed', () => {
      const result = evaluateDay({
        dateKey: DAY,
        habits: HABITS,
        entries: { read: { completed: true }, exercise: { completed: false } },
        state: state({ streakFreezesAvailable: 0 }),
      });
      expect(result.status).toBe('missed');
    });

    it('refuses to close a day that is not the next one after the last closed day', () => {
      expect(() =>
        evaluateDay({
          dateKey: '2026-09-22',
          habits: HABITS,
          entries: {},
          state: state({ lastClosedDateKey: '2026-09-20' }),
        }),
      ).toThrow(/2026-09-21/);
    });
  });
});
