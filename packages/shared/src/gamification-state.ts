import { addDays } from './dates';
import type { DateKey, GamificationState } from './types';

/**
 * Estado con el que nace la cuenta (`initializeAccount`). El último día cerrado es ayer:
 * así el primer cierre será el de hoy y ningún día anterior a la cuenta cuenta como perdido.
 */
export function initialGamificationState(todayDateKey: DateKey): GamificationState {
  return {
    pointsBalance: 0,
    lifetimePointsEarned: 0,
    lifetimePointsSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    currentStreakStartDateKey: null,
    daysWithoutFreeze: 0,
    streakFreezesAvailable: 0,
    totalStreakFreezesUsed: 0,
    lastClosedDateKey: addDays(todayDateKey, -1),
    lastSpendTransactionId: null,
  };
}
