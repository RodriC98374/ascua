// Validación del formulario de hábitos. Las reglas de Firestore validan la forma; esto da
// mensajes claros antes de escribir y cubre lo que las reglas no pueden (contar principales).
import {
  canBePrimary,
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_NAME_MAX_LENGTH,
  HABIT_NAME_MIN_LENGTH,
  MAX_PRIMARY_HABITS,
  type HabitRecord,
  type HabitTier,
} from '@ascua/shared';

export interface HabitDraft {
  name: string;
  description: string;
  tier: HabitTier;
}

export type HabitErrors = Partial<Record<keyof HabitDraft, string>>;

interface ValidationContext {
  habits: readonly HabitRecord[];
  /** Al editar: el hábito que se edita, para no compararlo consigo mismo. */
  habitId?: string;
}

const normalize = (name: string) => name.trim().toLocaleLowerCase('es');

export function validateHabit(draft: HabitDraft, { habits, habitId }: ValidationContext) {
  const errors: HabitErrors = {};
  const name = draft.name.trim();

  if (name === '') errors.name = 'Escribe un nombre para tu hábito.';
  else if (name.length < HABIT_NAME_MIN_LENGTH)
    errors.name = `El nombre necesita al menos ${HABIT_NAME_MIN_LENGTH} caracteres.`;
  else if (name.length > HABIT_NAME_MAX_LENGTH)
    errors.name = `El nombre puede tener hasta ${HABIT_NAME_MAX_LENGTH} caracteres.`;
  else if (
    habits.some(
      (habit) =>
        habit.status === 'active' &&
        habit.id !== habitId &&
        normalize(habit.name) === normalize(name),
    )
  )
    errors.name = 'Ya tienes un hábito activo con ese nombre.';

  if (draft.description.trim().length > HABIT_DESCRIPTION_MAX_LENGTH)
    errors.description = `La descripción puede tener hasta ${HABIT_DESCRIPTION_MAX_LENGTH} caracteres.`;

  if (draft.tier === 'primary' && !canBePrimary(habits, habitId))
    errors.tier = `Ya tienes ${MAX_PRIMARY_HABITS} hábitos principales. Elige secundario.`;

  return errors;
}

export function hasErrors(errors: HabitErrors): boolean {
  return Object.keys(errors).length > 0;
}
