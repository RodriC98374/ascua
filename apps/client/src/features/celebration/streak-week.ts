// La semana de la racha (lunes a domingo) para la celebración, como la fila de días de Duolingo.
import {
  addDays,
  formatWeekdayInitial,
  periodContaining,
  type DailyLog,
  type DateKey,
} from '@ascua/shared';

/**
 * lit: racha sumada (completado o perfecto). frozen: la salvó un protector. missed: se perdió.
 * empty: sin hábitos o sin cerrar. today: hoy, recién asegurado. future: todavía no llega.
 */
export type StreakWeekDayState = 'lit' | 'frozen' | 'missed' | 'empty' | 'today' | 'future';

export interface StreakWeekDay {
  dateKey: DateKey;
  label: string;
  state: StreakWeekDayState;
}

export function buildStreakWeek(today: DateKey, logs: readonly DailyLog[]): StreakWeekDay[] {
  const { startDateKey } = periodContaining('week', today);
  const statusByDate = new Map(logs.map((log) => [log.dateKey, log.status]));
  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = addDays(startDateKey, index);
    return { dateKey, label: formatWeekdayInitial(dateKey), state: stateOf(dateKey) };
  });

  function stateOf(dateKey: DateKey): StreakWeekDayState {
    if (dateKey === today) return 'today';
    if (dateKey > today) return 'future';
    switch (statusByDate.get(dateKey)) {
      case 'completed':
        return 'lit';
      case 'frozen':
        return 'frozen';
      case 'missed':
        return 'missed';
      default:
        return 'empty';
    }
  }
}
