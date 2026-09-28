// Check-in diario (fase 15, D22): ánimo, energía y motivación de 1 a 5. No da puntos ni toca la
// racha; se guarda en el registro del día y se suma al resumen del mes al cerrar el día.
import { CHECK_IN_MAX, CHECK_IN_MIN } from './constants';
import type { CheckIn, CheckInDimension, CheckInStats } from './types';

export const CHECK_IN_DIMENSIONS: readonly CheckInDimension[] = ['mood', 'energy', 'motivation'];

/** Promedio de cada escala; null si no se contestó ningún día. */
export type CheckInAverages = Readonly<Record<CheckInDimension, number | null>>;

export function isCheckInValue(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= CHECK_IN_MIN && (value as number) <= CHECK_IN_MAX;
}

/** Lo que se lee de Firestore: solo las escalas conocidas con valores válidos. */
export function toCheckIn(raw: unknown): CheckIn {
  if (typeof raw !== 'object' || raw === null) return {};
  const source = raw as Record<string, unknown>;
  const checkIn: Partial<Record<CheckInDimension, number>> = {};
  for (const dimension of CHECK_IN_DIMENSIONS) {
    const value = source[dimension];
    if (isCheckInValue(value)) checkIn[dimension] = value;
  }
  return checkIn;
}

/** Las estadísticas después de sumar el check-in de un día. */
export function addCheckIn(before: CheckInStats, checkIn: CheckIn | undefined): CheckInStats {
  const stats = { ...before };
  for (const dimension of CHECK_IN_DIMENSIONS) {
    const value = checkIn?.[dimension];
    if (value === undefined) continue;
    const current = stats[dimension] ?? { days: 0, total: 0 };
    stats[dimension] = { days: current.days + 1, total: current.total + value };
  }
  return stats;
}

export function mergeCheckInStats(a: CheckInStats, b: CheckInStats): CheckInStats {
  const stats = { ...a };
  for (const dimension of CHECK_IN_DIMENSIONS) {
    const extra = b[dimension];
    if (!extra) continue;
    const current = stats[dimension] ?? { days: 0, total: 0 };
    stats[dimension] = { days: current.days + extra.days, total: current.total + extra.total };
  }
  return stats;
}

export function checkInAverages(stats: CheckInStats): CheckInAverages {
  const averageOf = (dimension: CheckInDimension) => {
    const value = stats[dimension];
    return value && value.days > 0 ? value.total / value.days : null;
  };
  return { mood: averageOf('mood'), energy: averageOf('energy'), motivation: averageOf('motivation') };
}

/** El promedio de varios días, escala por escala, contando solo los días que la contestaron. */
export function averageCheckIns(checkIns: readonly CheckIn[]): CheckInAverages {
  return checkInAverages(checkIns.reduce<CheckInStats>(addCheckIn, {}));
}
