// Cierre de un día: decide el estado, los puntos y la racha. Función pura: no lee ni escribe
// Firestore. La usan tanto `closePendingDays` (cierre real) como la pantalla "Hoy" (vista previa),
// así lo que ve el usuario durante el día es exactamente lo que acreditará el cierre.
import { HABIT_POINTS, PERFECT_DAY_BONUS, STREAK_BONUSES } from './constants';
import { addDays } from './dates';
import { getScheduledHabits } from './habit-schedule';
import { transactionIds } from './transaction-ids';
import type {
  ClosedDayStatus,
  DailyEntries,
  DateKey,
  GamificationState,
  Habit,
  PointTransaction,
} from './types';

export interface EvaluateDayInput {
  dateKey: DateKey;
  /** Todos los hábitos del usuario (activos y archivados); se filtran los programados ese día. */
  habits: readonly Habit[];
  entries: DailyEntries;
  /** Estado antes de cerrar este día. */
  state: GamificationState;
}

export interface DaySummary {
  scheduledHabitIds: string[];
  scheduledPrimaryHabitIds: string[];
  completedHabitIds: string[];
  /** 0..1 sobre los hábitos programados. */
  completionRate: number;
  isPerfectDay: boolean;
  pointsEarned: number;
  streakAfterClose: number;
}

export interface DayEvaluation {
  dateKey: DateKey;
  status: ClosedDayStatus;
  /** La meta de racha del día (todos los principales) está cumplida. */
  isGoalMet: boolean;
  freezeUsed: boolean;
  summary: DaySummary;
  /** Movimientos en orden: hábitos, día perfecto y bonos de racha, con saldo acumulado. */
  transactions: PointTransaction[];
  nextState: GamificationState;
}

type PendingTransaction = Omit<PointTransaction, 'balanceAfter' | 'dateKey'>;

export function evaluateDay({ dateKey, habits, entries, state }: EvaluateDayInput): DayEvaluation {
  const expectedDateKey = addDays(state.lastClosedDateKey, 1);
  if (dateKey !== expectedDateKey) {
    throw new Error(`Solo se puede cerrar el día ${expectedDateKey}, no ${dateKey}.`);
  }

  const scheduled = getScheduledHabits(habits, dateKey);
  const isCompleted = (habit: Habit) => entries[habit.id]?.completed === true;
  const completed = scheduled.filter(isCompleted);
  const primaries = scheduled.filter((habit) => habit.tier === 'primary');
  // Sin principales, la meta pasan a ser todos los hábitos programados.
  const goalHabits = primaries.length > 0 ? primaries : scheduled;

  const hasHabits = scheduled.length > 0;
  const isGoalMet = hasHabits && goalHabits.every(isCompleted);
  const isPerfectDay = hasHabits && completed.length === scheduled.length;

  const pending: PendingTransaction[] = completed.map((habit) => ({
    id: transactionIds.habitCompletion(dateKey, habit.id),
    type: 'habit_completion',
    amount: HABIT_POINTS[habit.tier],
    sourceType: 'habit',
    sourceId: habit.id,
    description: `Hábito cumplido: ${habit.name}`,
  }));

  let status: ClosedDayStatus;
  let freezeUsed = false;
  let streak = {
    currentStreak: state.currentStreak,
    currentStreakStartDateKey: state.currentStreakStartDateKey,
    longestStreak: state.longestStreak,
    daysWithoutFreeze: state.daysWithoutFreeze,
    streakFreezesAvailable: state.streakFreezesAvailable,
    totalStreakFreezesUsed: state.totalStreakFreezesUsed,
  };

  if (!hasHabits) {
    status = 'inactive';
  } else if (isGoalMet) {
    status = 'completed';
    const currentStreak = streak.currentStreak + 1;
    const daysWithoutFreeze = streak.daysWithoutFreeze + 1;
    streak = {
      ...streak,
      currentStreak,
      currentStreakStartDateKey:
        streak.currentStreak === 0 ? dateKey : streak.currentStreakStartDateKey,
      longestStreak: Math.max(streak.longestStreak, currentStreak),
      daysWithoutFreeze,
    };

    if (isPerfectDay) {
      pending.push({
        id: transactionIds.perfectDay(dateKey),
        type: 'perfect_day_bonus',
        amount: PERFECT_DAY_BONUS,
        sourceType: 'daily_log',
        sourceId: dateKey,
        description: 'Día perfecto',
      });
    }

    for (const bonus of STREAK_BONUSES) {
      if (daysWithoutFreeze % bonus.everyDays === 0) {
        pending.push({
          id: transactionIds.streakBonus(bonus.everyDays, dateKey),
          type: bonus.type,
          amount: bonus.points,
          sourceType: 'daily_log',
          sourceId: dateKey,
          description: `Racha de ${bonus.everyDays} días sin protector`,
        });
      }
    }
  } else if (streak.currentStreak > 0 && streak.streakFreezesAvailable > 0) {
    // Se usa un protector solo si hay una racha que proteger.
    status = 'frozen';
    freezeUsed = true;
    streak = {
      ...streak,
      daysWithoutFreeze: 0,
      streakFreezesAvailable: streak.streakFreezesAvailable - 1,
      totalStreakFreezesUsed: streak.totalStreakFreezesUsed + 1,
    };
  } else {
    status = 'missed';
    streak = { ...streak, currentStreak: 0, currentStreakStartDateKey: null, daysWithoutFreeze: 0 };
  }

  let balance = state.pointsBalance;
  const transactions: PointTransaction[] = pending.map((transaction) => {
    balance += transaction.amount;
    return { ...transaction, dateKey, balanceAfter: balance };
  });
  const pointsEarned = balance - state.pointsBalance;

  return {
    dateKey,
    status,
    isGoalMet,
    freezeUsed,
    summary: {
      scheduledHabitIds: scheduled.map((habit) => habit.id),
      scheduledPrimaryHabitIds: primaries.map((habit) => habit.id),
      completedHabitIds: completed.map((habit) => habit.id),
      completionRate: hasHabits ? completed.length / scheduled.length : 0,
      isPerfectDay,
      pointsEarned,
      streakAfterClose: streak.currentStreak,
    },
    transactions,
    nextState: {
      ...state,
      ...streak,
      pointsBalance: balance,
      lifetimePointsEarned: state.lifetimePointsEarned + pointsEarned,
      lastClosedDateKey: dateKey,
    },
  };
}
