import type { DateKey } from '@ascua/shared';

// Nombres propios en vez de Intl: el soporte de locales en Android (Hermes) no es uniforme.
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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

/** 'Lunes, 21 de septiembre'. El DateKey ya es un día de Bolivia: se lee como fecha en UTC. */
export function formatLongDate(dateKey: DateKey): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const weekday = WEEKDAYS[date.getUTCDay()];
  const month = MONTHS[date.getUTCMonth()];
  return `${weekday}, ${date.getUTCDate()} de ${month}`;
}
