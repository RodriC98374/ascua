// Lo que muestra la pantalla "Hoy", calculado con previewDay de @ascua/shared: los mismos números
// que dará el cierre del día. La app no tiene fórmula de puntos propia.
import {
  dayTaskPoints,
  getScheduledHabits,
  previewDay,
  type DailyEntries,
  type DateKey,
  type DayTaskPoints,
  type GamificationState,
  type HabitRecord,
  type Task,
} from '@ascua/shared';

export interface TodayInput {
  today: DateKey;
  habits: readonly HabitRecord[];
  entries: DailyEntries;
  /** Tareas de Hoy; las cumplidas hoy suman puntos (con tope), sin tocar la racha. */
  tasks?: readonly Task[];
  state: GamificationState;
}

interface Progress {
  done: number;
  total: number;
}

export interface TodaySummary {
  hasHabits: boolean;
  primaries: HabitRecord[];
  secondaries: HabitRecord[];
  isDone: (habitId: string) => boolean;
  primaryProgress: Progress;
  secondaryProgress: Progress;
  /** 0..100 sobre todos los hábitos de hoy, redondeado. */
  progressPercent: number;
  isGoalMet: boolean;
  isPerfectDay: boolean;
  /** Racha actual; incluye hoy en cuanto se cumple la meta. */
  streakDays: number;
  /** Mejor racha, también con hoy en cuanto se cumple la meta (las insignias salen de aquí). */
  longestStreak: number;
  pointsToday: number;
  pointsBreakdown: {
    primary: number;
    secondary: number;
    perfectDay: number;
    streak: number;
    tasks: number;
  };
  /** Las tareas de hoy frente al tope diario. */
  taskPoints: DayTaskPoints;
}

export function buildTodaySummary({
  today,
  habits,
  entries,
  tasks = [],
  state,
}: TodayInput): TodaySummary {
  const preview = previewDay({ dateKey: today, habits, entries, completedTasks: tasks, state });
  const scheduled = [...getScheduledHabits(habits, today)].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const completed = new Set(preview.summary.completedHabitIds);
  const isDone = (habitId: string) => completed.has(habitId);
  const progressOf = (list: HabitRecord[]): Progress => ({
    done: list.filter((habit) => isDone(habit.id)).length,
    total: list.length,
  });

  const primaries = scheduled.filter((habit) => habit.tier === 'primary');
  const secondaries = scheduled.filter((habit) => habit.tier === 'secondary');
  const tierOf = new Map(scheduled.map((habit) => [habit.id, habit.tier]));

  const pointsBreakdown = { primary: 0, secondary: 0, perfectDay: 0, streak: 0, tasks: 0 };
  for (const transaction of preview.transactions) {
    if (transaction.type === 'habit_completion') {
      const tier = tierOf.get(transaction.sourceId ?? '');
      if (tier) pointsBreakdown[tier] += transaction.amount;
    } else if (transaction.type === 'perfect_day_bonus') {
      pointsBreakdown.perfectDay += transaction.amount;
    } else if (transaction.type === 'task_completion') {
      pointsBreakdown.tasks += transaction.amount;
    } else {
      pointsBreakdown.streak += transaction.amount;
    }
  }

  return {
    hasHabits: scheduled.length > 0,
    primaries,
    secondaries,
    isDone,
    primaryProgress: progressOf(primaries),
    secondaryProgress: progressOf(secondaries),
    progressPercent: Math.round(preview.summary.completionRate * 100),
    isGoalMet: preview.isGoalMet,
    isPerfectDay: preview.summary.isPerfectDay,
    streakDays: preview.isGoalMet ? preview.nextState.currentStreak : state.currentStreak,
    longestStreak: preview.isGoalMet ? preview.nextState.longestStreak : state.longestStreak,
    pointsToday: preview.summary.pointsEarned,
    pointsBreakdown,
    taskPoints: dayTaskPoints(tasks, today),
  };
}
