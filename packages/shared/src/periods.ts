// Periodos de las vistas de progreso (semana, mes y año) y cómo se navega entre ellos.
import { addDays, startOfWeek, toMonthKey } from './dates';
import { formatDateRange, formatMonthYear } from './format-date';
import type { DateKey } from './types';

export type PeriodKind = 'week' | 'month' | 'year';

export interface Period {
  kind: PeriodKind;
  /** Primer día: el lunes, el día 1 del mes o el 1 de enero. */
  startDateKey: DateKey;
  /** Último día, incluido. */
  endDateKey: DateKey;
}

/** Meses contados desde el año 0, para moverse entre meses sin desbordar los días. */
function monthIndexOf(dateKey: DateKey): number {
  return Number(dateKey.slice(0, 4)) * 12 + Number(dateKey.slice(5, 7)) - 1;
}

function firstDayOfMonth(monthIndex: number): DateKey {
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12 + 1;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function monthPeriod(monthIndex: number): Period {
  return {
    kind: 'month',
    startDateKey: firstDayOfMonth(monthIndex),
    endDateKey: addDays(firstDayOfMonth(monthIndex + 1), -1),
  };
}

function yearPeriod(year: number): Period {
  return { kind: 'year', startDateKey: `${year}-01-01`, endDateKey: `${year}-12-31` };
}

/** El periodo de ese tipo que contiene el día. Las semanas van de lunes a domingo. */
export function periodContaining(kind: PeriodKind, dateKey: DateKey): Period {
  switch (kind) {
    case 'week': {
      const startDateKey = startOfWeek(dateKey);
      return { kind, startDateKey, endDateKey: addDays(startDateKey, 6) };
    }
    case 'month':
      return monthPeriod(monthIndexOf(dateKey));
    case 'year':
      return yearPeriod(Number(dateKey.slice(0, 4)));
  }
}

/** El periodo del mismo tipo `offset` veces antes (negativo) o después (positivo). */
export function shiftPeriod(period: Period, offset: number): Period {
  switch (period.kind) {
    case 'week':
      return periodContaining('week', addDays(period.startDateKey, offset * 7));
    case 'month':
      return monthPeriod(monthIndexOf(period.startDateKey) + offset);
    case 'year':
      return yearPeriod(Number(period.startDateKey.slice(0, 4)) + offset);
  }
}

export interface PeriodNavigation {
  previous: Period | null;
  next: Period | null;
}

/**
 * A qué periodos se puede ir desde `period`: nunca a uno que empiece después de hoy, ni a uno
 * que termine antes del primer día con hábitos (`firstDateKey`; null si todavía no hay hábitos).
 */
export function periodNavigation(
  period: Period,
  { today, firstDateKey }: { today: DateKey; firstDateKey: DateKey | null },
): PeriodNavigation {
  const previous = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);
  return {
    previous: firstDateKey !== null && previous.endDateKey >= firstDateKey ? previous : null,
    next: next.startDateKey <= today ? next : null,
  };
}

/** '21 – 27 sep 2026', 'Septiembre 2026' o '2026'. */
export function formatPeriodLabel(period: Period): string {
  switch (period.kind) {
    case 'week':
      return formatDateRange(period.startDateKey, period.endDateKey);
    case 'month':
      return formatMonthYear(toMonthKey(period.startDateKey));
    case 'year':
      return period.startDateKey.slice(0, 4);
  }
}

const RELATIVE_NAMES: Record<PeriodKind, { current: string; previous: string }> = {
  week: { current: 'Esta semana', previous: 'La semana pasada' },
  month: { current: 'Este mes', previous: 'El mes pasado' },
  year: { current: 'Este año', previous: 'El año pasado' },
};

/** 'Este mes', 'La semana pasada'…; null para los periodos anteriores a esos. */
export function describePeriodRelative(period: Period, today: DateKey): string | null {
  const current = periodContaining(period.kind, today);
  const names = RELATIVE_NAMES[period.kind];
  if (period.startDateKey === current.startDateKey) {
    return names.current;
  }
  if (period.startDateKey === shiftPeriod(current, -1).startDateKey) {
    return names.previous;
  }
  return null;
}

/**
 * Bloque de siete días del mes al que pertenece el día (0 a 4): 1–7, 8–14, 15–21, 22–28 y
 * 29–31. La grilla del mes pinta cada bloque con su color de semana; así nunca hacen falta más
 * de los cinco colores del diseño.
 */
export function monthWeekIndex(dateKey: DateKey): number {
  return Math.floor((Number(dateKey.slice(8, 10)) - 1) / 7);
}
