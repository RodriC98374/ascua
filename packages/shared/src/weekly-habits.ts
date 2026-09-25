// Hábitos de N veces por semana (fase 16, D20). Las semanas van de lunes a domingo. No tocan la
// racha: suman puntos hasta N marcas por semana y, si todos llegan a su N, la semana queda
// potenciada (la llama se ve morada hasta el domingo).
import { addDays, dateKeyRange, startOfWeek } from './dates';
import { isHabitActiveOn, isHabitDone } from './habit-schedule';
import type { DailyLog, DateKey, Habit } from './types';

/**
 * Marcas que se esperan de un hábito de N veces por semana en `activeDays` días: N por cada 7,
 * redondeado. Las estadísticas lo miden contra esto.
 */
export function expectedWeeklyMarks(timesPerWeek: number, activeDays: number): number {
  return Math.round((timesPerWeek * activeDays) / 7);
}

/** Lo que hace falta de un registro diario para contar las marcas de la semana. */
export type WeekLog = Pick<DailyLog, 'dateKey' | 'entries'>;

/**
 * Cuántas veces se cumplió el hábito en los días de la semana de `dateKey` anteriores a él. Los
 * registros de otras semanas, del mismo día o posteriores se ignoran.
 */
export function weekCompletions(
  habit: Habit,
  dateKey: DateKey,
  weekLogs: readonly WeekLog[],
): number {
  const weekStart = startOfWeek(dateKey);
  return weekLogs.filter(
    (log) =>
      log.dateKey >= weekStart &&
      log.dateKey < dateKey &&
      isHabitActiveOn(habit, log.dateKey) &&
      isHabitDone(habit, log.entries[habit.id]),
  ).length;
}

export interface WeeklyHabitProgress<T extends Habit> {
  habit: T;
  /** Marcas de la semana hasta hoy, hoy incluido. */
  count: number;
  /** Lo que pide esta semana: N, o menos si el hábito empezó a mitad de semana. */
  target: number;
  isMet: boolean;
  /** Si marcarlo hoy suma: los días anteriores todavía no llegaron a N. */
  earnsPointsToday: boolean;
}

/** Cómo va cada hábito semanal que existe hoy, con las marcas de la semana (hoy incluido). */
export function weeklyProgress<T extends Habit>(
  habits: readonly T[],
  today: DateKey,
  weekLogs: readonly WeekLog[],
): WeeklyHabitProgress<T>[] {
  const weekDays = dateKeyRange(startOfWeek(today), addDays(startOfWeek(today), 6));
  const todayEntries = weekLogs.find((log) => log.dateKey === today)?.entries ?? {};
  return habits.flatMap((habit) => {
    const schedule = habit.schedule;
    if (schedule.type !== 'times_per_week' || !isHabitActiveOn(habit, today)) return [];
    const before = weekCompletions(habit, today, weekLogs);
    const count = before + (isHabitDone(habit, todayEntries[habit.id]) ? 1 : 0);
    const activeDays = weekDays.filter((dateKey) => isHabitActiveOn(habit, dateKey)).length;
    const target = Math.min(schedule.timesPerWeek, activeDays);
    return [
      {
        habit,
        count,
        target,
        isMet: count >= target,
        earnsPointsToday: before < schedule.timesPerWeek,
      },
    ];
  });
}

/** Semana potenciada: todos los semanales llegaron a lo que pide la semana. La llama se ve morada. */
export function isWeekPowered(progress: readonly WeeklyHabitProgress<Habit>[]): boolean {
  return progress.length > 0 && progress.every((item) => item.isMet);
}
