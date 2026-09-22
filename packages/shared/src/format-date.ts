import type { DateKey, MonthKey } from './types';

// Nombres propios en vez de Intl: el soporte de locales en Android (Hermes) no es uniforme.
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
// Iniciales de calendario: la X distingue el miércoles del martes.
const WEEKDAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** El DateKey ya es un día de Bolivia: se lee como fecha en UTC. */
function toUtcDate(dateKey: DateKey): Date {
  return new Date(`${dateKey}T00:00:00Z`);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function monthName(monthKey: MonthKey): string {
  return `${MONTHS[Number(monthKey.slice(5, 7)) - 1]}`;
}

function abbreviatedMonth(monthKey: MonthKey): string {
  return monthName(monthKey).slice(0, 3);
}

/** 'Lunes, 21 de septiembre'. */
export function formatLongDate(dateKey: DateKey): string {
  const date = toUtcDate(dateKey);
  const weekday = WEEKDAYS[date.getUTCDay()];
  const month = MONTHS[date.getUTCMonth()];
  return `${weekday}, ${date.getUTCDate()} de ${month}`;
}

/** 'Septiembre 2026'. */
export function formatMonthYear(monthKey: MonthKey): string {
  return `${capitalize(monthName(monthKey))} ${monthKey.slice(0, 4)}`;
}

/** 'Sep', para los ejes de las gráficas. */
export function formatMonthAbbrev(monthKey: MonthKey): string {
  return capitalize(abbreviatedMonth(monthKey));
}

/** '5 sep'. */
export function formatShortDate(dateKey: DateKey): string {
  return `${Number(dateKey.slice(8, 10))} ${abbreviatedMonth(dateKey)}`;
}

/** '14 – 20 sep 2026', '28 sep – 4 oct 2026' o '29 dic 2025 – 4 ene 2026'. */
export function formatDateRange(from: DateKey, to: DateKey): string {
  const fromYear = from.slice(0, 4);
  const toYear = to.slice(0, 4);
  const end = `${formatShortDate(to)} ${toYear}`;
  if (fromYear !== toYear) {
    return `${formatShortDate(from)} ${fromYear} – ${end}`;
  }
  if (from.slice(0, 7) !== to.slice(0, 7)) {
    return `${formatShortDate(from)} – ${end}`;
  }
  return `${Number(from.slice(8, 10))} – ${end}`;
}

/** 'L', 'M', 'X'… para las columnas de la semana. */
export function formatWeekdayInitial(dateKey: DateKey): string {
  return `${WEEKDAY_INITIALS[toUtcDate(dateKey).getUTCDay()]}`;
}
