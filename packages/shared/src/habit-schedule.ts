import { isoWeekday } from './dates';
import { areHabitStepsDone, habitStepsOf } from './habit-steps';
import type { DailyEntries, DateKey, Habit, HabitEntry } from './types';

/**
 * El hábito existe el día D: D está entre su creación y su archivo, ambos incluidos. Archivar hoy
 * no lo saca de hoy: así no se puede esquivar una racha rota a las 23:59.
 */
export function isHabitActiveOn(habit: Habit, dateKey: DateKey): boolean {
  return (
    habit.startDateKey <= dateKey &&
    (habit.archivedDateKey === null || dateKey <= habit.archivedDateKey)
  );
}

/**
 * El hábito toca el día D: entra en lo programado y, si es principal, en la meta de racha. Uno de
 * N veces por semana nunca toca un día concreto: cuenta solo los días que se marca.
 */
export function isHabitScheduledOn(habit: Habit, dateKey: DateKey): boolean {
  if (!isHabitActiveOn(habit, dateKey)) return false;
  // Exhaustivo: una frecuencia nueva obliga a decidir aquí cómo se programa.
  switch (habit.schedule.type) {
    case 'daily':
      return true;
    case 'days_of_week':
      return habit.schedule.daysOfWeek.includes(isoWeekday(dateKey));
    case 'times_per_week':
      return false;
  }
}

export function getScheduledHabits<T extends Habit>(habits: readonly T[], dateKey: DateKey): T[] {
  return habits.filter((habit) => isHabitScheduledOn(habit, dateKey));
}

/**
 * Cumplido ese día. Con cantidad manda lo hecho (`count`) y con pasos, que estén todos marcados;
 * en los dos casos, no la casilla.
 */
export function isHabitDone(habit: Habit, entry: HabitEntry | undefined): boolean {
  if (habit.target) return (entry?.count ?? 0) >= habit.target.amount;
  if (habitStepsOf(habit).length > 0) return areHabitStepsDone(habit, entry);
  return entry?.completed === true;
}

export interface CountedHabits<T extends Habit> {
  /** Los que tocan ese día: definen la meta de racha y el día perfecto. */
  dayHabits: T[];
  /** Los de N veces por semana cumplidos ese día: suman, pero no entran en la meta. */
  weeklyDone: T[];
  isDone: (habit: T) => boolean;
}

/** Los hábitos que cuentan en el registro de un día, con sus marcas. */
export function countedHabits<T extends Habit>(
  habits: readonly T[],
  dateKey: DateKey,
  entries: DailyEntries,
): CountedHabits<T> {
  const isDone = (habit: T) => isHabitDone(habit, entries[habit.id]);
  return {
    dayHabits: getScheduledHabits(habits, dateKey),
    weeklyDone: habits.filter(
      (habit) =>
        habit.schedule.type === 'times_per_week' &&
        isHabitActiveOn(habit, dateKey) &&
        isDone(habit),
    ),
    isDone,
  };
}
