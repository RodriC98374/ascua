// Datos de las gráficas a partir de las estadísticas de `shared`.
import {
  CHECK_IN_DIMENSIONS,
  checkInAverages,
  formatMonthAbbrev,
  formatWeekdayInitial,
  monthHabitStats,
  type CheckInDimension,
  type DateKey,
  type DayStats,
  type DayStatsStatus,
  type Habit,
  type MonthKey,
  type MonthStats,
  type RangeCheckIn,
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

/** El hábito elegido en el año; `today` hace falta para medir los semanales. */
export type HabitFilter = { habit: Habit; today: DateKey } | null;

/** 0..1 del mes: de todos los hábitos o, si se eligió uno, solo de ese; null sin días que contar. */
export function monthRate(month: MonthStats, filter: HabitFilter): number | null {
  if (filter === null) return month.completionRate;
  return monthHabitStats(month, filter.habit, filter.today).completionRate;
}

/** El % de cada mes con datos; los meses sin datos no se dibujan como 0%. */
export function yearPoints(
  months: readonly MonthStats[],
  filter: HabitFilter = null,
): MonthPoint[] {
  return months.flatMap((month) => {
    const rate = monthRate(month, filter);
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

/** Un punto del eje de la gráfica del check-in: un día (semana, mes) o un mes (año). */
export interface CheckInSlot {
  key: string;
  /** Etiqueta del eje; puede ir vacía. */
  label: string;
  /** Lo contestado ese día, o el promedio del mes; sin la escala = sin datos. */
  values: Partial<Record<CheckInDimension, number>>;
}

/** Todos los días del rango (también los que vienen, vacíos) con lo contestado en cada uno. */
export function rangeCheckInSlots(
  dateKeys: readonly DateKey[],
  checkInDays: RangeCheckIn['days'],
  kind: 'week' | 'month',
): CheckInSlot[] {
  const byDay = new Map(checkInDays.map((day) => [day.dateKey, day.checkIn]));
  return dateKeys.map((dateKey, index) => ({
    key: dateKey,
    label:
      kind === 'week'
        ? formatWeekdayInitial(dateKey)
        : index % STREAK_LABEL_EVERY === 0
          ? String(Number(dateKey.slice(8, 10)))
          : '',
    values: { ...byDay.get(dateKey) },
  }));
}

/** Los meses del año con el promedio de cada escala (días cerrados). */
export function yearCheckInSlots(months: readonly MonthStats[]): CheckInSlot[] {
  return months.map((month) => {
    const averages = checkInAverages(month.checkInStats);
    const values: CheckInSlot['values'] = {};
    for (const dimension of CHECK_IN_DIMENSIONS) {
      const average = averages[dimension];
      if (average !== null) values[dimension] = average;
    }
    return { key: month.monthKey, label: formatMonthAbbrev(month.monthKey), values };
  });
}

/** Tope del eje: múltiplo de `sections` para que las líneas guía caigan en enteros. */
export function axisMax(values: readonly number[], sections: number): number {
  const max = Math.max(0, ...values);
  return Math.max(sections, Math.ceil(max / sections) * sections);
}
