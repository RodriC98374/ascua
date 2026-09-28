// Lo que muestra la pantalla "Hoy", calculado con previewDay de @ascua/shared: los mismos números
// que dará el cierre del día. La app no tiene fórmula de puntos propia.
import {
  dayTaskPoints,
  getScheduledHabits,
  isHabitActiveOn,
  isHabitScheduledOn,
  isWeekPowered,
  previewDay,
  weeklyProgress,
  type DailyEntries,
  type DateKey,
  type DayTaskPoints,
  type GamificationState,
  type HabitRecord,
  type Task,
  type WeekLog,
  type WeeklyHabitProgress,
} from '@ascua/shared';

export interface TodayInput {
  today: DateKey;
  habits: readonly HabitRecord[];
  entries: DailyEntries;
  /** Registros de la semana (lunes a hoy), para las marcas de los hábitos semanales. */
  weekLogs?: readonly WeekLog[];
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
  /** Días fijos que hoy no les toca: no cuentan ni castigan, pero siguen en la lista. */
  notToday: HabitRecord[];
  /** N veces por semana: no tienen un día fijo, se pueden marcar cualquier día de la semana. */
  weeklies: WeeklyHabitProgress<HabitRecord>[];
  /** Todos los semanales llegaron a su N: la llama se ve morada hasta el domingo (D20). */
  isWeekPowered: boolean;
  isDone: (habitId: string) => boolean;
  /** Lo hecho hoy de un hábito con cantidad (0 si no tiene marca). */
  countOf: (habitId: string) => number;
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
  weekLogs = [],
  tasks = [],
  state,
}: TodayInput): TodaySummary {
  const preview = previewDay({ dateKey: today, habits, entries, completedTasks: tasks, state });
  const scheduled = [...getScheduledHabits(habits, today)].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const completed = new Set(preview.summary.completedHabitIds);
  const isDone = (habitId: string) => completed.has(habitId);
  const countOf = (habitId: string) => entries[habitId]?.count ?? 0;
  const progressOf = (list: HabitRecord[]): Progress => ({
    done: list.filter((habit) => isDone(habit.id)).length,
    total: list.length,
  });

  const primaries = scheduled.filter((habit) => habit.tier === 'primary');
  const secondaries = scheduled.filter((habit) => habit.tier === 'secondary');
  // De todos los hábitos, no solo los de hoy: un semanal gana puntos sin estar "programado" hoy.
  const tierOf = new Map(habits.map((habit) => [habit.id, habit.tier]));

  const notToday = habits.filter(
    (habit) =>
      habit.schedule.type === 'days_of_week' &&
      isHabitActiveOn(habit, today) &&
      !isHabitScheduledOn(habit, today),
  );
  const weeklyHabits = habits.filter(
    (habit) => habit.schedule.type === 'times_per_week' && isHabitActiveOn(habit, today),
  );
  const weeklies = weeklyProgress(weeklyHabits, today, weekLogs);

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
    hasHabits: scheduled.length > 0 || weeklies.length > 0 || notToday.length > 0,
    primaries,
    secondaries,
    notToday,
    weeklies,
    isWeekPowered: isWeekPowered(weeklies),
    isDone,
    countOf,
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
