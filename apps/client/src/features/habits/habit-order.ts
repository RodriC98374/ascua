// Orden de los hábitos en Hoy: principales primero, cada grupo por su sortOrder. Mover un hábito
// solo lo cambia de lugar dentro de su grupo.
import type { HabitRecord } from '@ascua/shared';

export type MoveOffset = -1 | 1;

function activeGroups(habits: readonly HabitRecord[]) {
  const active = habits
    .filter((habit) => habit.status === 'active')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return [
    active.filter((habit) => habit.tier === 'primary').map((habit) => habit.id),
    active.filter((habit) => habit.tier === 'secondary').map((habit) => habit.id),
  ];
}

export function canMove(habits: readonly HabitRecord[], habitId: string, offset: MoveOffset) {
  return activeGroups(habits).some((group) => {
    const index = group.indexOf(habitId);
    return index !== -1 && group[index + offset] !== undefined;
  });
}

/** IDs de todos los hábitos activos en su nuevo orden, listos para `reorderHabits`. */
export function moveHabit(
  habits: readonly HabitRecord[],
  habitId: string,
  offset: MoveOffset,
): string[] {
  const groups = activeGroups(habits);
  for (const group of groups) {
    const index = group.indexOf(habitId);
    const target = index + offset;
    if (index !== -1 && target >= 0 && target < group.length) {
      [group[index], group[target]] = [group[target]!, group[index]!];
    }
  }
  return groups.flat();
}
