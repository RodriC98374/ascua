// Datos de las gráficas a partir de las estadísticas de `shared`.
import {
  formatMonthAbbrev,
  formatWeekdayInitial,
  type DateKey,
  type DayStats,
  type DayStatsStatus,
  type MonthKey,
  type MonthStats,
} from '@ascua/shared';

import { percentValue } from './statistics-text';

/** Cada cuántos puntos lleva etiqueta el eje de la racha: el mes entero no cabe en 360 px. */
const STREAK_LABEL_EVERY = 5;

export interface StreakPoint {
  dateKey: DateKey;
  value: number;
  /** Día del mes, solo en algunos puntos. */
  label: string;
}

/** La racha al cerrar cada día cerrado del rango. */
export function streakPoints(days: readonly DayStats[]): StreakPoint[] {
  return days
    .filter((day): day is DayStats & { streakAfterClose: number } => day.streakAfterClose !== null)
    .map((day, index) => ({
      dateKey: day.dateKey,
      value: day.streakAfterClose,
      label: index % STREAK_LABEL_EVERY === 0 ? String(Number(day.dateKey.slice(8, 10))) : '',
    }));
}

export interface WeekBar {
  dateKey: DateKey;
  /** 0..100. */
  value: number;
  /** Inicial del día: 'L', 'M', 'X'… */
  label: string;
  status: DayStatsStatus;
  isToday: boolean;
  /** Sin nada que medir (futuro, sin hábitos, sin datos). */
  isEmpty: boolean;
}

export function weekBars(days: readonly DayStats[]): WeekBar[] {
  return days.map((day) => ({
    dateKey: day.dateKey,
    value: percentValue(day.completionRate),
    label: formatWeekdayInitial(day.dateKey),
    status: day.status,
    isToday: day.isToday,
    isEmpty: day.completionRate === null,
  }));
}

export interface MonthPoint {
  monthKey: MonthKey;
  /** 0..100. */
  value: number;
  label: string;
}

/** 0..1 del mes: de todos los hábitos o, si se eligió uno, solo de ese; null sin días que contar. */
export function monthRate(month: MonthStats, habitId: string | null): number | null {
  if (habitId === null) return month.completionRate;
  const stats = month.habitStats[habitId];
  return stats && stats.scheduledDays > 0 ? stats.completedDays / stats.scheduledDays : null;
}

/** El % de cada mes con datos; los meses sin datos no se dibujan como 0%. */
export function yearPoints(
  months: readonly MonthStats[],
  habitId: string | null = null,
): MonthPoint[] {
  return months.flatMap((month) => {
    const rate = monthRate(month, habitId);
    return rate === null
      ? []
      : [
          {
            monthKey: month.monthKey,
            value: percentValue(rate),
            label: formatMonthAbbrev(month.monthKey),
          },
        ];
  });
}

/** Tope del eje: múltiplo de `sections` para que las líneas guía caigan en enteros. */
export function axisMax(values: readonly number[], sections: number): number {
  const max = Math.max(0, ...values);
  return Math.max(sections, Math.ceil(max / sections) * sections);
}
