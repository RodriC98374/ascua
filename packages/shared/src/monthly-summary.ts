// Resumen mensual: se actualiza en la misma transacción que cierra cada día (y en cada gasto),
// para que las vistas de mes y año no tengan que leer cada día por separado.
import type { DayEvaluation } from './day-evaluation';
import type { MonthlyCounters } from './types';

export const EMPTY_MONTHLY_COUNTERS: MonthlyCounters = {
  closedDays: 0,
  completedDays: 0,
  perfectDays: 0,
  frozenDays: 0,
  missedDays: 0,
  pointsEarned: 0,
  pointsSpent: 0,
  habitStats: {},
};

/**
 * Los contadores del mes después de cerrar un día de ese mes. Recibe la evaluación del cierre o
 * un registro ya cerrado (las estadísticas suman así los días, igual que el resumen mensual).
 */
export function addClosedDay(
  before: MonthlyCounters,
  evaluation: Pick<DayEvaluation, 'status' | 'summary'>,
): MonthlyCounters {
  const { status, summary } = evaluation;
  const completed = new Set(summary.completedHabitIds);
  const habitStats = { ...before.habitStats };
  for (const habitId of summary.scheduledHabitIds) {
    const stats = habitStats[habitId] ?? { scheduledDays: 0, completedDays: 0 };
    habitStats[habitId] = {
      scheduledDays: stats.scheduledDays + 1,
      completedDays: stats.completedDays + (completed.has(habitId) ? 1 : 0),
    };
  }
  return {
    ...before,
    closedDays: before.closedDays + 1,
    completedDays: before.completedDays + (status === 'completed' ? 1 : 0),
    perfectDays: before.perfectDays + (summary.isPerfectDay ? 1 : 0),
    frozenDays: before.frozenDays + (status === 'frozen' ? 1 : 0),
    missedDays: before.missedDays + (status === 'missed' ? 1 : 0),
    pointsEarned: before.pointsEarned + summary.pointsEarned,
    habitStats,
  };
}

/** Los contadores del mes después de un gasto; `amount` es el del movimiento (negativo). */
export function addMonthlySpending(before: MonthlyCounters, amount: number): MonthlyCounters {
  return { ...before, pointsSpent: before.pointsSpent - amount };
}

/** La suma de dos periodos, por ejemplo los meses de un año. */
export function mergeMonthlyCounters(a: MonthlyCounters, b: MonthlyCounters): MonthlyCounters {
  const habitStats = { ...a.habitStats };
  for (const [habitId, stats] of Object.entries(b.habitStats)) {
    const before = habitStats[habitId] ?? { scheduledDays: 0, completedDays: 0 };
    habitStats[habitId] = {
      scheduledDays: before.scheduledDays + stats.scheduledDays,
      completedDays: before.completedDays + stats.completedDays,
    };
  }
  return {
    closedDays: a.closedDays + b.closedDays,
    completedDays: a.completedDays + b.completedDays,
    perfectDays: a.perfectDays + b.perfectDays,
    frozenDays: a.frozenDays + b.frozenDays,
    missedDays: a.missedDays + b.missedDays,
    pointsEarned: a.pointsEarned + b.pointsEarned,
    pointsSpent: a.pointsSpent + b.pointsSpent,
    habitStats,
  };
}
