import type { DateKey, Habit } from './types';

/**
 * Un hábito cuenta el día D si D está entre su creación y su archivo, ambos incluidos.
 * Archivar hoy no lo saca de hoy: así no se puede esquivar una racha rota a las 23:59.
 */
export function isHabitScheduledOn(habit: Habit, dateKey: DateKey): boolean {
  const isWithinLifetime =
    habit.startDateKey <= dateKey &&
    (habit.archivedDateKey === null || dateKey <= habit.archivedDateKey);

  // Exhaustivo: una frecuencia nueva obliga a decidir aquí cómo se programa.
  switch (habit.schedule.type) {
    case 'daily':
      return isWithinLifetime;
  }
}

export function getScheduledHabits<T extends Habit>(habits: readonly T[], dateKey: DateKey): T[] {
  return habits.filter((habit) => isHabitScheduledOn(habit, dateKey));
}
