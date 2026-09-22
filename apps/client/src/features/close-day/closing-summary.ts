// Qué se le cuenta al usuario después de cerrar sus días pendientes. Tono del sistema de diseño:
// celebra lo logrado, cifras con contexto y nunca "fallaste".
import { formatLongDate } from '@ascua/shared';

import type { ClosedDay } from '../../operations/close-pending-days';

export interface ClosingSummary {
  title: string;
  details: string[];
}

/** null cuando no hay nada que contar (nada cerrado, o solo días sin hábitos). */
export function describeClosing(days: readonly ClosedDay[]): ClosingSummary | null {
  if (days.every((day) => day.status === 'inactive')) return null;

  const title =
    days.length === 1 ? 'Cerramos el día de ayer' : `Cerramos tus últimos ${days.length} días`;
  const details: string[] = [];

  const points = days.reduce((total, day) => total + day.pointsEarned, 0);
  if (points > 0) {
    details.push(
      points === 1 ? '+1 punto pasó a tu saldo.' : `+${points} puntos pasaron a tu saldo.`,
    );
  }

  const frozen = days.filter((day) => day.freezeUsed);
  if (frozen.length === 1) {
    details.push(
      `Un protector cuidó tu racha el ${formatLongDate(frozen[0]!.dateKey).toLowerCase()}.`,
    );
  } else if (frozen.length > 1) {
    details.push(`${frozen.length} protectores cuidaron tu racha.`);
  }

  const last = days.at(-1)!;
  const wasLost = days.some((day) => day.status === 'missed' && day.streakBeforeClose > 0);
  if (last.streakAfterClose === 0) {
    if (wasLost) details.push('Tu racha volvió a empezar. Hoy puedes encenderla de nuevo.');
  } else {
    const streak = last.streakAfterClose === 1 ? '1 día' : `${last.streakAfterClose} días`;
    details.push(
      last.status === 'frozen' ? `Tu racha sigue en ${streak}.` : `Tu racha va en ${streak}.`,
    );
  }

  return { title, details };
}

export type ClosingErrorKind = 'offline' | 'rejected' | 'unknown';

export function closingErrorKind(error: unknown): ClosingErrorKind {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === 'unavailable') return 'offline';
  if (code === 'permission-denied') return 'rejected';
  return 'unknown';
}
