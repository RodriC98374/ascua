// Textos del check-in (fase 15, D22): nombre de cada escala y qué significan sus extremos.
import { CHECK_IN_DIMENSIONS, type CheckIn, type CheckInDimension } from '@ascua/shared';

export const CHECK_IN_LABELS: Readonly<
  Record<CheckInDimension, { name: string; low: string; high: string }>
> = {
  mood: { name: 'Ánimo', low: 'Muy mal', high: 'Muy bien' },
  energy: { name: 'Energía', low: 'Sin energía', high: 'A tope' },
  motivation: { name: 'Motivación', low: 'Nada', high: 'Mucha' },
};

/** '3,5' (coma decimal, como se escribe en español); una raya sin respuestas. */
export function formatCheckInAverage(value: number | null): string {
  return value === null ? '—' : value.toFixed(1).replace('.', ',');
}

/** La línea bajo el título de la tarjeta de Hoy. */
export function checkInStatusText(checkIn: CheckIn): string {
  const answered = CHECK_IN_DIMENSIONS.filter((dimension) => checkIn[dimension] !== undefined);
  if (answered.length === 0) return 'Del 1 al 5. No da puntos: es para ver cómo te sientes.';
  const left = CHECK_IN_DIMENSIONS.length - answered.length;
  if (left === 0) return 'Listo por hoy. Lo verás en Mes.';
  return left === 1 ? 'Te falta 1.' : `Te faltan ${left}.`;
}
