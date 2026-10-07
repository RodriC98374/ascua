// Días abiertos por la gracia (fase 22, D29): ayer sigue abierto hasta las 00:00 de hoy para marcar
// lo que se olvidó. Funciones puras: las usan el cierre, las reglas de la app y la pantalla "Hoy".
import { EDIT_GRACE_DAYS } from './constants';
import { addDays } from './dates';
import { previewDay } from './day-evaluation';
import type { WeekLog } from './weekly-habits';
import type { DailyEntries, DateKey, GamificationState, Habit } from './types';

/**
 * El último día que ya se puede cerrar hoy. Los `EDIT_GRACE_DAYS` días anteriores a hoy siguen
 * abiertos: se cierran cuando se les acaba la gracia, no antes.
 */
export function lastClosableDateKey(today: DateKey): DateKey {
  return addDays(today, -(EDIT_GRACE_DAYS + 1));
}

/**
 * El día con gracia: ayer, mientras no esté cerrado. Es null si ya se cerró (o si la cuenta es tan
 * nueva que ayer nunca existió: nace con ayer como último día cerrado).
 */
export function graceDateKey(today: DateKey, lastClosedDateKey: DateKey): DateKey | null {
  const yesterday = addDays(today, -1);
  return lastClosedDateKey < yesterday ? yesterday : null;
}

/** Se puede marcar hoy y el día con gracia; cualquier otro día quedó fijo. */
export function isEditableDateKey(
  dateKey: DateKey,
  today: DateKey,
  lastClosedDateKey: DateKey,
): boolean {
  return dateKey === today || dateKey === graceDateKey(today, lastClosedDateKey);
}

export interface GraceDayInput {
  today: DateKey;
  habits: readonly Habit[];
  /** Las marcas del día con gracia (ayer). */
  entries: DailyEntries;
  /** Marcas de la semana de ayer, para el tope de los hábitos de N veces por semana. */
  weekLogs?: readonly WeekLog[];
  /** El estado oficial: el último cierre real. */
  state: GamificationState;
}

/**
 * El estado de hoy si ayer se cerrara ahora mismo con sus marcas actuales. Mientras ayer sigue
 * abierto, la racha y los protectores que ve el usuario salen de aquí, no del estado oficial; si
 * marca algo de ayer, esta cifra cambia al instante. Sin día con gracia, devuelve el estado tal cual.
 */
export function stateAfterGraceDay({
  today,
  habits,
  entries,
  weekLogs,
  state,
}: GraceDayInput): GamificationState {
  const dateKey = graceDateKey(today, state.lastClosedDateKey);
  if (!dateKey) return state;
  return previewDay({ dateKey, habits, entries, ...(weekLogs ? { weekLogs } : {}), state })
    .nextState;
}
