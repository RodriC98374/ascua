// Metas a largo plazo (fase 18, D25): agrupan tareas y hábitos. El avance son las tareas
// cumplidas; cada hábito muestra su constancia desde que empezó la meta, con las mismas cifras
// que las estadísticas. Una meta no da puntos.
import { GOAL_HABIT_LOOKBACK_DAYS } from './constants';
import { addDays, daysBetween } from './dates';
import { buildRangeStats, type HabitPeriodStats } from './statistics';
import type { DailyLog, DateKey, Goal, Habit, Task } from './types';

export interface GoalTaskProgress {
  done: number;
  total: number;
  /** 0..1; null si la meta todavía no tiene tareas. */
  rate: number | null;
}

/** Tareas cumplidas de la meta. Las borradas que siguen listadas no cuentan. */
export function goalTaskProgress(goal: Goal, tasks: readonly Task[]): GoalTaskProgress {
  const linked = new Set(goal.taskIds);
  const goalTasks = tasks.filter((task) => linked.has(task.id));
  const done = goalTasks.filter((task) => task.completedDateKey !== null).length;
  return {
    done,
    total: goalTasks.length,
    rate: goalTasks.length > 0 ? done / goalTasks.length : null,
  };
}

/**
 * Días en que se mide la constancia de los hábitos: desde el inicio de la meta (como mucho un año
 * atrás) hasta hoy, o hasta el día en que se logró.
 */
export function goalHabitRange(
  goal: Goal,
  today: DateKey,
): { startDateKey: DateKey; endDateKey: DateKey } {
  const endDateKey = goal.achievedDateKey ?? today;
  const earliest = addDays(endDateKey, 1 - GOAL_HABIT_LOOKBACK_DAYS);
  return {
    startDateKey: goal.startDateKey > earliest ? goal.startDateKey : earliest,
    endDateKey,
  };
}

export interface GoalHabitProgressInput<T extends Habit> {
  goal: Goal;
  /** Todos los hábitos; los de la meta se buscan por ID. */
  habits: readonly T[];
  /** Registros de `goalHabitRange`. */
  logs: readonly DailyLog[];
  today: DateKey;
}

/**
 * Constancia de cada hábito de la meta en los días cerrados de su rango, en el orden de la meta.
 * Un hábito borrado de la lista de hábitos no aparece; uno sin días cerrados, sin porcentaje.
 */
export function goalHabitProgress<T extends Habit>({
  goal,
  habits,
  logs,
  today,
}: GoalHabitProgressInput<T>): HabitPeriodStats<T>[] {
  const byId = new Map(habits.map((habit) => [habit.id, habit]));
  const goalHabits = goal.habitIds.flatMap((id) => {
    const habit = byId.get(id);
    return habit ? [habit] : [];
  });
  const stats = buildRangeStats({
    ...goalHabitRange(goal, today),
    today,
    habits: goalHabits,
    logs,
  });
  const rows = new Map(stats.habits.map((row) => [row.habit.id, row]));
  return goalHabits.map(
    (habit) =>
      rows.get(habit.id) ?? { habit, scheduledDays: 0, completedDays: 0, completionRate: null },
  );
}

export interface GoalDeadline {
  /** 0 el mismo día; negativo si ya pasó. */
  daysLeft: number;
  isOverdue: boolean;
}

/** Cuánto falta para la fecha límite; null sin fecha o si la meta ya no está activa. */
export function goalDeadline(goal: Goal, today: DateKey): GoalDeadline | null {
  if (goal.targetDateKey === null || goal.status !== 'active') return null;
  const daysLeft = daysBetween(today, goal.targetDateKey);
  return { daysLeft, isOverdue: daysLeft < 0 };
}
