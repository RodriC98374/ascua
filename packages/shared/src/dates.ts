// Fechas del sistema. Regla única: los días de calendario se calculan en America/La_Paz
// y la aritmética de días se hace sobre UTC puro, sin depender de la zona de la máquina.
import { APP_TIME_ZONE } from './constants';
import type { DateKey, MonthKey } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const boliviaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Día de calendario en Bolivia al que pertenece un instante. */
export function toDateKey(instant: Date): DateKey {
  const parts = Object.fromEntries(
    boliviaDateFormatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Día de hoy en Bolivia. En producción `now` debe venir de la hora del servidor cuando importe. */
export function todayDateKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

export function toMonthKey(dateKey: DateKey): MonthKey {
  return dateKey.slice(0, 7);
}

/** Milisegundos UTC de la medianoche UTC de ese día; solo para aritmética de calendario. */
function toUtcMs(dateKey: DateKey): number {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(5, 7));
  const day = Number(dateKey.slice(8, 10));
  return Date.UTC(year, month - 1, day);
}

function fromUtcMs(ms: number): DateKey {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(dateKey: DateKey, days: number): DateKey {
  return fromUtcMs(toUtcMs(dateKey) + days * MS_PER_DAY);
}

/** Días de calendario desde `from` hasta `to` (negativo si `to` es anterior). */
export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

/** Lunes de la semana del día dado (las semanas van de lunes a domingo). */
export function startOfWeek(dateKey: DateKey): DateKey {
  const weekday = new Date(toUtcMs(dateKey)).getUTCDay(); // 0 = domingo
  const daysSinceMonday = (weekday + 6) % 7;
  return addDays(dateKey, -daysSinceMonday);
}

export function isValidDateKey(value: string): value is DateKey {
  return DATE_KEY_PATTERN.test(value) && fromUtcMs(toUtcMs(value)) === value;
}

/** Todos los días entre `from` y `to`, ambos incluidos. */
export function dateKeyRange(from: DateKey, to: DateKey): DateKey[] {
  const length = daysBetween(from, to) + 1;
  return Array.from({ length: Math.max(length, 0) }, (_, i) => addDays(from, i));
}

/** Días que faltan cerrar: desde el siguiente al último cerrado hasta ayer. Nunca incluye hoy. */
export function pendingDateKeysToClose(lastClosedDateKey: DateKey, today: DateKey): DateKey[] {
  return dateKeyRange(addDays(lastClosedDateKey, 1), addDays(today, -1));
}
