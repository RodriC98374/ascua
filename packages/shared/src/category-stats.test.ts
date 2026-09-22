import { describe, expect, it } from 'vitest';

import { buildCategoryStats } from './category-stats';
import type { HabitPeriodStats } from './statistics';
import type { HabitCategory } from './habit-appearance';
import type { HabitRecord } from './types';

function row(
  id: string,
  category: HabitCategory,
  scheduledDays: number,
  completedDays: number,
): HabitPeriodStats<HabitRecord> {
  return {
    habit: {
      id,
      name: id,
      tier: 'primary',
      schedule: { type: 'daily' },
      status: 'active',
      startDateKey: '2026-01-01',
      archivedDateKey: null,
      description: null,
      icon: 'check',
      color: '#9FCBAC',
      category,
      sortOrder: 0,
    },
    scheduledDays,
    completedDays,
    completionRate: scheduledDays === 0 ? null : completedDays / scheduledDays,
  };
}

describe('buildCategoryStats', () => {
  it('adds up the habits of each category instead of averaging their rates', () => {
    const stats = buildCategoryStats([
      row('a', 'health', 10, 5),
      row('b', 'health', 90, 90),
      row('c', 'mental', 4, 1),
    ]);

    const health = stats.find((entry) => entry.category.id === 'health')!;
    // 95 de 100, no el promedio de 50% y 100%.
    expect(health.scheduledDays).toBe(100);
    expect(health.completedDays).toBe(95);
    expect(health.completionRate).toBe(0.95);
    expect(health.habitCount).toBe(2);
  });

  it('keeps the order of HABIT_CATEGORIES, not the order of the rows', () => {
    const stats = buildCategoryStats([
      row('a', 'other', 1, 1),
      row('b', 'health', 1, 1),
      row('c', 'academic', 1, 1),
    ]);
    expect(stats.map((entry) => entry.category.id)).toEqual(['health', 'academic', 'other']);
  });

  it('leaves out categories with no habits', () => {
    const stats = buildCategoryStats([row('a', 'health', 3, 3)]);
    expect(stats).toHaveLength(1);
  });

  it('gives a null rate to a category whose habits never counted on a closed day', () => {
    const stats = buildCategoryStats([row('a', 'mental', 0, 0)]);
    expect(stats[0]!.completionRate).toBeNull();
  });

  it('returns nothing when there are no habits', () => {
    expect(buildCategoryStats([])).toEqual([]);
  });
});
