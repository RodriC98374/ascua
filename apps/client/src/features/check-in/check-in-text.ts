// Textos del check-in (fase 15, D22): nombre de cada escala y qué significa cada nivel.
import {
  CHECK_IN_DIMENSIONS,
  CHECK_IN_MIN,
  type CheckIn,
  type CheckInDimension,
} from '@ascua/shared';

type Levels = readonly [string, string, string, string, string];

export const CHECK_IN_LABELS: Readonly<Record<CheckInDimension, { name: string; levels: Levels }>> =
  {
    mood: { name: 'Ánimo', levels: ['Muy mal', 'Mal', 'Normal', 'Bien', 'Muy bien'] },
    energy: { name: 'Energía', levels: ['Sin energía', 'Poca', 'Normal', 'Buena', 'A tope'] },
    motivation: { name: 'Motivación', levels: ['Nada', 'Poca', 'Algo', 'Bastante', 'Mucha'] },
  };

/** El nivel elegido en palabras ("Bien", "A tope"), junto al nombre de la escala. */
export function checkInLevelLabel(dimension: CheckInDimension, value: number | null): string {
  if (value === null) return 'Sin responder';
  return CHECK_IN_LABELS[dimension].levels[value - CHECK_IN_MIN] ?? String(value);
}

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
