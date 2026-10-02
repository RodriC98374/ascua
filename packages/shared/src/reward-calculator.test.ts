import { describe, expect, it } from 'vitest';

import { REWARD_COST_MAX } from './constants';
import {
  daysToAfford,
  dailyPointsPace,
  perfectMonthPoints,
  suggestRewardCost,
} from './reward-calculator';
import type { DailyLog, Habit } from './types';

// 2026-10-05 es lunes.
const MONDAY = '2026-10-05';

function habit(id: string, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    tier: 'primary',
    schedule: { type: 'daily' },
    status: 'active',
    startDateKey: '2026-10-20',
    archivedDateKey: null,
    ...overrides,
  };
}

describe('perfectMonthPoints', () => {
  it('is 0 without active habits', () => {
    expect(perfectMonthPoints([], MONDAY)).toBe(0);
    expect(perfectMonthPoints([habit('a', { status: 'archived' })], MONDAY)).toBe(0);
  });

  it('adds the habit, the perfect day and the streak bonuses of 30 perfect days', () => {
    // 30 × (10 + 5) + 4 bonos de 7 días (20) + 1 de 30 días (100). Cuenta aunque empiece después.
    expect(perfectMonthPoints([habit('a')], MONDAY)).toBe(450 + 80 + 100);
  });

  it('adds every active habit by its tier', () => {
    const habits = [habit('a'), habit('b', { tier: 'secondary' })];
    expect(perfectMonthPoints(habits, MONDAY)).toBe(630 + 30 * 5);
  });

  it('counts a fixed-days habit only on its days, without breaking the streak in between', () => {
    // Lunes, miércoles y viernes: 13 días en 30 desde un lunes; un bono de 7 días.
    const habits = [habit('a', { schedule: { type: 'days_of_week', daysOfWeek: [1, 3, 5] } })];
    expect(perfectMonthPoints(habits, MONDAY)).toBe(13 * 15 + 20);
  });

  it('counts a weekly habit up to its marks per week, with no day bonuses', () => {
    // 3 por semana: 4 semanas completas y el lunes y martes de la quinta = 14 marcas de 5.
    const habits = [
      habit('a', { tier: 'secondary', schedule: { type: 'times_per_week', timesPerWeek: 3 } }),
    ];
    expect(perfectMonthPoints(habits, MONDAY)).toBe(14 * 5);
  });

  it('counts habits with a target or with steps as done', () => {
    const habits = [
      habit('a', { target: { amount: 8, unit: 'vasos' } }),
      habit('b', {
        steps: [
          { id: 'x', title: 'Uno' },
          { id: 'y', title: 'Dos' },
        ],
      }),
    ];
    expect(perfectMonthPoints(habits, MONDAY)).toBe(30 * 25 + 180);
  });

  it('always starts on the Monday of the given week', () => {
    const habits = [habit('a', { schedule: { type: 'times_per_week', timesPerWeek: 3 } })];
    expect(perfectMonthPoints(habits, '2026-10-08')).toBe(perfectMonthPoints(habits, MONDAY));
  });
});

describe('suggestRewardCost', () => {
  it('turns the price into points at the rate of a perfect month for the monthly budget', () => {
    // 1250 pts por 250 Bs: 5 pts por Bs.
    expect(suggestRewardCost({ price: 675, monthlyBudget: 250, perfectMonthPoints: 1250 })).toEqual(
      { pointsPerBs: 5, cost: 3375, budgetMonths: 2.7 },
    );
  });

  it('rounds the cost to a multiple of 5, at least 5', () => {
    const rate = { monthlyBudget: 300, perfectMonthPoints: 1000 };
    expect(suggestRewardCost({ price: 100, ...rate })?.cost).toBe(335);
    expect(
      suggestRewardCost({ price: 1, monthlyBudget: 1000, perfectMonthPoints: 100 })?.cost,
    ).toBe(5);
  });

  it('never suggests more than the maximum cost', () => {
    expect(
      suggestRewardCost({ price: 100_000, monthlyBudget: 1, perfectMonthPoints: 1000 })?.cost,
    ).toBe(REWARD_COST_MAX);
  });

  it('has no suggestion without a price, a budget or habits', () => {
    expect(
      suggestRewardCost({ price: 0, monthlyBudget: 250, perfectMonthPoints: 1250 }),
    ).toBeNull();
    expect(suggestRewardCost({ price: 50, monthlyBudget: 0, perfectMonthPoints: 1250 })).toBeNull();
    expect(suggestRewardCost({ price: 50, monthlyBudget: 250, perfectMonthPoints: 0 })).toBeNull();
  });
});

function closed(dateKey: string, pointsEarned: number): Pick<DailyLog, 'dateKey' | 'summary'> {
  return {
    dateKey,
    summary: {
      scheduledHabitIds: [],
      scheduledPrimaryHabitIds: [],
      completedHabitIds: [],
      completionRate: 0,
      isPerfectDay: false,
      pointsEarned,
      streakAfterClose: 0,
    },
  };
}

describe('dailyPointsPace', () => {
  const TODAY = '2026-10-31';

  it('averages the points of the closed days of the last 30 days', () => {
    expect(dailyPointsPace([closed('2026-10-30', 40), closed('2026-10-01', 20)], TODAY)).toBe(30);
  });

  it('ignores open days and days out of the window', () => {
    const logs = [
      closed('2026-10-30', 40),
      { dateKey: TODAY, summary: null },
      closed('2026-09-30', 999),
      closed(TODAY, 999),
    ];
    expect(dailyPointsPace(logs, TODAY)).toBe(40);
  });

  it('has no pace without closed days', () => {
    expect(dailyPointsPace([], TODAY)).toBeNull();
  });
});

describe('daysToAfford', () => {
  it('counts the days left at the pace, rounding up', () => {
    expect(daysToAfford({ cost: 300, availablePoints: 100, pace: 30 })).toBe(7);
  });

  it('is 0 when the points are already there', () => {
    expect(daysToAfford({ cost: 300, availablePoints: 300, pace: null })).toBe(0);
  });

  it('cannot tell without a pace', () => {
    expect(daysToAfford({ cost: 300, availablePoints: 0, pace: null })).toBeNull();
    expect(daysToAfford({ cost: 300, availablePoints: 0, pace: 0 })).toBeNull();
  });
});
