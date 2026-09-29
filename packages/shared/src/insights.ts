// Destacados de Mes y Año y el mapa de calor del año (fase 17). Parten de lo que ya calcula
// `statistics.ts`, así que sus cifras coinciden con las de la grilla y los resúmenes.
import { INSIGHT_MIN_HABIT_DAYS, INSIGHT_MIN_WEEKDAY_DAYS } from './constants';
import { isoWeekday } from './dates';
import type { DayStats, DayStatsStatus, HabitPeriodStats } from './statistics';
import type { DateKey, Habit } from './types';

/** Intensidad de un día en el mapa de calor: 0 (nada) a 4 (todo). */
export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/** Nivel según el % de hábitos cumplidos; null si ese día no contaba ningún hábito. */
export function heatLevel(completionRate: number | null): HeatLevel | null {
  if (completionRate === null) return null;
  if (completionRate >= 1) return 4;
  if (completionRate >= 0.75) return 3;
  if (completionRate >= 0.5) return 2;
  if (completionRate > 0) return 1;
  return 0;
}

/** Columnas de lunes a domingo, como el mapa de GitHub; los huecos de los bordes van en null. */
export function heatmapWeeks<T extends { dateKey: DateKey }>(days: readonly T[]): (T | null)[][] {
  const first = days[0];
  if (!first) return [];
  const cells: (T | null)[] = [
    ...Array.from({ length: isoWeekday(first.dateKey) - 1 }, () => null),
    ...days,
  ];
  const weeks: (T | null)[][] = [];
  for (let start = 0; start < cells.length; start += 7) {
    const week = cells.slice(start, start + 7);
    weeks.push([...week, ...Array.from({ length: 7 - week.length }, () => null)]);
  }
  return weeks;
}

const CLOSED_STATUSES: readonly DayStatsStatus[] = ['completed', 'perfect', 'frozen', 'missed'];

export interface BestWeekdays {
  /** 1 = lunes … 7 = domingo; varios si empatan. */
  weekdays: number[];
  /** Promedio del % de hábitos cumplidos de esos días. */
  completionRate: number;
}

/**
 * El día de la semana con mejor promedio en los días cerrados. Solo compara los días de la
 * semana con al menos `INSIGHT_MIN_WEEKDAY_DAYS` días; null si queda uno solo o si todos empatan.
 */
export function bestWeekdays(days: readonly DayStats[]): BestWeekdays | null {
  const byWeekday = new Map<number, number[]>();
  for (const day of days) {
    if (!CLOSED_STATUSES.includes(day.status) || day.completionRate === null) continue;
    const weekday = isoWeekday(day.dateKey);
    byWeekday.set(weekday, [...(byWeekday.get(weekday) ?? []), day.completionRate]);
  }
  const averages = [...byWeekday]
    .filter(([, rates]) => rates.length >= INSIGHT_MIN_WEEKDAY_DAYS)
    .map(([weekday, rates]) => ({
      weekday,
      rate: rates.reduce((total, rate) => total + rate, 0) / rates.length,
    }));
  if (averages.length < 2) return null;
  const best = Math.max(...averages.map((item) => item.rate));
  // Tolerancia: promedios iguales pueden diferir en el último decimal.
  const top = averages.filter((item) => best - item.rate < 1e-9);
  if (top.length === averages.length) return null;
  return { weekdays: top.map((item) => item.weekday).sort((a, b) => a - b), completionRate: best };
}

/**
 * El hábito con mayor % entre los que tienen al menos `INSIGHT_MIN_HABIT_DAYS` días. Si empatan,
 * el de más días cumplidos y después el primero. Null si no hay al menos dos para comparar.
 */
export function mostConsistentHabit<T extends Habit>(
  rows: readonly HabitPeriodStats<T>[],
): HabitPeriodStats<T> | null {
  const candidates = rows.filter(
    (row): row is HabitPeriodStats<T> & { completionRate: number } =>
      row.completionRate !== null && row.scheduledDays >= INSIGHT_MIN_HABIT_DAYS,
  );
  if (candidates.length < 2) return null;
  return candidates.reduce((best, row) => {
    if (row.completionRate > best.completionRate) return row;
    if (row.completionRate === best.completionRate && row.completedDays > best.completedDays) {
      return row;
    }
    return best;
  });
}

/** Diferencia en puntos porcentuales (redondeada) contra el periodo anterior. */
export function completionTrend(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  return Math.round((current - previous) * 100);
}
