import { MAX_PRIMARY_HABITS } from './constants';
import type { Habit } from './types';

/**
 * Si un hábito puede ser principal sin pasar de MAX_PRIMARY_HABITS activos. Al editar, se pasa
 * su ID para no contarlo dos veces. Solo lo valida la UI: las reglas no pueden contar documentos.
 */
export function canBePrimary(habits: readonly Habit[], editingHabitId?: string): boolean {
  const otherActivePrimaries = habits.filter(
    (habit) => habit.status === 'active' && habit.tier === 'primary' && habit.id !== editingHabitId,
  );
  return otherActivePrimaries.length < MAX_PRIMARY_HABITS;
}
