// Cumplimiento por categoría: lo que dibuja el radar del año.
import { categoryOf, HABIT_CATEGORIES, type HabitCategoryInfo } from './habit-appearance';
import type { HabitPeriodStats } from './statistics';
import type { Habit } from './types';

export interface CategoryStats {
  category: HabitCategoryInfo;
  habitCount: number;
  /** Días cerrados en que contaba algún hábito de la categoría. */
  scheduledDays: number;
  completedDays: number;
  /** 0..1; null si ninguno de sus hábitos contó en un día cerrado. */
  completionRate: number | null;
}

/**
 * Suma los días de todos los hábitos de cada categoría. Se suman los días, no se promedian los
 * porcentajes: un hábito de 90 días pesa más que uno de 4, igual que en el resto de la app.
 * Devuelve solo las categorías que tienen hábitos, en el orden de `HABIT_CATEGORIES`.
 */
export function buildCategoryStats<T extends Habit>(
  rows: readonly HabitPeriodStats<T>[],
): CategoryStats[] {
  return HABIT_CATEGORIES.map((category) => {
    const own = rows.filter(
      (row) => categoryOf((row.habit as { category?: unknown }).category).id === category.id,
    );
    const scheduledDays = own.reduce((total, row) => total + row.scheduledDays, 0);
    const completedDays = own.reduce((total, row) => total + row.completedDays, 0);
    return {
      category,
      habitCount: own.length,
      scheduledDays,
      completedDays,
      completionRate: scheduledDays === 0 ? null : completedDays / scheduledDays,
    };
  }).filter((entry) => entry.habitCount > 0);
}
